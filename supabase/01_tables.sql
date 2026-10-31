-- 2-3 테이블 8개 (PRD #9)
-- Supabase 대시보드 → SQL Editor에 붙여 넣고 Run. 01 → 02 → 03 순서로 실행한다.
-- 여러 번 실행해도 되도록 if not exists를 쓴다.

-- 책: 저작권이 끝난 단편. 본문은 문단 배열 하나 (PRD #7)
create table if not exists public.books (
  id          text primary key,
  title       text not null,
  author      text not null,
  year        int,
  source      text not null default '',
  paragraphs  text[] not null default '{}'
);

-- 책 방: 혼자(solo, 멤버 1명) / 함께(together, 최대 3명)
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  book_id     text not null references public.books (id) on delete cascade,
  mode        text not null check (mode in ('solo', 'together')),
  created_at  timestamptz not null default now()
);
create index if not exists rooms_book_mode_idx on public.rooms (book_id, mode);

-- 방 멤버: 사람은 펜 색과 별명으로만 구분된다
create table if not exists public.room_members (
  room_id     uuid not null references public.rooms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  pen_color   text not null check (pen_color in ('black', 'blue', 'green', 'orange')),
  alias       text not null,
  joined_at   timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, pen_color)
);
create index if not exists room_members_user_idx on public.room_members (user_id);

-- 메모와 답글 (답글은 parent_id에 원 메모 id, 한 단계만)
create table if not exists public.notes (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references public.rooms (id) on delete cascade,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  paragraph_index  int not null check (paragraph_index >= 0),
  parent_id        uuid references public.notes (id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 300),
  created_at       timestamptz not null default now()
);
create index if not exists notes_room_para_idx on public.notes (room_id, paragraph_index);

-- "그냥 보기" 기록 (블라인드 해제)
create table if not exists public.unlocks (
  room_id          uuid not null references public.rooms (id) on delete cascade,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  paragraph_index  int not null check (paragraph_index >= 0),
  created_at       timestamptz not null default now(),
  primary key (room_id, user_id, paragraph_index)
);

-- 일기장: 혼자(solo) / 교환(exchange). 교환은 짝을 기다리는 동안 waiting
create table if not exists public.diaries (
  id          uuid primary key default gen_random_uuid(),
  mode        text not null check (mode in ('solo', 'exchange')),
  status      text not null default 'active' check (status in ('waiting', 'active')),
  created_at  timestamptz not null default now()
);

create table if not exists public.diary_members (
  diary_id    uuid not null references public.diaries (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  alias       text not null,
  pen_color   text not null check (pen_color in ('black', 'blue', 'green', 'orange')),
  joined_at   timestamptz not null default now(),
  primary key (diary_id, user_id),
  unique (diary_id, pen_color)
);
create index if not exists diary_members_user_idx on public.diary_members (user_id);

create table if not exists public.diary_entries (
  id          uuid primary key default gen_random_uuid(),
  diary_id    uuid not null references public.diaries (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prompt      text not null default '',
  body        text not null check (char_length(body) between 1 and 1000),
  created_at  timestamptz not null default now()
);
create index if not exists diary_entries_diary_idx on public.diary_entries (diary_id, created_at);
