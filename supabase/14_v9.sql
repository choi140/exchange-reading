-- 12단계 (13_more_books 다음에 실행. 여러 번 실행해도 된다)

-- 12-1 같은 사람들과 다음 책
-- 함께 읽은 방에서 한 사람이 다음 책을 제안하고, 방 사람 모두가 좋다고 하면 같은 펜 색으로 새 방이 열린다.
-- 사람은 user_id 대신 펜 색으로 적는다. 방 안에서 펜 색은 하나뿐이고, 열쇠로 계정을 옮겨도 그대로다.
create table if not exists public.room_next (
  room_id       uuid primary key references public.rooms (id) on delete cascade,
  book_id       text not null references public.books (id) on delete cascade,
  proposed_pen  text not null,
  agreed        text[] not null default '{}',
  next_room_id  uuid references public.rooms (id) on delete cascade,
  created_at    timestamptz not null default now()
);

-- 읽기만 앱에서 하고, 쓰기는 아래 함수로만 한다
alter table public.room_next enable row level security;
grant select on public.room_next to authenticated;
drop policy if exists "room_next: 같은 방 멤버만 읽기" on public.room_next;
create policy "room_next: 같은 방 멤버만 읽기" on public.room_next
  for select to authenticated using (public.is_room_member(room_id));

