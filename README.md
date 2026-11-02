# 낯선 밑줄

모르는 사람과 전자책 한 권, 일기장 한 권을 천천히 주고받는 익명 교환독서·교환일기 웹앱.

> **브라우저에서 바로 실행: https://exchange-reading.vercel.app**
>
> 설치나 로그인 없이 휴대폰·PC 브라우저에서 주소를 열면 바로 시작 화면이 나옵니다.
> 일반 창·시크릿 창·다른 브라우저는 각각 다른 익명 사용자가 되므로, 창 2~3개를 띄우면 혼자서도 "낯선 사람"끼리의 함께 읽기·교환일기를 해 볼 수 있습니다.

| 제출 요건 | 이 저장소에서 |
|---|---|
| 코드를 GitHub에 Public으로 | 이 저장소(`choi140/exchange-reading`)는 Public입니다 |
| 작업 중에 일정 간격으로 push | 11/1~11/2 동안 Todo 24단계를 진행하며 할 일 1~3개마다 커밋하고 push했습니다 (커밋 110개 이상, [커밋 기록](https://github.com/choi140/exchange-reading/commits/main)) |
| 커밋에 커밋 내용 | 모든 커밋 메시지가 `[할 일 번호] 바꾼 내용` 형식입니다. 예: `[22-1] SQL: 밑줄과 형광펜을 나누는 highlights.mark 칸 추가` |
| 브라우저에서 실행 가능 | 위 배포 주소에서 바로 실행됩니다. 직접 띄우는 방법은 [실행하기](#실행하기)에 있습니다 |

**목차** — [1. 제작한 것 소개](#1-제작한-것-소개) · [2. PRD와 Todo 리스트](#2-prd와-todo-리스트) · [3. Todo 리스트의 변경 내역](#3-todo-리스트의-변경-내역) · [4. 스킬](#4-스킬) · [5. 느낀점, 결론](#5-느낀점-결론)

## 1. 제작한 것 소개

**낯선 밑줄**은 친구끼리 하던 교환독서를 낯선 사람과의 경험으로 바꾼 익명 슬로우 소셜 웹앱입니다.

교환독서는 한 권의 책을 돌려 읽으며 밑줄과 메모를 남기는 놀이입니다. 그런데 아는 사람끼리는 생각이 닮아 있고, 속마음을 적기엔 부끄럽고, 같이 할 사람이 없으면 시작조차 못 합니다. 그래서 이름도 얼굴도 없이 **펜 색으로만 구분되는 낯선 사람**과 책과 일기를 주고받게 했습니다.

### 한눈에 보기

| 영역 | 할 수 있는 것 |
|---|---|
| 시작 | 로그인 없이 접속하면 익명 계정이 생깁니다. 처음 화면의 책등 세 권을 눌러 교환독서·교환일기·독서 달력으로 갑니다 |
| 교환독서 | 저작권이 끝난 한국 단편 8편을 혼자 또는 낯선 사람(최대 3명)과 읽고, 문장에 밑줄·형광펜과 한마디를 남깁니다 |
| 교환일기 | 혼자 쓰거나, 낯선 짝 또는 코드로 만난 사람과 같은 질문에 번갈아 답합니다 |
| 간직하기 | 나만의 열쇠로 다른 브라우저에 기록 옮기기, 나만 보는 독서 달력, 다 읽은 뒤 독서 영수증 |

### 화면

| 홈 | 함께 읽기 | 블라인드 | 교환일기 |
|---|---|---|---|
| ![홈](docs/screenshots/home.png) | ![함께 읽기](docs/screenshots/together-reader.png) | ![블라인드](docs/screenshots/blind.png) | ![교환일기](docs/screenshots/exchange-diary.png) |

| 책처럼 넘기는 페이지 | 밑줄에 한마디 | 일기 달력 | 밤 모드 |
|---|---|---|---|
| ![페이지](docs/screenshots/page-mode.png) | ![밑줄 한마디](docs/screenshots/underline-sheet.png) | ![일기 달력](docs/screenshots/diary-calendar.png) | ![밤 모드](docs/screenshots/night.png) |

> 스크린샷은 README용 예시 데이터로 찍은 휴대폰(390px) 화면이고, 17단계 디자인 개편과 21단계 글꼴 통일 **전**의 모습입니다. 기능과 배치는 같지만 지금은 색·글꼴·처음 화면이 다릅니다([`docs/DESIGN.md`](docs/DESIGN.md)). 최신 모습은 배포 주소에서 볼 수 있습니다.

### 교환독서

책을 고르면 "혼자 읽기"와 "함께 읽기" 중 하나를 고릅니다. 함께 읽기는 **낯선 사람과**(빈자리 있는 방에 자동 배정) 또는 **코드로**(6자리 코드를 친구에게, 랜덤 매칭에 섞이지 않음) 시작할 수 있습니다.

| | 혼자 읽기 | 함께 읽기 |
|---|---|---|
| 방 | 나만 있는 방. 같은 책을 다시 열면 같은 방 | 같은 책의 빈자리 있는 방(최대 3명). 없으면 새 방 |
| 펜 색 | 검정 펜 | 남은 색 중 하나: 파란 펜 · 초록 펜 · 주황 펜 |
| 밑줄·형광펜 | 문장을 골라 밑줄 또는 형광펜, 한마디(선택). 나만 봅니다 | 같은 방 사람들이 펜 색별로 봅니다 |
| 블라인드 | — | 그 문단에 내 밑줄이 없으면 남의 밑줄과 한마디가 가려집니다. 내가 먼저 긋거나 "그냥 보기"를 누르면 열립니다 |
| 답글 | — | 밑줄을 누르면 한마디 아래 한 단계 답글 |
| 책 끝 | 나에게 쓰는 편지 한 장 | 함께 읽은 사람들에게 편지 한 장, **같은 사람들과 다음 책** 제안(모두 좋다고 하면 같은 펜 색으로 새 방) |

**읽기 편하게** — 스크롤 또는 책처럼 넘기는 페이지(한 쪽·두 쪽 고르기), 글자 크기 12~40px, 밤 모드, 마지막으로 읽던 곳부터 이어 읽기, 새 밑줄·답글 표시, 기기 음성으로 읽어 주는 **듣기**(속도·목소리 선택, 읽는 문단을 화면이 따라감). 책장은 목록·3열·4열로 볼 수 있습니다.

**책** — 운수 좋은 날, 봄·봄, 메밀꽃 필 무렵, 날개, 동백꽃, B사감과 러브레터, 감자, 벙어리 삼룡이. 저작권 보호기간(저자 사후 70년)이 끝난 작품만 넣었습니다.

**이 방 나가기** — 이 방에 남긴 내 밑줄·편지를 지우고 나갑니다. 펜 색이 다음 사람에게 넘어갔을 때 내 글이 그 사람 글처럼 보이지 않게 하기 위해서입니다.

### 교환일기

시작 방법은 네 가지입니다: **혼자 쓰기 · 낯선 사람과 · 아는 사람과(코드 만들기) · 코드로 들어가기**.

| | 혼자 쓰기 | 교환일기 |
|---|---|---|
| 시작 | 바로 내 일기장이 생깁니다 | 기다리는 사람이 있으면 바로 짝. 없으면 "짝을 기다리는 중" |
| 쓰기 | 언제든 | 번갈아 한 편씩. 마지막 글이 내 글이면 "짝의 답장을 기다리는 중"으로 잠깁니다 |
| 오늘의 질문 | 한 편 쓸 때마다 다음 질문(30개) | 두 사람이 같은 질문에 한 번씩 답하면 다음 질문 |
| 홈 표시 | 편 수 | "내 차례" · "짝의 차례" · "짝을 기다리는 중" (알림 대신) |

- **일기 탭과 쓰기 탭** — 일기장을 열면 달력과 쓴 일기가 먼저 보입니다. 쓴 날은 쓴 사람의 펜 색으로 칠해지고(둘 다 쓴 날은 반반), 날짜를 누르면 그날 일기만 보는 탭이 열립니다. 쓰기는 "오늘의 일기 쓰기" 탭에서 1,000자 이내로.
- **일기마다 댓글**, **일기장 이름 바꾸기**, **내 일기 지우기**.
- **짝이 멀어졌을 때** — 짝의 차례로 7일 넘게 멈추면 "조금 더 기다리기 · 여기서 마무리하기 · 마무리하고 새 짝 찾기"를 고릅니다. 마무리해도 지난 일기는 두 사람 모두 볼 수 있습니다.
- **일기장 나가기** — 혼자 쓰는 일기장은 지우고, 교환일기는 "끝남"이 됩니다. 주고받은 일기는 두 사람의 것이라 지우지 않습니다.

### 기록 간직하기

<img src="docs/screenshots/memory-card.png" alt="다 읽은 뒤 기념 카드(20단계 전 모양)" width="260" align="right" />

- **나만의 열쇠** — 로그인이 없어서 브라우저를 바꾸면 기록에 들어갈 수 없습니다. 12자 열쇠와 복구 링크를 만들어 두면, 다른 브라우저에서 열쇠를 넣어 내 책·일기장·짝과의 교환일기를 그대로 옮겨 옵니다. DB에는 해시로만 저장하고, 원문은 그 브라우저에만 기억해 `/key`에서 다시 볼 수 있습니다.
- **나의 독서 달력** — 날마다 읽은 문단, 밑줄, 답글, 편지, 일기를 나만 보는 달력에 쌓습니다. 점수나 연속 기록은 없습니다.
- **독서 영수증** — 책 끝에서 함께 그은 밑줄·한마디·편지를 색 표지와 영수증 한 장으로 모아 이미지로 저장하거나 공유합니다. (오른쪽 그림은 20단계에서 영수증으로 바꾸기 전의 대출 카드 모양입니다.)

<br clear="right" />

### 권한

메모·밑줄은 같은 방 멤버만, 일기는 같은 일기장 멤버만 읽고 쓸 수 있도록 DB(RLS)에서 막습니다. 혼자 모드는 멤버가 나 하나라서 같은 규칙만으로 "나만 보기"가 됩니다. 남의 방·없는 방 주소로 들어오면 안내한 뒤 5초 뒤 홈으로 돌아갑니다.

방·일기장에 들어가는 일(멤버 추가)은 앱에서 직접 하지 않고 DB 함수로만 합니다. 빈자리 찾기와 펜 색 배정을 한 번에, 동시에 두 사람이 같은 자리를 잡지 않게 처리하기 위해서입니다.

### 구조

**기술 스택:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (익명 로그인, Postgres, RLS) · Vercel

| 화면 | 경로 | 파일 |
|---|---|---|
| 처음 (책등 세 권) | `/` | `src/app/page.tsx`, `src/components/HomeChooser.tsx`, `AppShell.tsx`(사이드바) |
| 교환독서 (내 책, 책장) | `/read` | `src/app/read/page.tsx` |
| 교환일기 (내 일기장, 새 일기장) | `/diary` | `src/app/diary/page.tsx` |
| 나만의 열쇠 (만들기, 되찾기) | `/key` | `src/app/key/page.tsx` |
| 나의 독서 달력 | `/calendar` | `src/components/ReadingCalendar.tsx` |
| 책 리더 (혼자·함께 공통) | `/room/[방 id]` | `src/components/RoomReader.tsx`, `src/components/reader/*` |
| 독서 영수증 | `/room/[방 id]/card` | `src/components/MemoryCard.tsx` |
| 일기장 (혼자·교환 공통, 일기·쓰기 탭) | `/diary/[일기장 id]` | `src/components/DiaryView.tsx`, `DiaryCalendar.tsx` |

| DB (SQL 파일) | 내용 |
|---|---|
| `01_tables.sql`, `02_rls.sql` | 테이블 8개(books, rooms, room_members, notes, unlocks, diaries, diary_members, diary_entries)와 모든 테이블의 RLS |
| `04~06` | `start_solo_room`, `create_solo_diary`, `join_room`, `find_diary_partner`, `can_write_diary`, `my_diaries` |
| `07~09` (7단계) | 참여 코드(`create_private_room`, `create_private_diary`, `join_by_code`), highlights(문장 밑줄), letters(편지), `leave_room`, `leave_diary` |
| `10_v6.sql` (9단계) | diaries.title, diary_comments, highlights.memo(한마디), highlight_replies, `rename_diary`. 문단 메모용 notes 테이블은 남아 있지만 화면에서는 쓰지 않음 |
| `11_v7.sql` (10단계) | recovery_keys(열쇠 해시), `create_recovery_key`, `claim_recovery_key`, `close_diary` |
| `14_v9.sql` (12단계) | room_next(다음 책 제안), reading_days(날마다 읽은 문단 수), `propose_next_book`, `respond_next_book`, `add_reading` |
| `15_marker.sql` (22단계) | highlights.mark(밑줄·형광펜 구분) |
| `03`, `12`, `13`, `16` | 책 8편 본문과 출처 |

### 실행하기

**브라우저에서 바로:** https://exchange-reading.vercel.app 을 엽니다. 함께 읽기·교환일기는 일반 창과 시크릿 창을 함께 띄워 확인할 수 있습니다.

**직접 띄우기:**

1. **Supabase 프로젝트 준비**
   - [supabase.com](https://supabase.com)에서 새 프로젝트를 만든다.
   - Authentication → Sign In / Providers에서 **Allow anonymous sign-ins**를 켠다.
   - SQL Editor에서 아래 파일을 **순서대로** 실행한다.
     1. `supabase/01_tables.sql` — 테이블 8개
     2. `supabase/02_rls.sql` — 권한(RLS) 정책
     3. `supabase/03_books.sql` — 책 3편
     4. `supabase/04_solo.sql` — 혼자 읽기·혼자 일기 함수
     5. `supabase/05_together.sql` — 함께 읽기 방 배정, 답글 규칙
     6. `supabase/06_exchange.sql` — 교환일기 짝 찾기, 번갈아 쓰기 규칙
     7. `supabase/07_invite.sql` — 참여 코드
     8. `supabase/08_extras.sql` — 문장 밑줄, 편지, 방 나가기
     9. `supabase/09_leave_diary.sql` — 일기장 나가기
     10. `supabase/10_v6.sql` — 일기장 이름, 일기 지우기·댓글, 밑줄 한마디·답글
     11. `supabase/11_v7.sql` — 나만의 열쇠, 교환일기 마무리
     12. `supabase/12_more_books.sql` — 책 2편 더 (「날개」, 「동백꽃」)
     13. `supabase/13_more_books.sql` — 책 3편 더 (「B사감과 러브레터」, 「감자」, 「벙어리 삼룡이」)
     14. `supabase/14_v9.sql` — 같은 사람들과 다음 책, 나의 독서 달력
     15. `supabase/15_marker.sql` — 형광펜
     16. `supabase/16_book_source.sql` — 책 출처 문구 정리
2. **환경변수** — `.env.example`을 `.env.local`로 복사하고, Project Settings → API의 값으로 채운다.
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```
3. **실행**
   ```bash
   npm install
   npm run dev
   ```
   브라우저에서 http://localhost:3000 을 연다.

책 본문은 `src/data/books.json`에 있다. 원문 텍스트 파일에서 다시 만들 때는 `python3 scripts/import-originals.py 운수.txt 봄봄.txt 메밀꽃.txt`, 그다음 `node scripts/gen-books-sql.mjs`로 `supabase/03_books.sql`을 만들어 실행한다.

Vercel에 배포할 때는 같은 환경변수 두 개를 프로젝트 Settings → Environment Variables에 넣고 **다시 배포**해야 한다. `NEXT_PUBLIC_` 값은 빌드할 때 코드에 들어가기 때문이다.

## 2. PRD와 Todo 리스트

- [PRD 전문](docs/PRD.md) · [Todo 리스트 전문](docs/TODO.md) (단계별 확인 방법 포함) · [디자인 방향](docs/DESIGN.md)
- 원본 문서: [Claude Doc](https://claude.ai/artifact/CzzFGXDqp23qeduMBbtov1)

### PRD 요약

| 장 | 내용 |
|---|---|
| 문제 | 아는 사람끼리는 시각이 닮고, 속마음을 쓰기 부끄럽고, 실물 교환독서는 같이 할 사람과 만남·택배가 필요하다 |
| 목표 | 마감(11/2) 전에, 배포된 주소에 들어가자마자 혼자 또는 낯선 사람과 책을 읽고 일기를 쓸 수 있게 한다 |
| 타깃 | 책과 기록을 좋아하는 20~30대. 같이 할 친구가 없는 사람, 부담 없이 하루를 기록하고 싶은 사람, 낯선 사람과 느슨하게 연결되고 싶은 사람 |
| 핵심 기능 | 책·일기 각각 혼자/함께 두 모드. 함께 읽기는 최대 3명·펜 색·블라인드·답글, 교환일기는 짝 찾기·번갈아 쓰기·오늘의 질문 |
| 설계 | Next.js + Supabase + Vercel. 서버를 따로 만들지 않고 계정(익명 로그인)·DB·권한(RLS)을 Supabase에 맡긴다 |
| 완료 기준 | 로그인 없이 홈, 혼자 읽기, 함께 읽기(배정·메모·답글), 혼자 일기, 교환일기, 휴대폰 화면, Public 저장소·중간 push, README 5개 항목 — 9개 |
| 하지 않는 것 | 로그인 화면, 안전장치, 릴레이·기한, 알림, 취향 매칭, 대나무숲 |

### Todo 리스트

**규칙** — 화면을 먼저 만들고 기능을 나중에 붙인다. 단계마다 배포하고 확인 방법으로 점검한다. 할 일 1~3개가 끝날 때마다 `[할 일 번호] 내용`으로 커밋하고 push한다. 할 일이 바뀌면 바로 'Todo 변경 내역'에 적는다. **[직접]**은 계정 만들기·SQL 실행·배포 주소 확인처럼 사람이 직접 하는 일이다.

| 단계 | 목표 | 할 일 | 완료 | 커밋 |
|---|---|---|---|---|
| 1 | 화면 뼈대와 첫 배포 — Public 저장소, 샘플 데이터로 홈·리더·일기장, Vercel 배포 | 15 | 15 | 11 |
| 2 | Supabase 연결과 익명 계정 — 테이블 8개, RLS, 자동 익명 로그인 | 12 | 12 | 8 |
| 3 | 혼자 읽기와 혼자 일기 — 문단 메모, 일기 저장 | 11 | 11 | 6 |
| 4 | 함께 읽기 — 방 배정, 펜 색, 블라인드, 답글 | 9 | 9 | 5 |
| 5 | 교환일기와 마무리 — 짝 찾기, 번갈아 쓰기, 휴대폰 화면, 원문, README | 17 | 17 | 9 |
| 6 | 완료 기준 점검 — PRD 완료 기준 9개 확인 | 9 | 9 | (5단계와 함께) |
| 7 | 추가 기능 (마감 후) — 페이지 모드, 참여 코드, 밤 모드, 문장 밑줄, 편지, 나가기 | 10 | 10 | 13 |
| 8 | 화면 구조 개편 — 교환독서/교환일기 분리, 사이드바, 일기 달력 | 7 | 7 | 4 |
| 9 | 사용 후 개선 — 밑줄에 한마디, 글이 흐르는 페이지, 같은 질문, 날짜 탭 | 8 | 8 | 6 |
| 10 | 오래 쓰기 위한 기능 — 나만의 열쇠, 짝이 멀어졌을 때, 기념 카드, 책 추가 | 6 | 6 | 6 |
| 11 | 사용 후 개선 — 열쇠 계속 보이기, 책 8권 | 4 | 4 | 5 |
| 12 | 오래 함께하기 — 같은 사람들과 다음 책, 독서 달력 | 3 | 3 | 6 |
| 13 | 읽는 화면 다듬기 — 두 쪽 보기, 글자 픽셀 지정, 책 끝 정돈 | 5 | 5 | 3 |
| 14 | 내 취향대로 보기 — 쪽 수·책장 배치 고르기, 글자 표지 | 5 | 4 | 3 |
| 15 | 책장 다시 다듬기 — 목록·3열·4열 | 3 | 2 | 2 |
| 16 | 듣기 — 브라우저 음성으로 읽어 주기 | 2 | 2 | 2 |
| 17 | 디자인 새로 만들기 — 참고 이미지 느낌으로 전체 개편 | 5 | 4 | 3 |
| 18 | 글자 크기와 듣기 막대 | 3 | 2 | 3 |
| 19 | 화면 맞추기와 스킬 기록 — 960px 통일, image-to-code 비교 | 5 | 4 | 5 |
| 20 | 기념 카드 영수증 | 3 | 2 | 2 |
| 21 | 글꼴 통일 — 손글씨 글꼴 삭제 | 3 | 2 | 3 |
| 22 | 형광펜 | 3 | 2 | 3 |
| 23 | 출처 문구 정리 | 2 | 1 | 2 |
| 24 | README 정리 — 과제 항목 기준으로 다시 쓰기 | 1 | 1 | 1 |
| | **합계** | **151** | **142** | |

완료되지 않은 9개는 모두 각 단계 끝의 **[직접] 배포 주소에서 확인** 할 일입니다. 기능 구현과 코드 반영은 모두 끝났습니다.

<details>
<summary>Todo 리스트 전체 펼치기 (할 일 151개)</summary>

**1단계. 화면 뼈대와 첫 배포**

- [x] 1-1 **[직접]** GitHub에 Public 저장소 `exchange-reading` 만들고 알려주기 (PRD #12)
- [x] 1-2 Claude가 저장소에 push할 수 있게 연결 (PRD #12)
- [x] 1-3 Next.js(App Router) + TypeScript + Tailwind 프로젝트 만들고 첫 커밋 push (PRD #9, #12)
- [x] 1-4 README 뼈대 만들기: 필수 항목 5개 제목 + 제작한 것 소개 초안 + PRD·Todo 내용 (PRD #12)
- [x] 1-5 frontend-design 스킬을 불러와 화면 디자인 방향(색·글꼴·분위기) 정하기. 이후 1-7~1-13 화면은 이 방향을 따른다 (PRD #12)
- [x] 1-6 단편 3편의 샘플 본문(편당 문단 5~6개)을 데이터 파일로 만들기 (PRD #7)
- [x] 1-7 홈 화면(/) 만들기: 책 목록, 내 책, 내 일기장 영역 (PRD #4.3)
- [x] 1-8 책 카드에 "혼자 읽기"·"함께 읽기" 버튼 달기 (눌러도 아직 동작 없음) (PRD #4.1)
- [x] 1-9 "새 일기장" 버튼과 "혼자 쓰기"·"교환일기" 선택창 만들기 (동작 없음) (PRD #4.2)
- [x] 1-10 리더 화면 /room/[id] 만들기: 본문을 문단 단위로 표시 (PRD #4.1)
- [x] 1-11 리더에 휴대폰에서 읽기 편한 글꼴·줄간격 적용 (PRD #10)
- [x] 1-12 일기장 화면 /diary/[id] 만들기: 지난 일기 목록 + 쓰기 창 (PRD #4.2)
- [x] 1-13 오늘의 질문 10개를 코드에 넣고 날짜로 하나 골라 쓰기 창 위에 표시 (PRD #4.2)
- [x] 1-14 **[직접]** Vercel에서 저장소를 연결해 첫 배포 (PRD #8, #12)
- [x] 1-15 README에 배포 주소(브라우저 실행 방법) 추가 (PRD #12)

**2단계. Supabase 연결과 익명 계정**

- [x] 2-1 **[직접]** Supabase 프로젝트 만들기 (PRD #9)
- [x] 2-2 **[직접]** Authentication 설정에서 Anonymous Sign-Ins 켜기 (PRD #4.4, #9)
- [x] 2-3 테이블 8개를 만드는 SQL 작성 (PRD #9)
- [x] 2-4 RLS 정책 SQL 작성: 메모는 같은 방 멤버만, 일기는 같은 일기장 멤버만 (PRD #9)
- [x] 2-5 샘플 책 3편을 books에 넣는 SQL 작성 (PRD #7)
- [x] 2-6 **[직접]** Supabase SQL Editor에서 2-3~2-5 SQL 실행 (PRD #9)
- [x] 2-7 앱에 Supabase 연결 코드 넣기 (환경변수 사용) (PRD #9)
- [x] 2-8 세션이 없으면 자동으로 익명 로그인하기 (PRD #4.4)
- [x] 2-9 홈 책 목록을 샘플 파일 대신 DB에서 읽기 (PRD #4.3)
- [x] 2-10 **[직접]** Vercel에 Supabase URL·anon key 환경변수 넣고 재배포 (PRD #8, #9) — 환경변수를 넣은 뒤 Deployments에서 Redeploy해야 반영된다
- [x] 2-11 2-3~2-5 SQL을 저장소 `supabase/` 폴더에 파일로 보관 (추가-3)
- [x] 2-12 README에 로컬 실행 방법 추가: 환경변수, SQL 실행 순서, `npm run dev` (추가-3, PRD #12)

**3단계. 혼자 읽기와 혼자 일기**

- [x] 3-1 DB 함수 start_solo_room(book_id) 작성: 내 혼자 방이 있으면 돌려주고 없으면 만듦 (PRD #9)
- [x] 3-2 "혼자 읽기" 버튼을 누르면 혼자 방으로 이동 (PRD #4.1)
- [x] 3-3 리더에서 문단을 누르면 메모 입력창 열기 (300자 제한) (PRD #4.1)
- [x] 3-4 메모를 notes에 저장 (PRD #4.1, #9)
- [x] 3-5 문단 옆에 메모 개수를 표시하고, 누르면 그 문단의 메모 목록 보여주기 (PRD #4.1)
- [x] 3-6 홈 "내 책"에 내가 들어간 방 목록 표시 (PRD #4.3)
- [x] 3-7 "새 일기장 → 혼자 쓰기"를 고르면 mode=solo 일기장 만들고 이동 (PRD #4.2)
- [x] 3-8 일기를 diary_entries에 저장 (1,000자 제한, 그날의 질문도 같이 저장) (PRD #4.2, #9)
- [x] 3-9 일기장 화면의 지난 일기 목록을 DB에서 읽기 (PRD #4.2)
- [x] 3-10 홈 "내 일기장"에 내 일기장 목록 표시 (PRD #4.3)
- [x] 3-11 push → 자동 배포 확인 (PRD #8)

**4단계. 함께 읽기**

- [x] 4-1 DB 함수 join_room(book_id) 작성: 이미 들어간 방 → 3명 미만인 방 → 새 방 순서로 찾기 (PRD #4.1, #9)
- [x] 4-2 join_room에서 남은 펜 색(파랑·초록·주황)과 별명("파란 펜") 배정 (PRD #4.1)
- [x] 4-3 "함께 읽기" 버튼을 누르면 배정된 방으로 이동 (PRD #4.1)
- [x] 4-4 함께 방의 메모를 작성자 펜 색·별명으로 표시하고, 리더 상단에 내 펜 색 표시 (PRD #4.1)
- [x] 4-5 블라인드: 내 메모도 unlock도 없는 문단은 "숨겨진 메모 N개"만 표시 (PRD #4.1)
- [x] 4-6 "그냥 보기" 버튼을 누르면 unlocks에 저장하고 메모 열기 (PRD #4.1, #9)
- [x] 4-7 메모 아래 답글 쓰기 (parent_id, 한 단계만) (PRD #4.1)
- [x] 4-8 혼자 방에서는 블라인드·답글이 나타나지 않게 mode로 분기 (PRD #4.1, #9)
- [x] 4-9 push → 자동 배포 확인 (PRD #8)

**5단계. 교환일기와 마무리**

- [x] 5-1 DB 함수 find_diary_partner() 작성: waiting 교환일기장에 들어가거나 새로 만듦 (PRD #9)
- [x] 5-2 "새 일기장 → 교환일기"를 고르면 짝이 있으면 일기장으로, 없으면 "짝을 기다리는 중" 표시 (PRD #4.2)
- [x] 5-3 짝이 정해지면 두 사람에게 서로 다른 펜 색·별명 배정 (PRD #9, #10)
- [x] 5-4 교대 작성: 마지막 일기가 내 글이면 쓰기 창을 잠그고 "짝의 답장을 기다리는 중" 표시 (PRD #4.2)
- [x] 5-5 교환일기의 글마다 작성자 펜 색·별명 표시 (PRD #10)
- [x] 5-6 홈 "내 일기장"에서 내 차례인 교환일기에 "내 차례" 표시 (PRD #4.3)
- [x] 5-7 모든 화면에 로딩·빈 화면·에러 상태 넣기 (PRD #10)
- [x] 5-8 폭 375px 휴대폰 화면에서 깨지는 곳 고치기 (PRD #2, #10)
- [x] 5-9 없는 방·남의 방 주소로 들어오면 "들어갈 수 없는 방이에요" 안내 후 홈으로 (추가-2, 기능 완성 후)
- [x] 5-10 **[직접]** 단편 3편 원문을 복사해서 전달 (PRD #7)
- [x] 5-11 원문을 문단으로 나눠 books를 교체하는 SQL 작성 (출처는 source에) (PRD #7)
- [x] 5-12 **[직접]** 5-11 SQL 실행 (PRD #7)
- [x] 5-13 README '제작한 것 소개' 완성: 기능 설명, 화면 스크린샷, 배포 주소 (PRD #12)
- [x] 5-14 README 'Todo 변경 내역' 완성: 처음 계획(v1)과 최종 비교, 테스트 후 바뀐 점 (PRD #12)
- [x] 5-15 README '스킬' 완성: frontend-design의 SKILL.md 내용, 화면 작업에서 쓰인 방식(1-5에서 정한 방향), 고른 이유 (PRD #12)
- [x] 5-16 **[직접]** README '느낀점, 결론' 작성 (Claude는 작업 기록 요약만 제공) (PRD #12)
- [x] 5-17 push → 자동 배포 확인 (PRD #8, #12)

**6단계. 완료 기준 점검**

- [x] 6-1 Vercel 주소에 들어가면 로그인 없이 바로 홈이 나온다 (PRD #2) — 새 시크릿 창으로 접속
- [x] 6-2 혼자 읽기: 책을 읽고 문단에 나만 보는 메모를 남길 수 있다 (PRD #2) — 다른 창에서 안 보이는지까지
- [x] 6-3 함께 읽기: 낯선 사람과 같은 책 방에 배정되고 펜 색이 생긴다 (PRD #2) — 창 3개
- [x] 6-4 함께 읽기: 문단에 메모를 남기면 다른 사람 메모가 열리고, 답글을 달 수 있다 (PRD #2)
- [x] 6-5 혼자 일기: 나만 보는 일기를 날마다 쓸 수 있다 (PRD #2) — 2편 연속 작성, 오늘의 질문 표시
- [x] 6-6 교환일기: 짝을 찾고 번갈아 일기를 쓸 수 있다 (PRD #2) — 창 2개로 한 번씩 왕복
- [x] 6-7 휴대폰 화면에서 깨지지 않는다 (PRD #2) — 실제 휴대폰으로 6-1~6-6 중 하나 이상 다시 하기
- [x] 6-8 과제: 저장소가 Public이고, 커밋이 작업 중에 여러 번 나눠 push됐으며, 메시지마다 할 일 번호와 내용이 있다 (PRD #2, #12) — 로그아웃된 창에서 커밋 내역 확인
- [x] 6-9 과제: README에 필수 항목 5개가 모두 있다 (PRD #2, #12) — GitHub 첫 화면에서 항목별로 확인

**7단계. 추가 기능 (마감 후, v4)**

- [x] ~~7-1 리더 읽기 방식 고르기~~ (9-6에서 다시 만듦) 7-1 리더 읽기 방식 고르기: 스크롤 / 페이지(좌우로 밀기·‹ › 버튼·키보드 ← →, 쪽수 표시). 고른 방식은 브라우저에 기억
- [x] 7-2 함께 읽기·교환일기를 랜덤 또는 참여 코드로: 낯선 사람과 / 코드로 만들기(6자리) / 코드로 들어가기, 홈에서도 코드 입력. 코드 방은 랜덤 매칭에 섞이지 않음 (`supabase/07_invite.sql`)
- [x] 7-3 오늘의 질문을 일기 한 편 쓸 때마다 다음 질문으로, 10개 → 30개
- [x] 7-4 보기 설정: 글자 크기 3단계, 밤 모드(앱 전체), 이어 읽기(마지막으로 읽던 문단부터, "처음부터 읽기")
- [x] 7-5 새 메모 표시: 마지막으로 본 뒤 남이 쓴 메모·답글에 "새 메모", "새 메모로 가기", 홈 내 책에 "새 메모 N"
- [x] 7-6 문장 밑줄: 문장을 골라 내 펜 색으로 밑줄, 메모 창에서 지우기, 블라인드 문단에서는 남의 밑줄도 가림 (PRD #11, 제외-4였던 것)
- [x] 7-7 다 읽고 편지 한 장: 책 끝에 함께 읽은 사람들에게(혼자 읽기는 나에게) 500자 편지, 한 사람당 한 장 (PRD #11, 제외-5였던 것)
- [x] 7-8 이 방 나가기: 확인 후 이 방의 내 메모·밑줄·편지를 지우고 나가기, 빈 방은 삭제 (`supabase/08_extras.sql`)
- [x] 7-9 **[직접]** 07·08·09 SQL 실행 후 배포 주소에서 7-1~7-8, 7-10 확인
- [x] 7-10 일기장 나가기: 혼자 쓰는 일기장·짝 없는 교환일기는 지우기, 짝이 있는 교환일기는 나가면 "끝남"(짝은 지난 일기를 볼 수 있고 둘 다 새로 쓸 수 없음) (`supabase/09_leave_diary.sql`) — 7-9 확인 중 추가 요청

**8단계. 화면 구조 개편 (v5)**

- [x] 8-1 처음 화면(/)을 "교환독서 / 교환일기" 고르기로 바꾸기 (읽는 책 수, 일기장 수·내 차례 요약)
- [x] 8-2 사이드바: PC는 왼쪽에 늘 보이고 휴대폰은 ☰ 서랍. 처음·교환독서·교환일기, 참여 코드로 들어가기, 밤 모드
- [x] 8-3 교환독서(/read: 내 책·책장)와 교환일기(/diary: 내 일기장·새 일기장) 화면 분리, 리더·일기장의 뒤로가기도 각 화면으로
- [x] 8-4 교환일기 화면에서 "아는 사람과(코드로)"를 바로 보이게: 혼자 쓰기 · 낯선 사람과 · 아는 사람과 · 코드로 들어가기를 한 화면에
- [x] 8-5 일기장 "일기" 탭을 기본으로: 맨 위 달력(쓴 날에 쓴 사람의 펜 색, 둘 다 쓴 날은 반반) + 쓴 일기. 날짜를 누르면 그날 일기로
- [x] 8-6 "오늘의 일기 쓰기" 탭 분리 (내 차례면 탭에 점), 쓰고 나면 일기 탭으로 돌아와 방금 쓴 일기 표시
- [x] 8-7 **[직접]** 배포 주소에서 PC·휴대폰으로 8-1~8-6 확인

**9단계. 사용 후 개선 (v6)**

- [x] 9-1 일기장 이름 바꾸기 (교환일기는 두 사람 모두, 30자, 비우면 기본 이름) (`supabase/10_v6.sql`)
- [x] 9-2 내가 쓴 일기 지우기 (확인 후, 남의 일기는 못 지움)
- [x] 9-3 교환일기는 두 사람이 같은 질문에 답하기: 짝이 답한 질문이 있으면 그 질문, 둘 다 답하면 다음 질문 (7-3 수정)
- [x] 9-4 일기마다 댓글 (300자, 내 댓글 지우기)
- [x] 9-5 날짜별 탭: 달력이나 일기 미리보기에서 날짜를 누르면 그날 쓴 일기만 따로 보이는 탭이 열림 (×로 닫기). 일기 탭 목록은 3줄 미리보기
- [x] 9-6 책처럼 넘기는 페이지: 문단을 쪼개 쪽마다 빈자리 없이 흐르게, 화면 가장자리를 눌러도 넘김 (7-1 다시 만듦)
- [x] 9-7 문단 메모 빼고 "밑줄에 한마디": 밑줄 그을 때 한마디(선택), 밑줄을 누르면 한마디·답글, 블라인드는 문단 단위(그 문단에 내 밑줄이 있거나 그냥 보기), 새 밑줄·답글 표시 (3-3~3-5, 4-5~4-7 대체)
- [x] 9-8 **[직접]** 10_v6.sql 실행 후 배포 주소에서 9-1~9-7 확인

**10단계. 오래 쓰기 위한 기능 (v7)**

- [x] 10-1 나만의 열쇠: 12자 열쇠와 복구 링크(`/key#열쇠`)를 만들고, 다른 브라우저에서 열쇠를 넣으면 옛 계정의 방·일기장·글을 지금 계정으로 옮김. 열쇠는 해시로만 저장 (`supabase/11_v7.sql`)
- [x] 10-2 짝이 멀어졌을 때: 짝의 차례로 7일 넘게 멈추면 "짝이 잠시 멀어졌어요" + 조금 더 기다리기(3일)·여기서 마무리하기·마무리하고 새 짝 찾기. 마무리해도 두 사람 모두 지난 일기를 볼 수 있음. 짝을 3일 넘게 못 만나면 안내, 홈에 "짝이 조용해요"·"마무리됨"
- [x] 10-3 다 읽은 뒤 기념 카드: 함께 그은 밑줄·한마디·편지를 대출 카드 모양 한 장으로 모아 이미지 저장·공유 (`/room/[id]/card`)
- [x] 10-4 책장 넓히기: 이상 「날개」, 김유정 「동백꽃」 원문 추가 (`supabase/12_more_books.sql`). 함께 받은 「소나기」(황순원, 2000년 사망)·「수난이대」(하근찬, 2007년 사망)는 저작권 보호기간(사후 70년) 중이라 넣지 않음
- [x] 10-5 교환독서 화면·처음 화면 소개 문구를 밑줄·한마디 기준으로 고침 (9-7 이후 남아 있던 문단 메모 설명)
- [x] 10-6 **[직접]** 11_v7.sql, 12_more_books.sql 실행 후 배포 주소에서 확인

**11단계. 사용 후 개선 (v8)**

- [x] 11-1 나만의 열쇠 계속 보이기: 열쇠 원문을 이 브라우저에 기억해 `/key`에서 언제든 보고 복사. 되찾은 열쇠도 기억. DB에는 그대로 해시만 저장 (10-1 고침)
- [x] 11-2 책장 넓히기: 현진건 「B사감과 러브레터」, 김동인 「감자」, 나도향 「벙어리 삼룡이」 원문 추가 (`supabase/13_more_books.sql`)
- [x] 11-3 **[직접]** 13_more_books.sql 실행 후 배포 주소에서 확인
- [x] 11-4 「벙어리 삼룡이」를 지금 맞춤법과 띄어쓰기로 다듬기: 문단과 내용은 그대로 (`scripts/samnyong-modern.txt`, 11-2 고침)

**12단계. 오래 함께하기 (v9)**

- [x] 12-1 같은 사람들과 다음 책: 함께 읽기 책 끝에서 다음 책을 제안하고, 방 사람 모두가 좋다고 하면 같은 펜 색으로 새 방이 열림. 코드 없는 방이라 새 사람은 들어올 수 없고, 거절은 상대에게 따로 알리지 않음. 내 책·리더에 제안 표시 (`supabase/14_v9.sql`)
- [x] 12-2 나의 독서 달력(`/calendar`): 날마다 읽은 문단 수, 밑줄, 답글, 편지, 일기를 나만 보는 달력으로. 점수·연속 기록 없음. 방을 나가도 읽은 기록은 남고, 열쇠로 되찾으면 함께 옮겨짐 (`supabase/14_v9.sql`)
- [x] 12-3 **[직접]** 14_v9.sql 실행 후 배포 주소에서 확인

**13단계. 읽는 화면 다듬기 (v10)**

- [x] 13-1 페이지 모드의 책 끝 쪽(편지, 다음 책, 출처)을 쪽 가운데로 정렬. "이 방 나가기"는 책 끝 가운데에 눈에 띄는 버튼으로 (스크롤 모드 포함)
- [x] 13-2 스크롤 모드에서 본문 왼쪽의 색 띠 없애기
- [x] 13-3 글자 크기를 픽셀로: 12~40px을 직접 입력하거나 ±로, 작게·보통·크게는 바로가기로 남김. 예전에 고른 크기는 그대로 이어짐 (7-4 고침)
- [x] 13-4 넓은 화면의 페이지 모드는 두 쪽씩: 화면 너비 900px 이상이면 펼친 책처럼 두 쪽을 함께 보여 주고 두 쪽씩 넘김, 쪽수는 "3–4 / 20쪽" (9-6에 더함)
- [x] 13-5 **[직접]** 배포 주소에서 PC·태블릿·휴대폰으로 확인

**14단계. 내 취향대로 보기 (v11)**

- [x] 14-1 보기 설정에서 한 화면에 볼 쪽 수 고르기: 자동(900px 이상 두 쪽) · 한 쪽 · 두 쪽(700px 이상, 휴대폰은 한 쪽) (13-4 고침)
- [x] 14-2 글자 크기를 바꾸면 책 머리(제목, 저자, 함께 읽는 사람, 안내 글)도 같은 비율로 커지게 (13-3 고침)
- [x] 14-3 책장 배치 고르기: 목록 · 2열 · 3열 · 표지 크게. 고른 배치는 브라우저에 기억
- [x] 14-4 책 표지: 이미지가 없는 책은 제목과 저자로 만든 글자 표지, 이미지는 `public/covers/`에 넣고 `src/data/covers.ts`에 이으면 바로 표시
- [ ] 14-5 **[직접]** 배포 주소에서 확인, 표지 이미지가 있으면 전달

**15단계. 책장 다시 다듬기 (v12)**

- [x] 15-1 책장 배치를 목록·3열·4열로 정리 (14-3의 2열·표지 크게 뺌, 그것을 골라 뒀으면 목록으로)
- [x] 15-2 목록에서 혼자 읽기·함께 읽기 버튼을 책 옆으로 (휴대폰은 책 옆에 위아래로)
- [ ] 15-3 **[직접]** 배포 주소에서 PC·휴대폰으로 확인

**16단계. 듣기 (v13)**

- [x] 16-1 듣기(TTS): 리더 위 "듣기" 버튼으로 지금 읽는 문단부터 소리 내어 읽기. 멈추기·이어 듣기, 앞·다음 문단, 속도 0.8~1.5배, 한국어 목소리가 여럿이면 고르기, 읽는 문단 표시와 따라가기. 브라우저 음성(Web Speech API)을 써서 비용·서버 없음. 들은 문단도 독서 달력에 쌓임
- [x] 16-2 **[직접]** 배포 주소에서 PC·휴대폰으로 소리가 나는지 확인

**17단계. 디자인 새로 만들기 (v14)**

- [x] 17-1 색과 글꼴 바꾸기: 흰 면·진한 잉크, 주황·남색·겨자 책 색, 제목 Black Han Sans, 앱의 말 Gothic A1. 책 본문·일기·손글씨 글꼴은 그대로 (`docs/DESIGN.md`)
- [x] 17-2 처음 화면: 큰 제목, 참여 코드 입력칸, 눌러서 이동하는 책등 세 권
- [x] 17-3 사이드바를 아이콘이 있는 흰 패널로, 책장·내 책·내 일기장을 흰 카드로, 표지를 색 표지로
- [x] 17-4 밤 모드와 휴대폰 화면 맞추기, 기념 카드 색 맞추기
- [ ] 17-5 **[직접]** 배포 주소에서 PC·휴대폰·밤 모드로 확인

**18단계. 글자 크기와 듣기 막대 (v15)**

- [x] 18-1 앱 전체 글자를 한 단계씩 줄이기. 리더 기본 16px, 바로가기 14·16·18, 처음 화면 제목도 축소. 손글씨는 작으면 읽기 어려워 그대로 (13-3 고침, 저장된 글자 크기는 한 번 16px로 돌아감)
- [x] 18-2 듣기 막대를 본문 위 겹침에서 위쪽 메뉴 바로 아래로 옮겨 본문을 가리지 않게 (16-1 고침)
- [ ] 18-3 **[직접]** 배포 주소에서 PC·휴대폰으로 확인

**19단계. 화면 맞추기와 스킬 기록 (v16)**

- [x] 19-1 줄였던 글자 크기를 처음 화면만 남기고 되돌리기. 리더 본문 기본 16px은 보기 설정 값이라 유지 (18-1 고침)
- [x] 19-2 처음 화면 책등 크기 줄이기
- [x] 19-3 PC에서 교환일기·일기장·나의 독서 달력·나만의 열쇠의 내용 너비를 교환독서와 같은 960px로
- [x] 19-4 image-to-code 스킬로 처음 화면과 참고 이미지 비교, 찾은 차이 고치기, README 스킬 항목에 기록 (`docs/visual-verification-home.md`)
- [ ] 19-5 **[직접]** 배포 주소에서 PC·휴대폰으로 확인

**20단계. 기념 카드 영수증 (v17)**

- [x] 20-1 기념 카드를 독서 영수증으로: 위쪽 색 표지(책 색), 도서명·지은이·발표·독서일·독자, 책의 문장, 편지, 합계, 점선 구분 (10-3 고침)
- [x] 20-2 기념 카드 화면 너비를 960px로 맞추고 제목 크기를 다른 화면과 통일
- [ ] 20-3 **[직접]** 배포 주소에서 카드 모양과 이미지 저장 확인

**21단계. 글꼴 통일 (v18)**

- [x] 21-1 손글씨 글꼴을 없애고 밑줄 한마디·답글·편지·댓글·펜 이름을 책 글꼴(고운바탕)로 통일. 펜 색은 그대로 (`@fontsource/nanum-pen-script` 삭제)
- [x] 21-2 일기 질문을 검은색 기본 글꼴로 (쓰기 화면, 일기 목록, 일기 카드)
- [ ] 21-3 **[직접]** 배포 주소에서 리더·일기장·기념 카드 확인

**22단계. 형광펜 (v19)**

- [x] 22-1 문장을 고르면 밑줄 긋기와 형광펜 중 고르기. 내 펜 색으로 칠해지고, 한마디·답글·블라인드·지우기는 밑줄과 같음 (`supabase/15_marker.sql`)
- [x] 22-2 밑줄 창과 기념 카드 합계에 형광펜 표시, SQL 실행 전의 DB에서는 형광펜 버튼을 숨기고 밑줄은 그대로 동작
- [ ] 22-3 **[직접]** 15_marker.sql 실행 후 배포 주소에서 확인

**23단계. 출처 문구 (v20)**

- [x] 23-1 책 끝 출처에서 "복사 과정에서 ... 고침" 문구 빼기 (`supabase/16_book_source.sql`). 「벙어리 삼룡이」의 표기를 다듬었다는 안내는 내용을 바꾼 사실이라 유지
- [ ] 23-2 **[직접]** 16_book_source.sql 실행 후 배포 주소에서 확인

**24단계. README 정리 (v21)**

- [x] 24-1 README를 과제 필수 항목 기준으로 다시 정리: 제출 요건 표, 기능 소개를 영역별로(현재 기준), Todo 전체 표와 할 일 목록, 처음 계획과 최종 비교, 스킬별 쓴 곳, 느낀점·결론의 숫자 고침

</details>

## 3. Todo 리스트의 변경 내역

버전별 원본 기록은 [Todo 변경 내역](docs/TODO.md#todo-변경-내역)에 있습니다. 아래는 처음 계획(v1)과 최종(v21)을 비교한 것입니다.

### 처음 계획과 최종 비교

| | 처음 계획 (v1) | 최종 (v21) |
|---|---|---|
| 단계 | 6단계 (화면 뼈대 → Supabase → 혼자 → 함께 → 교환일기 → 점검) | 24단계 (1~6단계는 마감 버전, 7~24단계는 써 보며 추가) |
| 할 일 | 61개 | 151개 |
| 책에 남기는 것 | 문단 메모와 답글 | 문장 밑줄·형광펜 + 한마디와 답글 (문단 메모는 화면에서 뺌) |
| 읽는 화면 | 문단을 세로로 나열 | 스크롤/페이지(한 쪽·두 쪽), 글자 픽셀 지정, 밤 모드, 이어 읽기, 듣기 |
| 화면 구조 | 홈 한 화면에 책·내 책·일기장 | 처음 화면(책등) + 교환독서·교환일기 화면 + 사이드바 |
| 디자인 | 회녹빛 종이, 명조, 펜 색 손글씨 | 흰 면·굵은 제목·책등과 색 표지, 글꼴은 고운바탕으로 통일 |

**한 줄 요약별로 보기**

| 구분 | 무엇이 | 처음 → 최종 |
|---|---|---|
| 기능 수정 | 책에 남기는 기록 | 문단 메모(3-3~3-5, 4-5~4-7) → 문장 밑줄(7-6) → 밑줄에 한마디(9-7) → 형광펜 추가(22-1) |
| 기능 수정 | 페이지 넘기기 | 문단 단위 쪽(7-1) → 글이 흐르는 쪽(9-6) → 두 쪽 자동(13-4) → 쪽 수 고르기(14-1) |
| 기능 수정 | 오늘의 질문 | 날짜로 10개 순환(1-13) → 한 편마다 다음 질문, 30개(7-3) → 교환일기는 같은 질문에 둘 다 답한 뒤 다음(9-3) |
| 기능 수정 | 글자 크기 | 3단계(7-4) → 12~40px(13-3) → 책 머리도 함께(14-2) → 전체 축소(18-1) → 처음 화면만 축소(19-1) |
| 기능 수정 | 기념 카드 | 대출 카드(10-3) → 독서 영수증(20-1) |
| 기능 수정 | 나만의 열쇠 | 한 번만 보임(10-1) → 그 브라우저에서 계속 보임(11-1) |
| 기능 수정 | 혼자 일기장 만들기 | "함수 없이 바로"(PRD) → DB 함수 `create_solo_diary()`(3-7, RLS 때문) |
| 테스트 후 변화 | 배포, 모달, 페이지 모드 등 | 아래 [테스트 후 생긴 변화](#테스트-후-생긴-변화) 표 |
| 뺀 것 | 문단 메모 화면, 1단계 임시 링크·예시 일기장, 책장 2열·표지 크게, 손글씨 글꼴, 저작권 보호 중인 2편, 책 출처의 복사 관련 문구 | |
| 새로 넣은 것 | 과제 요건 할 일(v2), 없는 방 안내·로컬 실행(v3), 7~24단계 전체, PRD에서 뺐던 문장 밑줄·편지(제외-4, 제외-5) 되살림 | |

### 계획 단계에서 바뀐 것 (v1 → v3)

| 버전 | 바뀐 것 | 이유 |
|---|---|---|
| v1 | 처음 작성: 6단계, 할 일 61개 | — |
| v2 | GitHub Public 저장소 만들기·연결을 1단계 맨 앞으로. README 할 일(1-4, 1-15, 5-13~5-16), 스킬 정하기(1-5), 과제 요건 점검(6-8, 6-9), 커밋·변경 기록 규칙 추가 (61 → 70개) | 과제 제출 요건(Public 저장소, 중간 push, README 5개 항목) 반영 |
| v3 | 스킬을 frontend-design으로 확정. 추가 제안 승인: 없는 방 주소 안내(5-9), SQL 파일 보관과 로컬 실행 방법(2-11, 2-12) (70 → 73개) | 채점자가 직접 실행해 볼 수 있게, 남의 방 주소가 고장처럼 보이지 않게 |

### 구현하면서 바뀐 것 (1~6단계)

| 할 일 | 처음 계획 | 실제 |
|---|---|---|
| 2-3 | books: id, title, author, source, paragraphs | `year` 칸 추가해 홈·리더에 발표 연도 표시 |
| 2-5, 5-11 | 책 SQL을 직접 작성 | 본문을 `books.json`으로 분리하고 SQL을 만드는 스크립트 추가. 원문은 텍스트 파일을 문단으로 나누는 스크립트(`scripts/import-originals.py`)로 넣음 (운수 좋은 날 135문단, 봄·봄 129문단, 메밀꽃 필 무렵 91문단) |
| 5-16 | 느낀점·결론은 직접 작성 | 작업 기록을 바탕으로 Claude가 초안을 쓰도록 요청 |
| 2-9 | 홈 책 목록만 DB에서 읽기 | 리더 본문도 DB에서 읽기 (홈과 리더가 같은 데이터를 보게) |
| 3-7 | 혼자 일기장은 함수 없이 바로 만든다 (PRD #9) | DB 함수 `create_solo_diary()`로 만든다. 만든 직후엔 아직 멤버가 아니라 RLS 때문에 그 일기장을 읽을 수도 들어갈 수도 없었다 |
| 1-8, 3-2 | 책 카드에 버튼 | 1단계의 "책 제목을 누르면 본문" 임시 링크와 예시 일기장을 3단계에서 삭제 |
| 4-4 | 리더 상단에 내 펜 색 | 이 방 사람들 전체의 펜 색·별명과 빈자리 수도 표시 |
| 4-7 | 한 단계 답글 | 화면뿐 아니라 DB 정책에서도 답글의 답글을 막음 |
| 5-3 | 서로 다른 펜 색 | 먼저 온 사람 파란 펜, 짝 주황 펜으로 고정 |
| 5-4 | 쓰기 창 잠금 | DB 함수 `can_write_diary()`로도 막음. 짝이 오기 전에도 잠그고 "다시 확인하기" 버튼 추가 (알림이 없어서) |
| 5-6 | 홈에 "내 차례" | DB 함수 `my_diaries()`로 "내 차례"·"짝의 차례"·"짝을 기다리는 중"을 한 번에 계산 |
| 5-7 | 로딩·빈 화면·에러 | 화면별 상태에 더해 앱 전체의 "없는 페이지", "예상 못한 오류" 화면 추가 |
| 5-8 | 375px 점검 | 320px까지 점검 |
| 5-9 | 안내 후 홈으로 | 안내 문구와 함께 5초 뒤 자동으로 홈 이동, 일기장 주소에도 적용 |

### 테스트 후 생긴 변화

| 언제 | 문제 | 고친 것 |
|---|---|---|
| 2단계 확인 | 배포 주소에 "Supabase 연결 정보(환경변수)가 없어요"가 뜸 | 환경변수를 넣기 전에 만들어진 배포였다. Vercel에서 다시 배포해 해결하고 2-10과 README에 "넣은 뒤 다시 배포"를 적음 |
| 3단계 확인 | 새 일기장을 만든 뒤 일기 칸이 눌리지 않음 | Next.js 16은 지난 화면을 지우지 않고 숨겨 두어서, 열린 선택창(모달)이 남아 화면 전체를 막았다. 이동 전과 화면이 숨겨질 때 모달을 닫도록 수정 |
| 3단계 확인 | 시크릿 창에서 방 주소를 열자 Vercel 로그인 창이 뜸 | 배포마다 생기는 미리보기 주소는 Vercel 배포 보호 대상이었다. 확인은 정식 주소(exchange-reading.vercel.app)로만 하기로 함 |
| 5단계 디자인 점검 | "내 차례" 표시를 주황색으로 만들었더니 "주황 펜" 사람처럼 보임 | 색은 사람만 뜻한다는 디자인 원칙에 맞춰 잉크색으로 변경 |
| 7단계 확인 | 넓은 PC 화면의 페이지 모드에서 1쪽이 책 머리만으로 차면 "다음"을 눌러도 1쪽으로 돌아옴 | 휴대폰 크기로만 테스트했던 탓. 쪽의 기준 항목을 문단 번호와 따로 기억하도록 수정 |
| 7단계 확인 | 선택창 안의 코드 입력칸이 창을 화면보다 넓게 만듦 | 열 너비 고정 |
| 7단계 확인 | 쪽 높이를 재려고 그리는 숨은 복사본이 입력칸 id를 겹치게 만듦 | 복사본을 inert로, id를 고유하게 |
| 7단계 확인 | (기능 요청) 일기장도 나갈 수 있어야 함 | 7-10 일기장 나가기 추가. 교환일기는 지우지 않고 "끝남"으로 |
| 12단계 확인 | 페이지 모드에서 다음 책 칸이 쪽 끝에서 잘려 버튼이 다음 쪽으로 넘어감 | 칸 전체가 한 쪽에 나오게 수정 |
| 10단계 확인 | frontend-design 스킬로 7~9단계 화면을 다시 점검해 바꿨는데 사용자가 이전이 낫다고 함 | 되돌림(커밋 기록에 남음) |
| 18단계 후 | 앱 전체 글자를 줄였더니 처음 화면 말고는 작음 | 19-1에서 처음 화면만 작게 남기고 되돌림 |
| 19단계 | image-to-code로 참고 이미지와 처음 화면을 비교 | 책등이 겹쳐 그림자가 가려지던 것과 흐린 화살표 버튼을 고침 ([기록](docs/visual-verification-home.md)) |

### 마감 후 단계별 변경 (v4 → v21)

마감 버전의 완료 기준 9개를 모두 확인한 뒤(6단계), 실제로 써 보며 나온 요청으로 단계를 이어 붙였습니다. 각 단계는 Todo에 먼저 적고, 변경 내역에 버전을 올린 다음 구현했습니다.

| 버전·단계 | 바뀐 것 (괄호는 고친 이전 할 일) | 이유 |
|---|---|---|
| v4 · 7단계 (73 → 83개) | 페이지 모드, 랜덤/참여 코드, 질문 30개, 글자 크기·밤 모드·이어 읽기, 새 메모 표시, 문장 밑줄·편지(PRD 제외-4·5 되살림), 방·일기장 나가기. 페이지는 문단을 쪼개지 않고 나눔, 이어 읽기 기준은 브라우저에 저장, 방을 나가면 내 기록을 지움 | 마감 기능을 다 확인한 뒤 써 보며 나온 요청 |
| v5 · 8단계 (→ 90개) | 홈 한 화면 → 처음 화면에서 교환독서/교환일기 고르기 + 사이드바. 일기장은 달력과 쓴 일기가 먼저, 쓰기는 탭으로 | 두 축이 한 화면에 섞여 있었고, 쓴 일기를 다시 보기 어려웠다 |
| v6 · 9단계 (→ 98개) | 글이 흐르는 페이지(7-1), 문단 메모 → 밑줄에 한마디(3-3~3-5, 4-5~4-7), 교환일기 같은 질문(7-3), 날짜 탭·댓글·이름 바꾸기 | 쪽마다 빈자리가 남았고, 밑줄과 문단 메모가 겹쳤고, 둘이 다른 질문에 답하고 있었다. 사용자에게 "밑줄만 / 밑줄에 한마디 / 문단 메모 유지"를 물어 결정 |
| v7 · 10단계 (→ 104개) | 나만의 열쇠, 짝이 멀어졌을 때, 기념 카드, 「날개」·「동백꽃」. 받은 4편 중 「소나기」·「수난이대」는 저작권 보호 중이라 제외 | 로그인 없는 복구 수단, 짝이 사라졌을 때의 처리가 필요했다 |
| v8 · 11단계 (→ 108개) | 열쇠 계속 보이기(10-1), 책 3편 추가, 「벙어리 삼룡이」를 지금 맞춤법으로 | 다른 탭에 다녀오면 열쇠가 사라졌다. 1925년 표기가 읽기 어려웠다 |
| v9 · 12단계 (→ 111개) | 같은 사람들과 다음 책("둘 다"가 아니라 "방 사람 모두"), 나의 독서 달력(점수·연속 기록 없음) | 한 권을 끝낸 뒤에도 인연이 이어지게, 읽은 날이 부담 없이 쌓이게 |
| v10 · 13단계 (→ 116개) | 글자 픽셀 지정(7-4), 900px 이상 두 쪽 보기(9-6), 책 끝 가운데 정렬, 나가기 버튼 | 넓은 화면의 빈자리, 더 세밀한 글자 크기, 찾기 어려운 나가기 |
| v11 · 14단계 (→ 121개) | 쪽 수 고르기(13-4), 책 머리 글자도 함께 커짐(13-3), 책장 배치, 글자 표지 | 넓은 화면에서도 한 쪽으로 읽고 싶을 때가 있었고, 책이 8권이 되니 책장이 길었다 |
| v12 · 15단계 (→ 124개) | 책장 배치를 목록·3열·4열로(14-3의 2열·표지 크게 뺌), 목록 버튼을 책 옆으로 | 써 보니 필요 없는 배치가 있었다 |
| v13 · 16단계 (→ 126개) | 듣기(TTS). 유료 음성 대신 무료 브라우저 음성 | 과제용이라 비용 없는 쪽을 먼저 |
| v14 · 17단계 (→ 131개) | 참고 이미지 두 장의 느낌으로 디자인 전체 개편. "색은 사람만"을 고쳐 책등·표지에는 책의 색 | 기존 디자인이 밋밋했다 |
| v15 · 18단계 (→ 134개) | 글자 한 단계 축소, 리더 기본 16px(13-3), 듣기 막대를 위쪽 고정으로(16-1) | 정보가 과하게 들어오고 듣기 상자가 본문을 가렸다 |
| v16 · 19단계 (→ 139개) | 처음 화면만 축소(18-1), 책등 축소, PC 내용 너비 960px 통일, image-to-code로 비교 | 화면마다 글자와 너비가 들쑥날쑥했다 |
| v17 · 20단계 (→ 142개) | 기념 카드를 독서 영수증으로(10-3) | 사용자가 찾은 독서 영수증 레퍼런스가 더 간직하고 싶은 모양이었다 |
| v18 · 21단계 (→ 145개) | 손글씨 글꼴 삭제, 한마디·답글·편지를 책 글꼴로. 일기 질문은 검은 기본 글꼴 | 글꼴이 많아 산만했다. 사람 구분은 펜 색만으로 충분하다 |
| v19 · 22단계 (→ 148개) | 형광펜. 새 표 대신 highlights에 mark 칸, 색은 내 펜 색 | 밑줄 말고 칠하고 싶다는 요청. 색은 사람을 뜻해야 해서 노란색 하나로 두지 않음 |
| v20 · 23단계 (→ 150개) | 책 끝 출처에서 복사 관련 문구 삭제. 「벙어리 삼룡이」 표기 안내는 유지 | 읽는 사람에게 필요 없는 문구였다 |
| v21 · 24단계 (→ 151개) | README를 과제 필수 항목과 지금 기능 기준으로 다시 정리 | 단계별로 덧붙인 README에서 기능 소개가 흩어지고 숫자가 마감 버전에 머물러 있었다 |

### 하지 않기로 한 것

로그인 화면, 안전장치(연락처 가림·신고·위기 표현 안내·연령 확인), 순서대로 넘기는 릴레이와 기한, 대나무숲, 취향 매칭, 알림, 관리자 화면, 메모 레이어 모드. 처음 계획에서 뺐던 것 중 **문장 하이라이트(제외-4)와 마지막 장 편지(제외-5)만** 7단계에서 되살렸습니다. 모르는 사람에게 주소를 공개하기 전에는 안전장치를 먼저 넣어야 합니다 (PRD #6, #11).

## 4. 스킬

직접 만든 스킬은 없고, 공개된 스킬 두 개를 골라 썼습니다. 두 스킬 모두 저장소의 `.claude/skills/`에 넣어 작업 중에 불러왔고, 원문은 `docs/skills/`에도 복사해 두었습니다.

| 스킬 | 출처 | 쓴 곳 | 고른 이유 (요약) |
|---|---|---|---|
| frontend-design | Anthropic 공개 스킬 (Apache 2.0) | 1-5 처음 디자인 방향, 10단계 화면 재점검, 17단계 디자인 개편 | 디자이너 없이 "AI가 만든 티"가 나지 않는 의도적인 디자인을 정하는 절차가 필요했다 |
| image-to-code | [magebase/image-to-code-skill](https://github.com/magebase/image-to-code-skill) (MIT) | 19-4 처음 화면을 참고 이미지와 비교해 다듬기 | 말로 "더 예쁘게"가 아니라, 레퍼런스와 화면을 나란히 놓고 차이를 근거 있게 찾고 싶었다 |

**직접 만들지 않은 이유** — 필요한 것이 "디자인 판단을 돕는 일반적인 절차"와 "참고 이미지와 결과 비교"였고, 둘 다 이미 잘 정리된 스킬이 있었습니다. 마감 안에 확실하게 쓰려면 검증된 스킬을 고르는 편이 나았습니다.

### 사용한 스킬: frontend-design

Anthropic이 공개한 Claude 스킬로, 새 화면을 만들 때 "어디서 본 듯한 기본값"이 아니라 주제에 맞는 의도적인 디자인을 하도록 안내한다. 원문은 [`docs/skills/frontend-design/SKILL.md`](docs/skills/frontend-design/SKILL.md)에 있고, 라이선스(Apache 2.0)는 같은 폴더의 `LICENSE.txt`다.

<details>
<summary>SKILL.md 전문 펼치기</summary>

```markdown
---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a design studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. This client has already rejected proposals that felt cliché or templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take aesthetic risk if justified.

## Ground your designs in the subject matter

If the brief does not identify what the product or subject matter is, identify it yourself before designing, and confirm with the client. You can come up with one concrete subject, the design's audience, and the design's primary job, as a proposal. If there's any information in your memory about the client's preferences or context about what they're building, use that as a hint. The subject's industry, subject matter, materials, and vernacular are where distinctive visual choices come from — a design for a toy for girls aged 8–11 will be very aesthetically different from a dashboard for financial analysts. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is the first thing viewers will see. Open with the most characteristic thing in the subject's world, in the form that is most appropriate: a headline, an image, an animation, a live demo, an interactive moment, or other treatments. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the default treatment, so only use it if that's truly the best option.

Typography carries the personality of the page. You don't need a different typeface for display or headline text and body content: use one family or two, and if two, make them clearly distinct.

Choose your typefaces deliberately, not the default families you would reach for on any other project, and set a clear type scale following the default guidance of The Elements of Typographic Style with intentional weights, widths, and spacing. When type is used as a headline or visual element, use the type treatment itself as an active part of the design, not a neutral delivery vehicle for the content.

Default to line lengths of less than 80 characters. Serif typefaces can have slightly longer line lengths; give serif body text slightly more line-height than a sans-serif.

Avoid these default typographic treatments; they are the commonest tells of a generated page:
- Accenting just a single word or phrase in a headline, like putting one word in italic/bold or a different color.
- Using all caps for labels.
- Adding unnecessary typographic labels above content.

Visual structure is information. Structural devices like outlines, borders, numbering, eyebrows, dividers, labels, etc., encode useful information about the content rather than decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence — like a stepped process or a timeline. Before adding numbered markers, check the content really is a sequence.

Use non-user-triggered motion sparingly and deliberately, only to draw attention. A single orchestrated moment — one page-load sequence or one reveal — lands better than scattered effects; fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated. Motion that answers a person's action (opening, expanding, confirming) is welcome when it shows what changed.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy and placeholder content. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: plan, review against the brief, build, critique

For calibration, AI-generated design right now clusters around some traits:
1. a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or warm-clay accent (often near #D97757 — Anthropic's own Claude-interaction accent, so on a user's brief it reads as a tell);
2. a near-black background with a single bright acid-green or vermilion accent;
3. a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns;
4. the SaaS-card kit: content chopped into identical rounded cards, one border-radius on everything regardless of hierarchy, the same soft grey shadow (rgba(0,0,0,.1)) under each, and gradient washes as decoration;
5. template chrome that appears whatever the subject: a tracked-out ALL-CAPS eyebrow label above every heading; meta strings joined with middle dots ('A · B · C'); labels built as 'WORD — fragment' with a spaced em dash; tinted near-black (#0B0B0B, #111) standing in for black; a monospace face for small data labels; a '→' appended to link and button text.

All traits are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. As with a hired human designer, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the client's design brief: create a compact token system with color, type, layout, and principles.
- Color: describe the core base palette as 4–6 named hex values.
- Type: the typefaces and their roles.
- Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Include alignment guidance; should the content be left aligned, center aligned, justified?
- Principles: the high-level guidance for what makes this page unique.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and an element-based selector like .cta). This can happen often with padding/margin between sections.

## Restraint and self-critique

Spend your boldness in one place. Let one element be the memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes. Critique your own work as you build, taking screenshots to review if your environment supports it — a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creatives have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand and use. They are design content, not decoration. Bring the same intentionality and minimalism to copywriting that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's perspective. Name things by what users will understand in simple language, not by how the system is built. A user manages notifications, not webhook config. Describe what something is or does in plain terms rather than selling it. Being specific and legible to new users is always better than being clever.

Use active voice as default. A CTA says exactly what happens when it is used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.

Keep the tone conversational: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each written element do exactly one job.
```

</details>

### 고른 이유

- 이 앱은 기능만큼 **분위기**가 중요하다. "낯선 사람과 천천히 책을 돌려 읽는" 느낌이 화면에서 나지 않으면 그냥 메모 앱이 된다.
- 바이브코딩으로 화면을 만들면 둥근 카드, 그림자, 보라색 그라데이션 같은 비슷한 모양이 나오기 쉽다. 이 스킬은 그런 "AI가 만든 티가 나는 기본값" 목록을 구체적으로 짚고 피하게 해 준다.
- 혼자 작업하는 마감 프로젝트라 디자이너가 없다. 디자인 결정을 한 번 정해 두고(1-5) 이후 화면이 모두 따르게 하는 절차가 필요했다.
- 직접 스킬을 만들지 않은 이유: 필요한 것이 "디자인 판단을 돕는 일반적인 절차"여서, 이미 잘 정리된 스킬을 쓰는 편이 마감 안에 더 확실했다.

### 작업에서 쓰인 방식

스킬이 시키는 대로 **계획 → 브리프와 대조해 수정 → 구현 → 스크린샷으로 자기 비평**을 거쳤고, 결과를 [`docs/DESIGN.md`](docs/DESIGN.md)에 남긴 뒤 모든 화면이 이 방향을 따랐다. 이 스킬은 세 번 썼다.

**① 처음 디자인 (1-5, 1~6단계 화면 전체)**

1. **주제에서 출발** — 돌려 읽은 책의 여백, 색이 다른 볼펜, 공책 줄, 밑줄을 재료로 삼았다. 핵심 아이디어는 **"펜 색이 곧 사람이다"**: 사람은 이름 없이 검정·파랑·초록·주황 펜으로만 구분되므로, 색은 장식이 아니라 "누가 썼는가"를 뜻할 때만 쓴다.
2. **토큰 정하기** — 색 9개(종이·지면·잉크·연필·여백선 + 펜 4색), 글꼴 3개(본문 고운바탕, 앱의 말 고운돋움, 손으로 쓴 것 나눔손글씨 펜), 본문 18px / 줄간격 1.95, 폭 640px 안 왼쪽 정렬.
3. **기본값과 대조해 고치기** — 스킬이 꼽은 AI 디자인의 흔한 특징과 비교해 세 가지를 바꿨다.
   - 처음 떠올린 "따뜻한 크림색 종이 + 명조 + 테라코타 포인트"는 책 앱의 뻔한 기본값이라, 회녹빛 갱지와 청흑색 잉크로 바꾸고 포인트 색을 따로 두지 않았다.
   - 그림자 있는 카드 격자 대신 도서관 대출 카드처럼 **가는 줄로 나뉜 목록**을 썼다.
   - 섹션 위 영문 대문자 라벨(BOOKS 등)을 뺐다.
4. **과감함은 한 곳에만** — 본문은 인쇄된 명조, 메모·답글·오늘의 질문은 그 사람의 펜 색 손글씨로 썼다. 로고 아래 파란 손그림 밑줄 하나 외에는 장식을 두지 않았다.
5. **스크린샷으로 자기 비평** — 매 단계 휴대폰 폭으로 화면을 찍어 확인하고 고쳤다. 예: 공책 줄이 글자를 가로지르던 것을 글자 아래로 내림, "내 차례" 표시가 주황 펜 사람처럼 보여 잉크색으로 바꿈, 320px에서 메모 창이 넘치지 않는지 확인.
6. **품질 기준** — 키보드 포커스 표시, 움직임 줄이기 설정 존중, 버튼 높이 44px 이상, 빈 화면은 다음 행동을 알려주는 문장("책장에서 한 권 골라 읽기를 시작해 보세요")으로.

**② 화면 재점검 (10단계)** — 7~9단계에서 늘어난 화면을 스킬 기준으로 다시 점검해 고쳤지만, 사용자가 이전 모양이 더 낫다고 해서 되돌렸다. 스킬의 판단보다 실제로 쓰는 사람의 느낌이 우선이라는 것을 확인한 일이다.

**③ 디자인 새로 만들기 (17단계)** — 사용자가 고른 참고 이미지 두 장(굵은 제목과 기울어진 책등, 사이드바와 흰 카드 격자)을 브리프로 삼아 다시 계획했다. 스킬의 "브리프의 말이 언제나 이긴다"는 원칙에 따라 참고 이미지의 방향은 그대로 따르고, 이 앱만의 것으로 **처음 화면의 책등 세 권을 실제 버튼으로** 만드는 데 과감함을 썼다. "펜 색 = 사람" 원칙은 글과 밑줄에 그대로 두고, 책등·표지 색은 책을 뜻하게 나눴다. 이후 21단계에서 손글씨 글꼴을 없애 사람 구분을 펜 색 하나로 줄였다(위 ①의 2·4번은 처음 디자인의 기록이다).

### 함께 쓴 스킬: image-to-code

화면 이미지를 코드로 옮기고, 결과 화면과 참고 이미지를 비교해 차이를 찾아 고치게 하는 스킬이다. 출처는 [magebase/image-to-code-skill](https://github.com/magebase/image-to-code-skill)이고, 원문은 [`docs/skills/image-to-code/SKILL.md`](docs/skills/image-to-code/SKILL.md), 라이선스(MIT)는 같은 폴더의 `LICENSE.txt`다.

<details>
<summary>SKILL.md 전문 펼치기</summary>

````markdown
---
name: image-to-code
description: Autonomous, pixel-accurate UI reverse-engineering and code generation engine for Antigravity CLI and multi-agent fleet. Transpiles visual reference images, Figma designs, wireframes, and screenshots into production-grade HTML/Tailwind, React, Vue, Svelte, or Django templates, powered by an automated multi-phase LLM visual similarity & discrepancy analysis loop using read_image/multimodal inspection to achieve >=95% visual fidelity before release. Use whenever the user provides an image, mockup, screenshot, or UI spec and asks to implement, reverse-engineer, clone, or visually refine it into code.
---

# Image to Code Engine (`image-to-code`)

Convert any visual reference (Figma export, UI mockup, screenshot, photo of wireframe, or dashboard capture) into clean, production-grade, responsive code (HTML5 + Tailwind CSS, React, Vue, Svelte, or Django templates) with **automated closed-loop visual verification**.

This skill pairs visual decomposition with headless browser rendering and **LLM multimodal similarity/discrepancy analysis** using `read_image` / multimodal inspection to measure visual fidelity, identify pixel/spatial drift, and iterate autonomously until the implementation matches the reference with $\ge 95\%$ visual accuracy.

---

## When to Use

- Converting UI screenshots, Figma exports, or design mockups into production code (HTML/Tailwind, React, Vue, Svelte, Django/HTMX).
- Auditing visual fidelity between a reference design and an existing implementation.
- Reverse-engineering complex layouts, dashboards, marketing landing pages, or mobile app screens from screenshots.
- Running automated visual regression testing and receiving an actionable discrepancy matrix with exact CSS/Tailwind patches.
- Generating pixel-accurate components that adhere to the host repository's design system and accessibility requirements.

---

## The 5-Phase Closed-Loop Architecture

```
[ Reference Image ]
        │
        ▼ (Phase 1: Visual Token Decomposition)
┌───────────────────────────────────────────────┐
│ • Layout hierarchy, grid margins, container   │
│ • Color tokens (canvas, surface, borders)     │
│ • Typography scale, weights, line-heights     │
│ • Pure vector SVG / icon recognition          │
└───────────────────────────────────────────────┘
        │
        ▼ (Phase 2: Code Synthesis)
┌───────────────────────────────────────────────┐
│ Generate semantic, accessible implementation  │
│ (HTML + Tailwind, React, Vue, Django, etc.)   │
└───────────────────────────────────────────────┘
        │
        ▼ (Phase 3: Headless Capture)
┌───────────────────────────────────────────────┐
│ `render_screenshot.py` renders candidate at   │
│ identical viewport (Desktop 1440px / Mobile)  │
└───────────────────────────────────────────────┘
        │
        ▼ (Phase 4: LLM Multimodal Similarity & Discrepancy Analysis)
┌───────────────────────────────────────────────┐
│ `read_image` reference vs candidate render    │
│ Compute Composite Visual Similarity Index     │
│ Generate Discrepancy Matrix (Critical/Major)  │
└───────────────────────────────────────────────┘
        │
        ├────────────[ S_sim < 95% ]────────────┐
        │                                       │ (Phase 5: Auto-Remediation)
        │                                       ▼
        │                       ┌───────────────────────────────┐
        │                       │ Apply CSS/Tailwind deltas     │
        │                       │ Re-render and re-compare      │
        │                       └───────────────────────────────┘
        ▼ [ S_sim >= 95% ]
[ Certified Production Code + Verification Scorecard ]
```

---

## Phase 1: Reference Ingestion & Visual Token Decomposition

Before writing any code, inspect the reference image using visual inspection (`read_image` or multimodal file reading) and extract the **Visual Design Contract**:

1. **Viewport & Spatial Bounds:**
   - Detect canvas dimensions and aspect ratio (e.g., Desktop `1440x900`, Tablet `768x1024`, Mobile `375x812`).
   - Identify outer container constraints (e.g., `max-w-7xl mx-auto px-6` or fixed-width grid).
2. **Color Palette & Surface Elevation:**
   - Background canvas hex codes (e.g., `#0F172A`, `#FAF9F6`).
   - Card surfaces, modals, and panel fills.
   - Text hierarchy colors: Primary, Muted, Subdued, Inverted.
   - Border colors, divider strokes, and elevation shadows (`shadow-sm`, `shadow-xl`, ring offsets).
3. **Typography Scale & Weight:**
   - Primary font classification (Geometric Sans, Humanist Sans, Serif, Monospace).
   - Heading scale ($H_1$ to $H_4$), body size, letter-spacing (`tracking-tight`), and line-height.
4. **Layout & Box Model:**
   - Flex vs. Grid layout structures.
   - Explicit padding, margins, and gaps between elements.
5. **Component & Icon Inventory:**
   - Buttons (primary, secondary, outline, ghost) and interactive states.
   - Icons: Identify vector icons (Lucide, Heroicons, Feather) and transcribe directly into stroke-based SVGs. **Strictly avoid Unicode emojis in production UI.**

---

## Phase 2: Production Code Synthesis

Generate clean, semantic, and accessible code following these standards:

- **Semantic HTML5:** Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, and `<footer>`.
- **Accessibility (WAI-ARIA):** All interactive elements must have accessible labels (`aria-label`, `role="combobox"`, keyboard focus indicators).
- **Tailwind CSS Best Practices:**
  - Prefer modern flex/grid utilities (`flex flex-col gap-4`, `grid grid-cols-1 md:grid-cols-3 gap-6`).
  - Use exact arbitrary values only when standard tokens do not match the reference (e.g., `max-w-[1440px]`, `bg-[#07090E]`).
- **Responsive Fluidity:** Mobile-first approach scaling to tablet (`md:`) and desktop (`lg:`, `xl:`).

---

## Phase 3: Headless Visual Capture

Render the candidate code locally using headless Chromium / Playwright at the exact viewport dimensions of the reference image:

```bash
# Render candidate HTML or web component to candidate screenshot
python3 scripts/render_screenshot.py \
  --input path/to/component.html \
  --output artifacts/renders/candidate_desktop.png \
  --viewport 1440x900
```

For full-stack or framework components (React, Vue, Next.js, Django), launch the local dev server and capture the target route:

```bash
python3 scripts/render_screenshot.py \
  --url http://localhost:8000/my-page/ \
  --output artifacts/renders/candidate_desktop.png \
  --viewport 1440x900 \
  --wait-until networkidle
```

---

## Phase 4: LLM Multimodal Similarity & Discrepancy Analysis

Perform a rigorous visual comparison between the **Reference Image** and the **Candidate Render** using `read_image` and the analysis script:

### 1. Dual Inspection
Inspect both images side-by-side using `read_image(reference_path)` and `read_image(candidate_path)`.

### 2. Algorithmic Baseline Metrics
Run `scripts/visual_compare.py` to calculate structural metrics and generate a pixel diff overlay:

```bash
python3 scripts/visual_compare.py \
  --reference path/to/reference.png \
  --candidate artifacts/renders/candidate.png \
  --output-diff artifacts/renders/visual_diff.png
```

### 3. LLM Qualitative Evaluation Rubric
Compute the **Composite Visual Similarity Index ($S_{sim}$)** out of 100 points:

$S_{sim} = 0.40 \times S_{\text{layout}} + 0.25 \times S_{\text{typography}} + 0.20 \times S_{\text{color}} + 0.15 \times S_{\text{components}}$

| Dimension | Weight | Focus Areas |
| :--- | :---: | :--- |
| **Layout & Grid ($S_{\text{layout}}$)** | 40% | Margins, padding, element alignments, flex wrapping, container bounds, vertical rhythm. |
| **Typography ($S_{\text{typography}}$)** | 25% | Font family pairing, font weights, size ratios, line heights, letter tracking. |
| **Color & Surface ($S_{\text{color}}$)** | 20% | Canvas background, card fills, border contrast, gradients, elevation drop shadows. |
| **Component Details ($S_{\text{components}}$)** | 15% | Border radius curvature, icon scale and stroke width, button padding, badge styling. |

### 4. Discrepancy Matrix Schema
Document every detected visual defect in a structured discrepancy matrix:

```markdown
| Severity | Component / Area | Reference Expected | Candidate Actual | Recommended Remediation Patch |
|:---|:---|:---|:---|:---|
| **Critical** | Hero CTA Button | Emerald green (`#10B981`) with 12px pill radius | Cyan (`#06B6D4`) with square corners | Change `bg-cyan-500 rounded` to `bg-emerald-500 rounded-full px-6 py-3` |
| **Major** | Card Grid Gaps | 32px (`gap-8`) between cards | 16px (`gap-4`) with crowded text | Update container class to `grid gap-8` |
| **Minor** | Subtitle Tracking | Tight tracking (`tracking-tight`) | Normal spacing | Add `tracking-tight text-slate-400` |
```

---

## Phase 5: Autonomous Self-Correction Loop

If $S_{sim} < 95\%$:

1. Apply the top-ranked remediation patches directly to the codebase.
2. Re-render the screenshot using `scripts/render_screenshot.py`.
3. Re-evaluate visual similarity with `scripts/visual_compare.py` and `read_image`.
4. Continue looping until $S_{sim} \ge 95\%$ or all Critical/Major discrepancies are resolved.
5. Record the final visual regression report in `artifacts/visual_verification_report.md`.

---

## Auxiliary Resources & Scripts

- **`scripts/render_screenshot.py`**: Headless Playwright capture engine for HTML files and URLs.
- **`scripts/visual_compare.py`**: Automated perceptual diff generator and SSIM calculator.
- **`references/visual-discrepancy-rubric.md`**: Authoritative 100-point visual inspection grading criteria.
- **`references/tailwind-design-tokens-cheat-sheet.md`**: Instant pixel-to-Tailwind spacing and typography conversion table.
- **`references/llm-vision-prompts.md`**: Specialized prompt templates for multimodal vision models.
- **`templates/similarity_report_template.md`**: Standardized Markdown template for visual acceptance sign-off.
````

</details>

**고른 이유.** 기능을 다 만들고 다시 보니 기존 디자인이 너무 밋밋해서 마음에 들지 않았다. 말로만 "더 예쁘게"를 요청해서는 나아지지 않을 것 같아, 책을 주제로 한 디자인 레퍼런스를 직접 찾았다. 그리고 레퍼런스를 앱에 제대로 참고하려면 화면을 함께 보며 다듬을 방법이 필요해서 이 스킬을 골랐다.

**작업에서 쓰인 방식.** 새 디자인의 방향은 frontend-design으로 잡고, image-to-code는 레퍼런스를 참고해 처음 화면을 다듬는 데 썼다.

1. **화면 찍기** — 만든 처음 화면을 Edge 헤드리스 모드로 찍었다. 스킬의 `render_screenshot.py`는 Playwright가 필요해서 이렇게 대신했다.
2. **나란히 보기** — 스킬의 `visual_compare.py`와 눈으로 레퍼런스와 화면을 비교해, 더 다듬을 곳을 골랐다.
3. **다듬기** — 책등이 겹쳐 검은 그림자가 가려지던 것(기울기를 줄이고 위치 조정)과 화살표 버튼이 흐리던 것을 고쳤다.
4. **앱에 맞게 남기기** — 한글 제목과 파란 펜 밑줄, 왼쪽 사이드바, 눌러서 이동하는 책등처럼 이 앱만의 부분은 그대로 두었다. 기록은 [`docs/visual-verification-home.md`](docs/visual-verification-home.md)에 있다.

## 5. 느낀점, 결론

### 느낀점

**계획을 문서로 먼저 세운 게 가장 큰 도움이 됐다.** PRD와 Todo를 먼저 쓰고 시작하니, 바이브코딩 중에 "이것도 넣을까?" 하는 순간마다 기준이 있었다. 하지 않기로 한 것(로그인, 안전장치, 알림 등)을 명시해 둔 덕분에 범위가 늘어나지 않았고, 할 일 번호를 커밋 메시지에 붙이니 작업 기록이 그대로 과제 제출물이 됐다.

**"매 단계 배포"는 정말 맞는 규칙이었다.** 첫날 새벽에 빈 화면이라도 먼저 배포해 두니, 이후 단계에서 무엇을 고쳐도 웹에서 바로 확인할 수 있었다. 혼자 모드를 먼저 완성하고 함께 모드를 그 위에 얹은 순서 덕분에 어느 단계에서 멈췄어도 쓸 수 있는 앱이 남아 있었을 것이다.

**AI가 만든 코드도 직접 눌러 봐야 안다.** 가짜 데이터로 미리 확인한 화면도 실제 배포에서는 다른 문제가 나왔다. 환경변수를 넣고 다시 배포하지 않아 "연결 정보가 없다"는 오류가 났고, 새 일기장 선택창이 화면을 넘어가도 남아서 일기 칸이 눌리지 않았고, 미리보기 주소에서는 시크릿 창이 로그인을 요구했다. 넓은 PC 화면에서만 생기는 페이지 넘김 버그도 휴대폰 크기로만 테스트해서 놓쳤다. 모두 직접 써 보지 않았으면 몰랐을 문제였고, 그때마다 화면과 오류 문구를 그대로 전달하는 것이 가장 빨리 고치는 방법이었다.

**PRD대로 안 되는 순간이 배움이었다.** "혼자 일기장은 함수 없이 바로 만든다"는 계획은 권한(RLS) 규칙 때문에 그대로는 불가능했다. 만든 직후의 나는 아직 그 일기장의 멤버가 아니라서, 방금 만든 일기장을 읽을 수도 들어갈 수도 없었다. 데이터를 지키는 규칙을 DB에 두면 화면 코드가 단순해지는 대신, "누가 언제 무엇을 할 수 있는가"를 처음부터 정확히 설계해야 한다는 걸 알게 됐다.

**완성 뒤에 써 보는 시간이 앱을 가장 많이 바꿨다.** 마감 버전(6단계)이 끝난 뒤 실제로 써 보며 17개 단계를 더했다. 문단 메모가 밑줄에 한마디로 바뀌고, 페이지 넘기기를 세 번 다시 만들고, 글자 크기를 줄였다가 되돌렸다. 처음 계획이 틀렸다기보다, 써 보기 전에는 알 수 없는 것이 많았다. 그래서 Todo를 고칠 때마다 "전 → 후 → 이유"를 변경 내역에 남긴 것이 중요했다. 무엇을 왜 바꿨는지가 남아 있으니 되돌릴 때도, README를 쓸 때도 헤매지 않았다.

**디자인에도 원칙 하나가 필요했다.** frontend-design 스킬로 "펜 색이 곧 사람이다"라는 원칙을 정하자, 이후의 작은 결정들이 쉬워졌다. "내 차례" 표시를 주황색으로 만들었다가 주황 펜 사람처럼 보여서 잉크색으로 바꾼 것처럼, 원칙이 있으니 무엇이 어색한지도 분명해졌다. 디자인을 통째로 바꾼 17단계와 손글씨 글꼴을 없앤 21단계에서도 이 원칙만은 남았다. 다만 스킬의 판단이 늘 정답은 아니어서, 10단계에서 스킬로 고친 화면을 사용자 의견으로 되돌리기도 했다. "더 예쁘게"라는 말보다 직접 찾은 레퍼런스 한 장이, 그리고 그것을 화면과 나란히 비교하는 일(image-to-code)이 훨씬 빨리 원하는 모습에 닿게 했다.

### 결론

11/1 새벽부터 11/2까지, 처음 6단계 61개였던 Todo를 24단계 151개로 키우며 진행했다. 마감 버전(1~6단계, 73개)에서 PRD 2장의 완료 기준 9개를 모두 배포 주소에서 브라우저 창 여러 개로 확인했고, 그 뒤 7~24단계는 써 보며 나온 불편과 요청을 반영했다. 커밋은 할 일 번호와 내용을 붙여 110개 넘게 나눠 push했다.

지금의 "낯선 밑줄"은 친구 없이도 시작할 수 있는 교환독서·교환일기를 브라우저 하나로 해 볼 수 있는 형태다. 다만 모르는 사람에게 실제로 주소를 공개하려면 연락처 자동 가림, 신고·차단, 위기 표현 안내, 연령 확인 같은 안전장치를 먼저 넣어야 한다. 그다음에는 순서대로 넘기는 릴레이와 기한, 열쇠 대신 로그인으로 기기를 바꿔도 내 책을 이어 읽는 기능, 짝이 차례가 됐을 때 알려 주는 알림을 더하고 싶다.
