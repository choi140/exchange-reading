-- 7단계: 랜덤 매칭 또는 참여 코드로 함께하기 (추가 기능 7-2)
-- 06 다음에 SQL Editor에서 실행한다. 여러 번 실행해도 된다.

-- 1) 코드 방 표시: 코드로 만든 방·일기장은 랜덤 매칭에 섞이지 않는다
alter table public.rooms   add column if not exists invite_code text unique;
alter table public.rooms   add column if not exists is_private boolean not null default false;
alter table public.diaries add column if not exists invite_code text unique;
alter table public.diaries add column if not exists is_private boolean not null default false;

-- 2) 6자리 코드 만들기 (헷갈리는 0/O, 1/I/L 제외)
create or replace function public.new_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.rooms where invite_code = code)
          and not exists (select 1 from public.diaries where invite_code = code);
  end loop;
  return code;
end;
$$;
revoke all on function public.new_invite_code() from public, anon, authenticated;

-- 방에 남은 펜 색으로 나를 넣는다 (파랑 → 초록 → 주황)
create or replace function public.add_me_to_room(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_color text;
begin
  select c.color into v_color
  from (values (1, 'blue'), (2, 'green'), (3, 'orange')) as c(ord, color)
  where not exists (select 1 from public.room_members m where m.room_id = p_room and m.pen_color = c.color)
  order by c.ord
  limit 1;
  if v_color is null then
    raise exception '방이 꽉 찼어요 (최대 3명)';
  end if;
  insert into public.room_members (room_id, user_id, pen_color, alias)
  values (p_room, auth.uid(), v_color,
          case v_color when 'blue' then '파란 펜' when 'green' then '초록 펜' else '주황 펜' end);
end;
$$;
revoke all on function public.add_me_to_room(uuid) from public, anon, authenticated;

-- 3) 함께 읽기 랜덤 배정: 코드 방은 제외 (4-1 join_room 갱신)
create or replace function public.join_room(p_book_id text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_room uuid;
begin
  if v_user is null then raise exception '로그인 세션이 없어요'; end if;
  if not exists (select 1 from public.books where id = p_book_id) then
    raise exception '없는 책이에요: %', p_book_id;
  end if;

  -- 이미 들어간 랜덤 방
  select r.id into v_room
  from public.rooms r join public.room_members m on m.room_id = r.id
  where r.book_id = p_book_id and r.mode = 'together' and not r.is_private and m.user_id = v_user
  order by r.created_at limit 1;
  if v_room is not null then return v_room; end if;

  -- 빈자리 있는 랜덤 방
  select r.id into v_room
  from public.rooms r
  where r.book_id = p_book_id and r.mode = 'together' and not r.is_private
    and (select count(*) from public.room_members m where m.room_id = r.id) < 3
  order by r.created_at limit 1
  for update skip locked;

  if v_room is null then
    insert into public.rooms (book_id, mode) values (p_book_id, 'together') returning id into v_room;
  end if;

  perform public.add_me_to_room(v_room);
  return v_room;
end;
$$;

-- 4) 코드로 함께 읽기 방 만들기: 새 방 + 코드, 만든 사람은 파란 펜
create or replace function public.create_private_room(p_book_id text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room uuid;
begin
  if auth.uid() is null then raise exception '로그인 세션이 없어요'; end if;
  if not exists (select 1 from public.books where id = p_book_id) then
    raise exception '없는 책이에요: %', p_book_id;
  end if;
  insert into public.rooms (book_id, mode, is_private, invite_code)
  values (p_book_id, 'together', true, public.new_invite_code())
  returning id into v_room;
  perform public.add_me_to_room(v_room);
  return v_room;
end;
$$;

-- 5) 코드로 방 또는 일기장에 들어가기. 어느 쪽인지와 id를 돌려준다
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

  select d.id into v_diary from public.diaries d where d.invite_code = v_code for update;
  if v_diary is not null then
    if not exists (select 1 from public.diary_members m where m.diary_id = v_diary and m.user_id = v_user) then
      if (select count(*) from public.diary_members m where m.diary_id = v_diary) >= 2 then
        raise exception '이미 두 사람이 쓰고 있는 교환일기예요';
      end if;
      insert into public.diary_members (diary_id, user_id, alias, pen_color)
      values (v_diary, v_user, '주황 펜', 'orange');
      update public.diaries set status = 'active' where diaries.id = v_diary;
    end if;
    return query select 'diary'::text, v_diary;
    return;
  end if;

  raise exception '없는 코드예요. 코드를 다시 확인해 주세요';
end;
$$;

-- 6) 교환일기 랜덤 짝 찾기: 코드 일기장은 제외 (5-1 find_diary_partner 갱신)
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
  if v_user is null then raise exception '로그인 세션이 없어요'; end if;

  select d.id into v_diary
  from public.diaries d join public.diary_members m on m.diary_id = d.id
  where d.mode = 'exchange' and d.status = 'waiting' and not d.is_private and m.user_id = v_user
  order by d.created_at limit 1;
  if v_diary is not null then return v_diary; end if;

  select d.id into v_diary
  from public.diaries d
  where d.mode = 'exchange' and d.status = 'waiting' and not d.is_private
    and not exists (select 1 from public.diary_members m where m.diary_id = d.id and m.user_id = v_user)
  order by d.created_at limit 1
  for update skip locked;

  if v_diary is not null then
    insert into public.diary_members (diary_id, user_id, alias, pen_color) values (v_diary, v_user, '주황 펜', 'orange');
    update public.diaries set status = 'active' where id = v_diary;
    return v_diary;
  end if;

  insert into public.diaries (mode, status) values ('exchange', 'waiting') returning id into v_diary;
  insert into public.diary_members (diary_id, user_id, alias, pen_color) values (v_diary, v_user, '파란 펜', 'blue');
  return v_diary;
end;
$$;

-- 7) 코드로 교환일기 만들기: 짝을 기다리는 일기장 + 코드, 만든 사람은 파란 펜
create or replace function public.create_private_diary()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_diary uuid;
begin
  if auth.uid() is null then raise exception '로그인 세션이 없어요'; end if;
  insert into public.diaries (mode, status, is_private, invite_code)
  values ('exchange', 'waiting', true, public.new_invite_code())
  returning id into v_diary;
  insert into public.diary_members (diary_id, user_id, alias, pen_color) values (v_diary, auth.uid(), '파란 펜', 'blue');
  return v_diary;
end;
$$;

revoke all on function public.join_room(text) from public, anon;
revoke all on function public.create_private_room(text) from public, anon;
revoke all on function public.join_by_code(text) from public, anon;
revoke all on function public.find_diary_partner() from public, anon;
revoke all on function public.create_private_diary() from public, anon;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.create_private_room(text) to authenticated;
grant execute on function public.join_by_code(text) to authenticated;
grant execute on function public.find_diary_partner() to authenticated;
grant execute on function public.create_private_diary() to authenticated;
