-- 5단계: 교환일기 (PRD #4.2, #9)
-- 05 다음에 SQL Editor에서 실행한다. 여러 번 실행해도 된다.

-- 5-1 짝 찾기: 내가 이미 기다리는 교환일기장 → 남이 기다리는 교환일기장 → 새로 만들기 순
-- 5-3 먼저 온 사람은 파란 펜, 짝은 주황 펜
create or replace function public.find_diary_partner()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_diary uuid;
begin
  if v_user is null then
    raise exception '로그인 세션이 없어요';
  end if;

  -- 1) 이미 짝을 기다리는 내 교환일기장이 있으면 그것을 돌려준다 (같은 사람끼리 짝이 되지 않게)
  select d.id into v_diary
  from public.diaries d
  join public.diary_members m on m.diary_id = d.id
  where d.mode = 'exchange' and d.status = 'waiting' and m.user_id = v_user
  order by d.created_at
  limit 1;
  if v_diary is not null then
    return v_diary;
  end if;

  -- 2) 다른 사람이 기다리는 가장 오래된 교환일기장. 동시에 두 사람이 들어가지 않게 잠근다
  select d.id into v_diary
  from public.diaries d
  where d.mode = 'exchange' and d.status = 'waiting'
    and not exists (
      select 1 from public.diary_members m
      where m.diary_id = d.id and m.user_id = v_user
    )
  order by d.created_at
  limit 1
  for update skip locked;

  if v_diary is not null then
    insert into public.diary_members (diary_id, user_id, alias, pen_color)
    values (v_diary, v_user, '주황 펜', 'orange');
    update public.diaries set status = 'active' where id = v_diary;
    return v_diary;
  end if;

  -- 3) 없으면 새 교환일기장을 만들고 짝을 기다린다
  insert into public.diaries (mode, status)
  values ('exchange', 'waiting')
  returning id into v_diary;

  insert into public.diary_members (diary_id, user_id, alias, pen_color)
  values (v_diary, v_user, '파란 펜', 'blue');

  return v_diary;
end;
$$;

revoke all on function public.find_diary_partner() from public, anon;
grant execute on function public.find_diary_partner() to authenticated;

-- 5-4 교대 작성: 교환일기는 짝이 생긴 뒤(active)에만, 마지막 일기가 내 글이 아닐 때만 쓸 수 있다
create or replace function public.can_write_diary(did uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_diary_member(did)
    and exists (
      select 1 from public.diaries d
      where d.id = did
        and (
          d.mode = 'solo'
          or (
            d.status = 'active'
            and coalesce(
              (select e.user_id from public.diary_entries e
               where e.diary_id = did
               order by e.created_at desc
               limit 1),
              '00000000-0000-0000-0000-000000000000'::uuid
            ) <> auth.uid()
          )
        )
    );
$$;

revoke all on function public.can_write_diary(uuid) from public;
grant execute on function public.can_write_diary(uuid) to authenticated;

drop policy if exists "diary_entries: 같은 일기장 멤버만 쓰기" on public.diary_entries;
create policy "diary_entries: 같은 일기장 멤버만 쓰기" on public.diary_entries
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_write_diary(diary_id));

-- 5-6 홈 "내 일기장" 목록: 편 수, 마지막 작성자, 내 차례 여부를 한 번에 (RLS를 그대로 따르는 invoker 함수)
create or replace function public.my_diaries()
returns table (
  id uuid,
  mode text,
  status text,
  created_at timestamptz,
  entry_count bigint,
  my_turn boolean
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
    d.created_at,
    (select count(*) from public.diary_entries e where e.diary_id = d.id) as entry_count,
    (
      d.mode = 'exchange'
      and d.status = 'active'
      and coalesce(
        (select e.user_id from public.diary_entries e
         where e.diary_id = d.id
         order by e.created_at desc
         limit 1),
        '00000000-0000-0000-0000-000000000000'::uuid
      ) <> auth.uid()
    ) as my_turn
  from public.diaries d
  join public.diary_members m on m.diary_id = d.id and m.user_id = auth.uid()
  order by m.joined_at desc;
$$;

revoke all on function public.my_diaries() from public, anon;
grant execute on function public.my_diaries() to authenticated;
