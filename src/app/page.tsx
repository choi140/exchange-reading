import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { BookShelf } from "@/components/BookShelf";
import { NewDiaryButton } from "@/components/NewDiaryButton";
import { listBooks } from "@/data/books";
import { sampleDiaries } from "@/data/diaries";

// 1-7 홈: 책 목록, 내 책, 내 일기장 (PRD #4.3)
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-5 pb-20 pt-12 sm:px-8">
      <header>
        <h1>
          <Logo />
        </h1>
        <p className="mt-8 max-w-[30em] text-[16px] leading-relaxed text-pencil">
          모르는 사람과 책 한 권, 일기장 한 권을 천천히 주고받는 곳.
          로그인 없이 바로 시작해요.
        </p>
      </header>

      <section aria-labelledby="shelf" className="mt-14">
        <h2 id="shelf" className="font-serif text-[22px] text-ink">
          책장
        </h2>
        <p className="mt-1 text-[14px] text-pencil">
          혼자 읽거나, 낯선 사람 둘과 같은 책에 메모를 나눠요.
        </p>
        <div className="mt-4">
          <Suspense fallback={<ShelfLoading />}>
            <Shelf />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="my-books" className="mt-10">
        <h2 id="my-books" className="font-serif text-[22px] text-ink">
          내 책
        </h2>
        <p className="mt-3 border-y border-rule py-6 text-[15px] leading-relaxed text-pencil">
          아직 읽고 있는 책이 없어요. 책장에서 한 권 골라 읽기를 시작해 보세요.
        </p>
      </section>

      <section aria-labelledby="my-diaries" className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 id="my-diaries" className="font-serif text-[22px] text-ink">
            내 일기장
          </h2>
          <NewDiaryButton />
        </div>
        <ul className="mt-3 border-t border-rule">
          {sampleDiaries.map((d) => (
            <li key={d.id} className="border-b border-rule">
              <Link
                href={`/diary/${d.id}`}
                className="flex items-baseline justify-between gap-4 py-4"
              >
                <span>
                  <span className="block font-serif text-[18px] text-ink">
                    {d.title}
                  </span>
                  <span className="mt-0.5 block text-[14px] text-pencil">
                    {d.entries.length}편
                  </span>
                </span>
                <span className="shrink-0 text-[13px] text-pencil">
                  예시
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

// 2-9 책 목록을 DB에서 읽는다 (요청마다 새로 읽어서, DB에서 제목을 바꾸면 바로 반영)
async function Shelf() {
  const res = await listBooks();
  if (res.error !== null) {
    return (
      <p role="alert" className="border-y border-rule py-6 text-[15px] leading-relaxed text-pen-orange">
        책장을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요. ({res.error})
      </p>
    );
  }
  const books = res.data;
  if (books.length === 0) {
    return (
      <p className="border-y border-rule py-6 text-[15px] text-pencil">
        책장이 비어 있어요. supabase/03_books.sql을 실행하면 책 3권이 들어와요.
      </p>
    );
  }
  return <BookShelf books={books} />;
}

function ShelfLoading() {
  return (
    <ul aria-label="책장을 불러오는 중" className="border-t border-rule">
      {[0, 1, 2].map((i) => (
        <li key={i} className="border-b border-rule py-5">
          <div className="h-6 w-40 rounded-sm bg-rule/60" />
          <div className="mt-2 h-4 w-24 rounded-sm bg-rule/40" />
          <div className="mt-4 h-11 rounded-full bg-rule/30" />
        </li>
      ))}
    </ul>
  );
}
