-- 7단계: 문장 밑줄, 다 읽고 편지 한 장, 방 나가기 (추가 기능 7-6~7-8)
-- 07 다음에 SQL Editor에서 실행한다. 여러 번 실행해도 된다.

-- 7-6 문장 밑줄: 문단 안의 글자 위치(시작~끝)로 저장한다
create table if not exists public.highlights (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references public.rooms (id) on delete cascade,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  paragraph_index  int not null check (paragraph_index >= 0),
  start_offset     int not null check (start_offset >= 0),
  end_offset       int not null,
  created_at       timestamptz not null default now(),
  check (end_offset > start_offset and end_offset - start_offset <= 2000)
);
create index if not exists highlights_room_idx on public.highlights (room_id, paragraph_index);

-- 7-7 다 읽고 편지 한 장: 방마다 한 사람당 한 장
create table if not exists public.letters (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  unique (room_id, user_id)
);

alter table public.highlights enable row level security;
alter table public.letters    enable row level security;
grant select, insert, delete on public.highlights to authenticated;
grant select, insert on public.letters to authenticated;

drop policy if exists "highlights: 같은 방 멤버만 읽기" on public.highlights;
create policy "highlights: 같은 방 멤버만 읽기" on public.highlights
  for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "highlights: 같은 방 멤버만 쓰기" on public.highlights;
create policy "highlights: 같은 방 멤버만 쓰기" on public.highlights
  for insert to authenticated with check (user_id = auth.uid() and public.is_room_member(room_id));
drop policy if exists "highlights: 내 밑줄만 지우기" on public.highlights;
create policy "highlights: 내 밑줄만 지우기" on public.highlights
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "letters: 같은 방 멤버만 읽기" on public.letters;
create policy "letters: 같은 방 멤버만 읽기" on public.letters
  for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "letters: 같은 방 멤버만 쓰기" on public.letters;
create policy "letters: 같은 방 멤버만 쓰기" on public.letters
  for insert to authenticated with check (user_id = auth.uid() and public.is_room_member(room_id));

-- 7-8 방 나가기: 이 방에 남긴 내 메모(그 아래 답글 포함)·밑줄·편지·그냥 보기 기록을 지우고 멤버에서 빠진다.
-- 펜 색이 다음 사람에게 넘어가도 내 글이 그 사람 글처럼 보이지 않게 내 기록을 함께 지운다.
-- 아무도 남지 않은 방은 방째 지운다.
create or replace function public.leave_room(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception '로그인 세션이 없어요'; end if;
  if not exists (select 1 from public.room_members where room_id = p_room and user_id = v_user) then
    raise exception '들어가 있지 않은 방이에요';
  end if;

  delete from public.notes      where room_id = p_room and user_id = v_user;
  delete from public.highlights where room_id = p_room and user_id = v_user;
  delete from public.letters    where room_id = p_room and user_id = v_user;
  delete from public.unlocks    where room_id = p_room and user_id = v_user;
  delete from public.room_members where room_id = p_room and user_id = v_user;

  if not exists (select 1 from public.room_members where room_id = p_room) then
    delete from public.rooms where id = p_room;
  end if;
end;
$$;

revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;
