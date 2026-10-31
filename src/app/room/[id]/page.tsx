import Link from "next/link";
import { notFound } from "next/navigation";
import { books, getBook } from "@/data/books";
import { PenChip } from "@/components/PenChip";

// 1-10 리더 화면: 본문을 문단 단위로 표시 (PRD #4.1)
// 1단계에서는 방 id 자리에 책 id를 쓴다. 3단계부터 rooms 테이블의 방 id로 바뀐다.
export function generateStaticParams() {
  return books.map((b) => ({ id: b.id }));
}

export default async function RoomPage(props: PageProps<"/room/[id]">) {
  const { id } = await props.params;
  const book = getBook(id);
  if (!book) notFound();

  return (
    <main className="mx-auto w-full max-w-[640px] pb-24">
      <nav className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <Link href="/" className="py-2 text-[15px] text-pencil">
          홈으로
        </Link>
        <PenChip color="black" />
      </nav>

      <header className="px-5 pt-10 sm:px-8">
        <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">
          {book.title}
        </h1>
        <p className="mt-2 text-[15px] text-pencil">
          {book.author}, {book.year}년
        </p>
      </header>

      {/* 1-11 읽기 편한 글꼴·줄간격: 고운바탕 18px / 1.95, 붉은 여백선 오른쪽에 본문 */}
      <article className="mt-8 bg-page py-6">
        <ol className="ml-5 border-l-2 border-margin sm:ml-8">
          {book.paragraphs.map((p, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_2.5rem] gap-1 pl-4 sm:pl-6"
            >
              <p className="py-3 font-serif text-[18px] leading-[1.95] text-ink [text-wrap:pretty]">
                {p}
              </p>
              {/* 메모 개수 자리 (3단계에서 연결) */}
              <span aria-hidden="true" className="pt-4" />
            </li>
          ))}
        </ol>
      </article>

      <p className="px-5 pt-6 text-[13px] leading-relaxed text-pencil sm:px-8">
        {book.source}
      </p>
    </main>
  );
}
