-- 9단계 (09 다음에 실행. 여러 번 실행해도 된다)
-- 9-1 일기장 이름 · 9-2 내 일기 지우기 · 9-4 일기 댓글 · 9-7 밑줄에 한마디와 답글

-- 9-1 일기장 이름: 비어 있으면 화면에서 "혼자 쓰는 일기"/"교환일기"로 보인다
alter table public.diaries add column if not exists title text
  check (title is null or char_length(title) between 1 and 30);

create or replace function public.rename_diary(p_diary uuid, p_title text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
begin
  if not public.is_diary_member(p_diary) then
    raise exception '들어가 있지 않은 일기장이에요';
  end if;
  if v_title is not null and char_length(v_title) > 30 then
    raise exception '이름은 30자까지 쓸 수 있어요';
  end if;
  update public.diaries set title = v_title where id = p_diary;
end;
$$;
revoke all on function public.rename_diary(uuid, text) from public, anon;
grant execute on function public.rename_diary(uuid, text) to authenticated;

-- 9-2 내가 쓴 일기 지우기 (남의 일기는 못 지운다)
grant delete on public.diary_entries to authenticated;
drop policy if exists "diary_entries: 내 일기만 지우기" on public.diary_entries;
create policy "diary_entries: 내 일기만 지우기" on public.diary_entries
  for delete to authenticated using (user_id = auth.uid() and public.is_diary_member(diary_id));

-- 9-4 일기에 댓글
create table if not exists public.diary_comments (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references public.diary_entries (id) on delete cascade,
  diary_id    uuid not null references public.diaries (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 300),
  created_at  timestamptz not null default now()
);
create index if not exists diary_comments_entry_idx on public.diary_comments (entry_id, created_at);
alter table public.diary_comments enable row level security;
grant select, insert, delete on public.diary_comments to authenticated;

drop policy if exists "diary_comments: 같은 일기장 멤버만 읽기" on public.diary_comments;
create policy "diary_comments: 같은 일기장 멤버만 읽기" on public.diary_comments
  for select to authenticated using (public.is_diary_member(diary_id));
drop policy if exists "diary_comments: 같은 일기장 멤버만 쓰기" on public.diary_comments;
create policy "diary_comments: 같은 일기장 멤버만 쓰기" on public.diary_comments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_diary_member(diary_id)
    and exists (select 1 from public.diary_entries e where e.id = entry_id and e.diary_id = diary_comments.diary_id)
  );
drop policy if exists "diary_comments: 내 댓글만 지우기" on public.diary_comments;
create policy "diary_comments: 내 댓글만 지우기" on public.diary_comments
  for delete to authenticated using (user_id = auth.uid());

-- 홈 "내 일기장"에 이름도 함께 (반환 열이 바뀌므로 지우고 다시 만든다)
drop function if exists public.my_diaries();
create function public.my_diaries()
returns table (
  id uuid,
  mode text,
  status text,
  title text,
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
    d.title,
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
revoke all on function public.my_diaries() from public, anon;
grant execute on function public.my_diaries() to authenticated;

-- 9-7 밑줄에 한마디(선택) + 밑줄 아래 답글
alter table public.highlights add column if not exists memo text
  check (memo is null or char_length(memo) between 1 and 200);

create table if not exists public.highlight_replies (
  id            uuid primary key default gen_random_uuid(),
  highlight_id  uuid not null references public.highlights (id) on delete cascade,
  room_id       uuid not null references public.rooms (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 200),
  created_at    timestamptz not null default now()
);
create index if not exists highlight_replies_idx on public.highlight_replies (highlight_id, created_at);
alter table public.highlight_replies enable row level security;
grant select, insert, delete on public.highlight_replies to authenticated;

drop policy if exists "highlight_replies: 같은 방 멤버만 읽기" on public.highlight_replies;
create policy "highlight_replies: 같은 방 멤버만 읽기" on public.highlight_replies
  for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "highlight_replies: 같은 방 멤버만 쓰기" on public.highlight_replies;
create policy "highlight_replies: 같은 방 멤버만 쓰기" on public.highlight_replies
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_room_member(room_id)
    and exists (select 1 from public.highlights h where h.id = highlight_id and h.room_id = highlight_replies.room_id)
  );
drop policy if exists "highlight_replies: 내 답글만 지우기" on public.highlight_replies;
create policy "highlight_replies: 내 답글만 지우기" on public.highlight_replies
  for delete to authenticated using (user_id = auth.uid());

-- 방 나가기: 밑줄 답글도 함께 지운다 (08의 leave_room 갱신)
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

  delete from public.notes             where room_id = p_room and user_id = v_user;
  delete from public.highlight_replies where room_id = p_room and user_id = v_user;
  delete from public.highlights        where room_id = p_room and user_id = v_user;
  delete from public.letters           where room_id = p_room and user_id = v_user;
  delete from public.unlocks           where room_id = p_room and user_id = v_user;
  delete from public.room_members      where room_id = p_room and user_id = v_user;

  if not exists (select 1 from public.room_members where room_id = p_room) then
    delete from public.rooms where id = p_room;
  end if;
end;
$$;
revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;
