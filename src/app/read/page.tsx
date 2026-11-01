import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { BookShelf } from "@/components/BookShelf";
import { MyShelf } from "@/components/MyShelf";
import { listBooks } from "@/data/books";

// 8-3 교환독서 화면: 책장 + 내 책 (1-7 홈에서 옮김)
export default function ReadPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[640px] px-5 pb-20 pt-10 sm:px-8">
        <header>
          <h1 className="font-serif text-[32px] font-bold leading-tight text-ink">교환독서</h1>
          <p className="mt-3 max-w-[30em] text-[15px] leading-relaxed text-pencil">
            한 권의 책을 혼자, 낯선 사람과, 또는 코드로 친구와 읽어요. 마음에 드는 문장에 내 펜 색으로 밑줄을 긋고 한마디를 남겨요.
          </p>
        </header>

        <section aria-labelledby="my-books" className="mt-10">
          <h2 id="my-books" className="font-serif text-[22px] text-ink">
            내 책
          </h2>
          <MyShelf />
        </section>

        <section aria-labelledby="shelf" className="mt-12">
          <h2 id="shelf" className="font-serif text-[22px] text-ink">
            책장
          </h2>
          <p className="mt-1 text-[14px] text-pencil">
            혼자 읽거나, 함께 읽기에서 낯선 사람 또는 아는 사람(참여 코드)과 같은 책에 밑줄을 나눠요.
          </p>
          <div className="mt-4">
            <Suspense fallback={<ShelfLoading />}>
              <Shelf />
            </Suspense>
          </div>
        </section>
      </main>
    </AppShell>
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
