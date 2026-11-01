-- 4단계: 함께 읽기 (PRD #4.1, #9)
-- 04 다음에 SQL Editor에서 실행한다. 여러 번 실행해도 된다.

-- 4-1 함께 읽기 방 배정: 이미 들어간 방 → 3명 미만인 방 → 새 방 순서로 찾는다
-- 4-2 남은 펜 색(파랑 → 초록 → 주황)과 별명("파란 펜")을 준다
create or replace function public.join_room(p_book_id text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_room uuid;
  v_color text;
begin
  if v_user is null then
    raise exception '로그인 세션이 없어요';
  end if;
  if not exists (select 1 from public.books where id = p_book_id) then
    raise exception '없는 책이에요: %', p_book_id;
  end if;

  -- 1) 이미 들어간 함께 읽기 방
  select r.id into v_room
  from public.rooms r
  join public.room_members m on m.room_id = r.id
  where r.book_id = p_book_id and r.mode = 'together' and m.user_id = v_user
  order by r.created_at
  limit 1;
  if v_room is not null then
    return v_room;
  end if;

  -- 2) 빈자리(3명 미만) 있는 가장 오래된 방. 동시에 두 사람이 같은 자리를 잡지 않게 잠근다
  select r.id into v_room
  from public.rooms r
  where r.book_id = p_book_id
    and r.mode = 'together'
    and (select count(*) from public.room_members m where m.room_id = r.id) < 3
  order by r.created_at
  limit 1
  for update skip locked;

  -- 3) 없으면 새 방
  if v_room is null then
    insert into public.rooms (book_id, mode)
    values (p_book_id, 'together')
    returning id into v_room;
  end if;

  -- 남은 펜 색 중 첫 번째
  select c.color into v_color
  from (values (1, 'blue'), (2, 'green'), (3, 'orange')) as c(ord, color)
  where not exists (
    select 1 from public.room_members m
    where m.room_id = v_room and m.pen_color = c.color
  )
  order by c.ord
  limit 1;

  if v_color is null then
    raise exception '방이 꽉 찼어요. 다시 시도해 주세요.';
  end if;

  insert into public.room_members (room_id, user_id, pen_color, alias)
  values (
    v_room,
    v_user,
    v_color,
    case v_color when 'blue' then '파란 펜' when 'green' then '초록 펜' else '주황 펜' end
  );

  return v_room;
end;
$$;

revoke all on function public.join_room(text) from public, anon;
grant execute on function public.join_room(text) to authenticated;

-- 4-7 답글은 한 단계만: 원 메모가 같은 방·같은 문단의 "답글이 아닌 메모"여야 한다
drop policy if exists "notes: 같은 방 멤버만 쓰기" on public.notes;
create policy "notes: 같은 방 멤버만 쓰기" on public.notes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_room_member(room_id)
    and (
      parent_id is null
      or exists (
        select 1 from public.notes p
        where p.id = notes.parent_id
          and p.room_id = notes.room_id
          and p.paragraph_index = notes.paragraph_index
          and p.parent_id is null
      )
    )
  );