-- 모두 좋다고 했으면 새 방을 연다. 코드가 없는 코드 방이라 랜덤 매칭이나 다른 사람이 들어올 수 없다
create or replace function public.try_next_book(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next public.room_next%rowtype;
  v_room uuid;
begin
  select * into v_next from public.room_next where room_id = p_room for update;
  if not found or v_next.next_room_id is not null then return; end if;

  if (select count(*) from public.room_members where room_id = p_room) < 2 then
    delete from public.room_next where room_id = p_room;
    return;
  end if;
  if exists (
    select 1 from public.room_members m
    where m.room_id = p_room and not (m.pen_color = any (v_next.agreed))
  ) then
    return;
  end if;

  insert into public.rooms (book_id, mode, is_private)
  values (v_next.book_id, 'together', true)
  returning id into v_room;
  insert into public.room_members (room_id, user_id, pen_color, alias)
  select v_room, m.user_id, m.pen_color, m.alias
  from public.room_members m where m.room_id = p_room;
  update public.room_next set next_room_id = v_room where room_id = p_room;
end;
$$;
revoke all on function public.try_next_book(uuid) from public, anon, authenticated;

-- 다음 책 제안하기: 다른 사람이 제안해 둔 것이 있으면 새 제안으로 바뀐다
create or replace function public.propose_next_book(p_room uuid, p_book text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pen text;
begin
  select m.pen_color into v_pen
  from public.room_members m join public.rooms r on r.id = m.room_id
  where m.room_id = p_room and m.user_id = auth.uid() and r.mode = 'together';
  if v_pen is null then raise exception '들어가 있지 않은 방이에요'; end if;
  if (select count(*) from public.room_members where room_id = p_room) < 2 then
    raise exception '함께 읽는 사람이 있어야 제안할 수 있어요';
  end if;
  if not exists (select 1 from public.books where id = p_book) then
    raise exception '없는 책이에요: %', p_book;
  end if;
  if exists (select 1 from public.rooms where id = p_room and book_id = p_book) then
    raise exception '지금 읽은 책과 다른 책을 골라 주세요';
  end if;
  if exists (select 1 from public.room_next where room_id = p_room and next_room_id is not null) then
    raise exception '이미 다음 책으로 넘어갔어요';
  end if;

  insert into public.room_next (room_id, book_id, proposed_pen, agreed)
  values (p_room, p_book, v_pen, array[v_pen])
  on conflict (room_id) do update
    set book_id = excluded.book_id, proposed_pen = excluded.proposed_pen,
        agreed = excluded.agreed, created_at = now();
end;
$$;

-- 제안에 답하기: 좋아요면 내 펜 색을 더하고, 아니면 제안을 조용히 거둔다
create or replace function public.respond_next_book(p_room uuid, p_yes boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pen text;
begin
  select m.pen_color into v_pen from public.room_members m
  where m.room_id = p_room and m.user_id = auth.uid();
  if v_pen is null then raise exception '들어가 있지 않은 방이에요'; end if;

  if not p_yes then
    delete from public.room_next where room_id = p_room and next_room_id is null;
    return;
  end if;
  if not exists (select 1 from public.room_next where room_id = p_room) then
    raise exception '제안이 사라졌어요. 다시 확인해 주세요';
  end if;
  update public.room_next
  set agreed = array_append(agreed, v_pen)
  where room_id = p_room and not (v_pen = any (agreed));
  perform public.try_next_book(p_room);
end;
$$;

revoke all on function public.propose_next_book(uuid, text) from public, anon;
revoke all on function public.respond_next_book(uuid, boolean) from public, anon;
grant execute on function public.propose_next_book(uuid, text) to authenticated;
grant execute on function public.respond_next_book(uuid, boolean) to authenticated;

-- 방 나가기: 나간 사람의 제안·동의를 정리한다 (10의 leave_room 갱신)
create or replace function public.leave_room(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_pen text;
begin
  if v_user is null then raise exception '로그인 세션이 없어요'; end if;
  select pen_color into v_pen from public.room_members where room_id = p_room and user_id = v_user;
  if v_pen is null then
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
    return;
  end if;

  delete from public.room_next where room_id = p_room and proposed_pen = v_pen and next_room_id is null;
  update public.room_next set agreed = array_remove(agreed, v_pen) where room_id = p_room and next_room_id is null;
  perform public.try_next_book(p_room);
end;
$$;
revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;

-- 12-2 나의 독서 달력: 날마다 책마다 읽은 문단 수만 쌓는다
-- 방이 아니라 책에 묶어서, 방을 나가도 읽은 기록은 남는다
create table if not exists public.reading_days (
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  book_id     text not null references public.books (id) on delete cascade,
  paragraphs  int not null default 0 check (paragraphs >= 0),
  primary key (user_id, day, book_id)
);

alter table public.reading_days enable row level security;
grant select on public.reading_days to authenticated;
drop policy if exists "reading_days: 내 기록만 읽기" on public.reading_days;
create policy "reading_days: 내 기록만 읽기" on public.reading_days
  for select to authenticated using (user_id = auth.uid());

-- 날짜는 한국 시간 기준
create or replace function public.add_reading(p_room uuid, p_count int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_book text;
begin
  select r.book_id into v_book
  from public.rooms r join public.room_members m on m.room_id = r.id
  where r.id = p_room and m.user_id = auth.uid();
  if v_book is null then raise exception '들어가 있지 않은 방이에요'; end if;

  insert into public.reading_days as d (user_id, day, book_id, paragraphs)
  values (auth.uid(), (now() at time zone 'Asia/Seoul')::date, v_book, least(greatest(p_count, 1), 500))
  on conflict (user_id, day, book_id) do update set paragraphs = d.paragraphs + excluded.paragraphs;
end;
$$;
revoke all on function public.add_reading(uuid, int) from public, anon;
grant execute on function public.add_reading(uuid, int) to authenticated;

-- 열쇠로 되찾기: 읽은 기록도 함께 옮긴다 (11의 claim_recovery_key 갱신)
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

  -- 같은 날 같은 책을 두 계정에서 읽었으면 문단 수를 더한다
  insert into public.reading_days as d (user_id, day, book_id, paragraphs)
  select v_new, o.day, o.book_id, o.paragraphs from public.reading_days o where o.user_id = v_old
  on conflict (user_id, day, book_id) do update set paragraphs = d.paragraphs + excluded.paragraphs;
  delete from public.reading_days where user_id = v_old;

  -- 열쇠도 새 계정으로 (같은 열쇠로 또 옮겨 갈 수 있게)
  delete from public.recovery_keys where user_id = v_new;
  update public.recovery_keys set user_id = v_new, used_at = now() where user_id = v_old;
end;
$$;
revoke all on function public.claim_recovery_key(text) from public, anon;
grant execute on function public.claim_recovery_key(text) to authenticated;
