-- 7-10 일기장 나가기 (08 다음에 실행. 여러 번 실행해도 된다)
-- - 혼자 쓰는 일기장, 아직 짝이 없는 교환일기: 일기장째 지운다.
-- - 짝이 있는 교환일기: 나는 빠지고 일기장은 "끝남(closed)"이 된다. 남은 짝은 지난 일기를 계속 볼 수 있지만 새로 쓸 수는 없다.
--   주고받은 일기는 두 사람의 것이라, 내가 나가도 짝 쪽에서 지우지 않는다. 둘 다 나가면 일기장을 지운다.

alter table public.diary_members add column if not exists left_at timestamptz;

alter table public.diaries drop constraint if exists diaries_status_check;
alter table public.diaries add constraint diaries_status_check check (status in ('waiting', 'active', 'closed'));

-- 나간 사람은 더 이상 멤버가 아니다 (읽기·쓰기 권한이 모두 이 함수를 따른다)
create or replace function public.is_diary_member(did uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.diary_members
    where diary_id = did and user_id = auth.uid() and left_at is null
  );
$$;

-- 홈 "내 일기장": 나간 일기장은 빼고, 끝난 일기장은 status = closed로 보인다
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
  join public.diary_members m on m.diary_id = d.id and m.user_id = auth.uid() and m.left_at is null
  order by m.joined_at desc;
$$;

-- 코드로 들어가기: 끝난 교환일기에는 들어갈 수 없다 (07의 join_by_code 갱신)
create or replace function public.join_by_code(p_code text)
returns table (kind text, id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_room uuid;
  v_diary uuid;
  v_status text;
begin
  if v_user is null then raise exception '로그인 세션이 없어요'; end if;

  select r.id into v_room from public.rooms r where r.invite_code = v_code for update;
  if v_room is not null then
    if not exists (select 1 from public.room_members m where m.room_id = v_room and m.user_id = v_user) then
      perform public.add_me_to_room(v_room);
    end if;
    return query select 'room'::text, v_room;
    return;
  end if;

  select d.id, d.status into v_diary, v_status from public.diaries d where d.invite_code = v_code for update;
  if v_diary is not null then
    if exists (select 1 from public.diary_members m where m.diary_id = v_diary and m.user_id = v_user and m.left_at is null) then
      return query select 'diary'::text, v_diary;
      return;
    end if;
    if v_status = 'closed' then
      raise exception '이미 끝난 교환일기예요';
    end if;
    if exists (select 1 from public.diary_members m where m.diary_id = v_diary and m.user_id = v_user) then
      raise exception '나간 교환일기에는 다시 들어갈 수 없어요';
    end if;
    if (select count(*) from public.diary_members m where m.diary_id = v_diary) >= 2 then
      raise exception '이미 두 사람이 쓰고 있는 교환일기예요';
    end if;
    insert into public.diary_members (diary_id, user_id, alias, pen_color)
    values (v_diary, v_user, '주황 펜', 'orange');
    update public.diaries set status = 'active' where diaries.id = v_diary;
    return query select 'diary'::text, v_diary;
    return;
  end if;

  raise exception '없는 코드예요. 코드를 다시 확인해 주세요';
end;
$$;

create or replace function public.leave_diary(p_diary uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_mode text;
  v_status text;
begin
  if v_user is null then raise exception '로그인 세션이 없어요'; end if;
  if not exists (
    select 1 from public.diary_members where diary_id = p_diary and user_id = v_user and left_at is null
  ) then
    raise exception '들어가 있지 않은 일기장이에요';
  end if;

  select mode, status into v_mode, v_status from public.diaries where id = p_diary for update;

  -- 혼자 쓰는 일기장, 짝이 없는 교환일기: 일기장째 지운다
  if v_mode = 'solo' or v_status = 'waiting' then
    delete from public.diaries where id = p_diary;
    return;
  end if;

  -- 짝이 있는 교환일기: 나는 빠지고 일기장은 끝남
  update public.diary_members set left_at = now() where diary_id = p_diary and user_id = v_user;
  update public.diaries set status = 'closed' where id = p_diary;

  -- 둘 다 나갔으면 일기장을 지운다
  if not exists (select 1 from public.diary_members where diary_id = p_diary and left_at is null) then
    delete from public.diaries where id = p_diary;
  end if;
end;
$$;

revoke all on function public.leave_diary(uuid) from public, anon;
grant execute on function public.leave_diary(uuid) to authenticated;
grant execute on function public.join_by_code(text) to authenticated;
grant execute on function public.my_diaries() to authenticated;
