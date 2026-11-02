-- 22단계 (14_v9 다음에 실행. 여러 번 실행해도 된다)
-- 22-1 형광펜: 고른 문장을 밑줄(underline) 또는 형광펜(marker)으로 표시한다. 예전 밑줄은 그대로 underline이다.
alter table public.highlights
  add column if not exists mark text not null default 'underline' check (mark in ('underline', 'marker'));
