# 낯선 밑줄

모르는 사람과 전자책 한 권, 일기장 한 권을 천천히 주고받는 익명 교환독서·교환일기 웹앱.

> **바로 써 보기: https://exchange-reading.vercel.app**
>
> 설치나 로그인 없이 브라우저(휴대폰·PC)에서 주소를 열면 바로 홈이 나옵니다.

## 1. 제작한 것 소개

**낯선 밑줄**은 친구끼리 하던 교환독서를 낯선 사람과의 경험으로 바꾼 익명 슬로우 소셜 웹앱입니다. 로그인 없이 접속하자마자 시작할 수 있고, 책과 일기 모두 **혼자** 또는 **함께**를 고를 수 있습니다.

- **책 읽기** — 저작권이 끝난 한국 단편(운수 좋은 날, 봄·봄, 메밀꽃 필 무렵)을 문단 단위로 읽고, 문단마다 메모를 남깁니다.
  - 혼자 읽기: 나만 보는 메모(검정 펜).
  - 함께 읽기: 낯선 사람 최대 3명과 같은 책 방. 각자 펜 색(파랑·초록·주황)으로 구분되고, 내가 먼저 쓰기 전에는 다른 사람의 메모가 가려지는 블라인드, 메모 아래 답글.
- **일기 쓰기** — 오늘의 질문을 보며 1,000자 이내로 씁니다.
  - 혼자 쓰기: 나만 보는 일기장.
  - 교환일기: 낯선 짝과 번갈아 쓰는 일기장. 홈에 "내 차례" 표시.

**기술 스택:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (익명 로그인, Postgres, RLS) · Vercel

_(5-13에서 기능 설명, 화면 스크린샷, 배포 주소를 완성합니다.)_

### 로컬에서 실행하기

1. **Supabase 프로젝트 준비**
   - [supabase.com](https://supabase.com)에서 새 프로젝트를 만든다.
   - Authentication → Sign In / Providers에서 **Allow anonymous sign-ins**를 켠다.
   - SQL Editor에서 아래 파일을 **순서대로** 실행한다.
     1. `supabase/01_tables.sql` — 테이블 8개
     2. `supabase/02_rls.sql` — 권한(RLS) 정책
     3. `supabase/03_books.sql` — 책 3편
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
   브라우저에서 http://localhost:3000 을 연다. 일반 창·시크릿 창·다른 브라우저는 각각 다른 익명 사용자가 된다.

책 본문을 바꾸려면 `src/data/books.json`을 고친 뒤 `node scripts/gen-books-sql.mjs`로 `supabase/03_books.sql`을 다시 만들어 실행한다.

## 2. PRD와 Todo 리스트

- [PRD 전문](docs/PRD.md)
- [Todo 리스트 전문](docs/TODO.md) — 진행 상황은 체크박스로 표시합니다.
- 원본 문서: [Claude Doc](https://claude.ai/artifact/CzzFGXDqp23qeduMBbtov1)

**PRD 요약**
- 목표: 마감(11/2) 전에 배포된 주소에 들어가자마자 혼자 또는 낯선 사람과 책을 읽고 일기를 쓸 수 있게 한다.
- 화면 3개: 홈 `/`, 책 리더 `/room/[id]`, 일기장 `/diary/[id]`. 혼자 모드는 함께 모드 화면에서 상대만 없앤 것.
- 테이블 8개: books, rooms, room_members, notes, unlocks, diaries, diary_members, diary_entries.

**Todo 단계**
1. 화면 뼈대와 첫 배포
2. Supabase 연결과 익명 계정
3. 혼자 읽기와 혼자 일기
4. 함께 읽기
5. 교환일기와 마무리
6. 완료 기준 점검

## 3. Todo 리스트의 변경 내역

처음 계획(v1)과 비교한 변경은 [Todo 변경 내역](docs/TODO.md#todo-변경-내역)에 기록합니다.

| 버전 | 바뀐 것 |
|---|---|
| v1 | 처음 작성: 6단계, 할 일 61개 |
| v2 | 과제 요건 반영: GitHub 저장소를 1단계 맨 앞으로, README·스킬·완료 기준 점검 할 일 추가 (61 → 70개) |
| v3 | 스킬을 frontend-design으로 확정, 추가 제안 2·3 승인 (70 → 73개) |

_(5-14에서 구현·테스트 중 바뀐 점을 정리합니다.)_

## 4. 스킬

_(5-15에서 작성: frontend-design 스킬의 SKILL.md 내용, 화면 작업에서 쓰인 방식, 고른 이유)_

## 5. 느낀점, 결론

_(5-16에서 작성)_
