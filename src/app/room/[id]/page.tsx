import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBook } from "@/data/books";
import { PenChip } from "@/components/PenChip";

// 1-10 리더 화면: 본문을 문단 단위로 표시 (PRD #4.1)
// 지금은 방 id 자리에 책 id를 쓴다. 3단계부터 rooms 테이블의 방 id로 바뀐다.
export default function RoomPage(props: PageProps<"/room/[id]">) {
  return (
    <main className="mx-auto w-full max-w-[640px] pb-24">
      <nav className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <Link href="/" className="py-2 text-[15px] text-pencil">
          홈으로
        </Link>
        <PenChip color="black" />
      </nav>
      <Suspense fallback={<ReaderLoading />}>
        <Reader params={props.params} />
      </Suspense>
    </main>
  );
}

async function Reader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getBook(id);

  if (res.error !== null) {
    return (
      <p role="alert" className="px-5 pt-10 text-[15px] leading-relaxed text-pen-orange sm:px-8">
        책을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요. ({res.error})
      </p>
    );
  }
  const book = res.data;
  if (!book) notFound();

  return (
    <>
      <header className="px-5 pt-10 sm:px-8">
        <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">
          {book.title}
        </h1>
        <p className="mt-2 text-[15px] text-pencil">
          {book.author}
          {book.year ? `, ${book.year}년` : ""}
        </p>
      </header>

      {/* 1-11 읽기 편한 글꼴·줄간격: 고운바탕 18px / 1.95, 붉은 여백선 오른쪽에 본문 */}
      <article className="mt-8 bg-page py-6">
        <ol className="ml-5 border-l-2 border-margin sm:ml-8">
          {book.paragraphs.map((p, i) => (
            <li key={i} className="grid grid-cols-[1fr_2.5rem] gap-1 pl-4 sm:pl-6">
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
    </>
  );
}

function ReaderLoading() {
  return (
    <div aria-label="책을 불러오는 중" className="px-5 pt-10 sm:px-8">
      <div className="h-8 w-48 rounded-sm bg-rule/60" />
      <div className="mt-3 h-4 w-28 rounded-sm bg-rule/40" />
      <div className="mt-10 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 rounded-sm bg-rule/30" />
        ))}
      </div>
    </div>
  );
}
