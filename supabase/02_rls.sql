-- 2-4 권한(RLS) 정책 (PRD #9)
-- 원칙: 메모는 같은 방 멤버만, 일기는 같은 일기장 멤버만 읽고 쓴다.
-- 혼자 모드는 멤버가 나뿐이라 이 규칙만으로 "나만 보기"가 된다.
-- 방·일기장에 들어가는 일(멤버 추가)은 3~5단계의 DB 함수(security definer)로만 한다.
-- 익명 로그인 사용자도 역할은 authenticated다.

-- 1) 모든 테이블에 RLS 켜기
alter table public.books          enable row level security;
alter table public.rooms          enable row level security;
alter table public.room_members   enable row level security;
alter table public.notes          enable row level security;
alter table public.unlocks        enable row level security;
alter table public.diaries        enable row level security;
alter table public.diary_members  enable row level security;
alter table public.diary_entries  enable row level security;

-- 2) API에서 테이블을 쓸 수 있게 권한 부여 (실제로 볼 수 있는 행은 아래 정책이 정한다)
grant usage on schema public to anon, authenticated;
grant select on public.books to anon, authenticated;
grant select on public.rooms, public.room_members, public.diaries, public.diary_members to authenticated;
grant select, insert on public.notes, public.unlocks, public.diary_entries to authenticated;

-- 3) 멤버인지 확인하는 함수. 정책 안에서 멤버 테이블을 다시 조회하면 정책이 자기 자신을
--    부르며 무한 반복되므로, RLS를 거치지 않는 security definer 함수로 확인한다.
create or replace function public.is_room_member(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members
    where room_id = rid and user_id = auth.uid()
  );
$$;

create or replace function public.is_diary_member(did uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.diary_members
    where diary_id = did and user_id = auth.uid()
  );
$$;

revoke all on function public.is_room_member(uuid) from public;
revoke all on function public.is_diary_member(uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.is_diary_member(uuid) to authenticated;

-- 4) 정책 (다시 실행해도 되게 먼저 지운다)

-- 책: 누구나 읽기
drop policy if exists "books: 누구나 읽기" on public.books;
create policy "books: 누구나 읽기" on public.books
  for select to anon, authenticated using (true);

-- 방: 내가 멤버인 방만
drop policy if exists "rooms: 멤버만 읽기" on public.rooms;
create policy "rooms: 멤버만 읽기" on public.rooms
  for select to authenticated using (public.is_room_member(id));

-- 방 멤버: 같은 방 사람의 펜 색·별명은 볼 수 있다
drop policy if exists "room_members: 같은 방 멤버만 읽기" on public.room_members;
create policy "room_members: 같은 방 멤버만 읽기" on public.room_members
  for select to authenticated using (public.is_room_member(room_id));

-- 메모: 같은 방 멤버만 읽고, 내 이름으로만 쓴다
drop policy if exists "notes: 같은 방 멤버만 읽기" on public.notes;
create policy "notes: 같은 방 멤버만 읽기" on public.notes
  for select to authenticated using (public.is_room_member(room_id));

drop policy if exists "notes: 같은 방 멤버만 쓰기" on public.notes;
create policy "notes: 같은 방 멤버만 쓰기" on public.notes
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_room_member(room_id));

-- 그냥 보기 기록: 내 것만
drop policy if exists "unlocks: 내 기록만 읽기" on public.unlocks;
create policy "unlocks: 내 기록만 읽기" on public.unlocks
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "unlocks: 같은 방 멤버만 쓰기" on public.unlocks;
create policy "unlocks: 같은 방 멤버만 쓰기" on public.unlocks
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_room_member(room_id));

-- 일기장: 내가 멤버인 일기장만
drop policy if exists "diaries: 멤버만 읽기" on public.diaries;
create policy "diaries: 멤버만 읽기" on public.diaries
  for select to authenticated using (public.is_diary_member(id));

drop policy if exists "diary_members: 같은 일기장 멤버만 읽기" on public.diary_members;
create policy "diary_members: 같은 일기장 멤버만 읽기" on public.diary_members
  for select to authenticated using (public.is_diary_member(diary_id));

-- 일기: 같은 일기장 멤버만 읽고, 내 이름으로만 쓴다
drop policy if exists "diary_entries: 같은 일기장 멤버만 읽기" on public.diary_entries;
create policy "diary_entries: 같은 일기장 멤버만 읽기" on public.diary_entries
  for select to authenticated using (public.is_diary_member(diary_id));

drop policy if exists "diary_entries: 같은 일기장 멤버만 쓰기" on public.diary_entries;
create policy "diary_entries: 같은 일기장 멤버만 쓰기" on public.diary_entries
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_diary_member(diary_id));
