-- 10단계 (10_v6 다음에 실행. 여러 번 실행해도 된다)
-- 10-1 로그인 없이 쓰는 복구 수단: "나만의 열쇠"
--
-- 로그인이 없어서 브라우저를 바꾸면 새 익명 계정이 생긴다. 열쇠를 미리 만들어 두면,
-- 새 브라우저(새 익명 계정)에서 열쇠를 넣었을 때 옛 계정의 방·일기장·글을 모두 새 계정으로 옮긴다.
-- 열쇠는 DB에 원문이 아니라 해시(sha256)로만 저장한다.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.recovery_keys (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  key_hash    text not null unique,
  created_at  timestamptz not null default now(),
  used_at     timestamptz
);
-- 함수로만 다룬다 (앱에서 직접 읽거나 쓸 수 없다)
alter table public.recovery_keys enable row level security;
revoke all on public.recovery_keys from anon, authenticated;

create or replace function public.normalize_key(p_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_key, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- 내 열쇠가 있는지 (만든 날짜만 알려준다)
create or replace function public.my_recovery_key()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select created_at from public.recovery_keys where user_id = auth.uid();
$$;

-- 새 열쇠 만들기: 12자(헷갈리는 0/O, 1/I/L 제외). 다시 만들면 옛 열쇠는 더 이상 쓸 수 없다.
create or replace function public.create_recovery_key()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  raw text := '';
  bytes bytea := extensions.gen_random_bytes(12);
begin
  if auth.uid() is null then raise exception '로그인 세션이 없어요'; end if;
  for i in 0..11 loop
    raw := raw || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
  end loop;
  insert into public.recovery_keys (user_id, key_hash)
  values (auth.uid(), encode(extensions.digest(raw, 'sha256'), 'hex'))
  on conflict (user_id) do update set key_hash = excluded.key_hash, created_at = now(), used_at = null;
  return substr(raw, 1, 4) || '-' || substr(raw, 5, 4) || '-' || substr(raw, 9, 4);
end;
$$;

-- 열쇠로 되찾기: 옛 계정의 모든 기록을 지금 계정으로 옮긴다
create or replace function public.claim_recovery_key(p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new uuid := auth.uid();
  v_old uuid;
begin
  if v_new is null then raise exception '로그인 세션이 없어요'; end if;
  select user_id into v_old
  from public.recovery_keys
  where key_hash = encode(extensions.digest(public.normalize_key(p_key), 'sha256'), 'hex');
  if v_old is null then
    raise exception '맞지 않는 열쇠예요. 다시 확인해 주세요';
  end if;
  if v_old = v_new then
    return; -- 이미 이 브라우저의 열쇠
  end if;

  -- 같은 방·일기장에 두 계정이 다 들어가 있으면 새 계정 쪽을 비운다
  delete from public.room_members n using public.room_members o
    where n.user_id = v_new and o.user_id = v_old and n.room_id = o.room_id;
  delete from public.diary_members n using public.diary_members o
    where n.user_id = v_new and o.user_id = v_old and n.diary_id = o.diary_id;
  delete from public.unlocks n using public.unlocks o
    where n.user_id = v_new and o.user_id = v_old and n.room_id = o.room_id and n.paragraph_index = o.paragraph_index;
  delete from public.letters n using public.letters o
    where n.user_id = v_new and o.user_id = v_old and n.room_id = o.room_id;

  update public.room_members      set user_id = v_new where user_id = v_old;
  update public.notes             set user_id = v_new where user_id = v_old;
  update public.unlocks           set user_id = v_new where user_id = v_old;
  update public.highlights        set user_id = v_new where user_id = v_old;
  update public.highlight_replies set user_id = v_new where user_id = v_old;
  update public.letters           set user_id = v_new where user_id = v_old;
  update public.diary_members     set user_id = v_new where user_id = v_old;
  update public.diary_entries     set user_id = v_new where user_id = v_old;
  update public.diary_comments    set user_id = v_new where user_id = v_old;

  -- 열쇠도 새 계정으로 (같은 열쇠로 또 옮겨 갈 수 있게)
  delete from public.recovery_keys where user_id = v_new;
  update public.recovery_keys set user_id = v_new, used_at = now() where user_id = v_old;
end;
$$;

revoke all on function public.normalize_key(text) from public, anon;
revoke all on function public.my_recovery_key() from public, anon;
revoke all on function public.create_recovery_key() from public, anon;
revoke all on function public.claim_recovery_key(text) from public, anon;
grant execute on function public.my_recovery_key() to authenticated;
grant execute on function public.create_recovery_key() to authenticated;
grant execute on function public.claim_recovery_key(text) to authenticated;

-- 10-2 짝이 멀어졌을 때: 교환일기를 "마무리"한다 (둘 다 지난 일기는 계속 볼 수 있고, 새로 쓸 수는 없다)
create or replace function public.close_diary(p_diary uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_diary_member(p_diary) then
    raise exception '들어가 있지 않은 일기장이에요';
  end if;
  update public.diaries set status = 'closed' where id = p_diary and mode = 'exchange' and status = 'active';
end;
$$;
revoke all on function public.close_diary(uuid) from public, anon;
grant execute on function public.close_diary(uuid) to authenticated;

-- 홈 "내 일기장"에 마지막 일기 시각도 함께 (짝이 오래 조용하면 표시하려고)
drop function if exists public.my_diaries();
create function public.my_diaries()
returns table (
  id uuid,
  mode text,
  status text,
  title text,
  created_at timestamptz,
  entry_count bigint,
  my_turn boolean,
  last_entry_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    d.id,
    d.mode,
    d.status,
    d.title,
    d.created_at,
    (select count(*) from public.diary_entries e where e.diary_id = d.id) as entry_count,
    (
      d.mode = 'exchange'
      and d.status = 'active'
      and coalesce(
        (select e.user_id from public.diary_entries e where e.diary_id = d.id order by e.created_at desc limit 1),
        '00000000-0000-0000-0000-000000000000'::uuid
      ) <> auth.uid()
    ) as my_turn,
    (select max(e.created_at) from public.diary_entries e where e.diary_id = d.id) as last_entry_at
  from public.diaries d
  join public.diary_members m on m.diary_id = d.id and m.user_id = auth.uid() and m.left_at is null
  order by m.joined_at desc;
$$;
revoke all on function public.my_diaries() from public, anon;
grant execute on function public.my_diaries() to authenticated;
