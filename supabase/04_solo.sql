-- 3단계: 혼자 읽기·혼자 일기용 DB 함수 (PRD #9)
-- 01~03 다음에 SQL Editor에서 실행한다. 여러 번 실행해도 된다.
-- 방·일기장과 멤버는 RLS 때문에 앱에서 직접 만들 수 없고, 이 함수들(security definer)로만 만든다.

-- 3-1 내 혼자 방이 있으면 돌려주고, 없으면 만든다 (검정 펜)
create or replace function public.start_solo_room(p_book_id text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_room uuid;
begin
  if v_user is null then
    raise exception '로그인 세션이 없어요';
  end if;
  if not exists (select 1 from public.books where id = p_book_id) then
    raise exception '없는 책이에요: %', p_book_id;
  end if;

  select r.id into v_room
  from public.rooms r
  join public.room_members m on m.room_id = r.id
  where r.book_id = p_book_id
    and r.mode = 'solo'
    and m.user_id = v_user
  order by r.created_at
  limit 1;

  if v_room is null then
    insert into public.rooms (book_id, mode)
    values (p_book_id, 'solo')
    returning id into v_room;

    insert into public.room_members (room_id, user_id, pen_color, alias)
    values (v_room, v_user, 'black', '검정 펜');
  end if;

  return v_room;
end;
$$;

-- 3-7 혼자 쓰는 일기장을 새로 만든다 (검정 펜)
-- PRD에는 "함수 없이 바로 만든다"고 했지만, 일기장을 만든 직후에는 아직 멤버가 아니라
-- RLS 때문에 만든 일기장을 읽을 수도, 멤버로 들어갈 수도 없다. 그래서 함수로 한 번에 처리한다.
create or replace function public.create_solo_diary()
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

  insert into public.diaries (mode, status)
  values ('solo', 'active')
  returning id into v_diary;

  insert into public.diary_members (diary_id, user_id, alias, pen_color)
  values (v_diary, v_user, '검정 펜', 'black');

  return v_diary;
end;
$$;

revoke all on function public.start_solo_room(text) from public, anon;
revoke all on function public.create_solo_diary() from public, anon;
grant execute on function public.start_solo_room(text) to authenticated;
grant execute on function public.create_solo_diary() to authenticated;
