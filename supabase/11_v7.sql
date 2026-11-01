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
