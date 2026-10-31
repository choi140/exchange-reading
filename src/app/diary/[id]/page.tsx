import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiary, sampleDiaries } from "@/data/diaries";
import { DiaryWriter } from "@/components/DiaryWriter";

// 1-12 일기장 화면: 지난 일기 목록 + 쓰기 창 (PRD #4.2)
export function generateStaticParams() {
  return sampleDiaries.map((d) => ({ id: d.id }));
}

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Seoul",
});

export default async function DiaryPage(props: PageProps<"/diary/[id]">) {
  const { id } = await props.params;
  const diary = getDiary(id);
  if (!diary) notFound();

  return (
    <main className="mx-auto w-full max-w-[640px] pb-24">
      <nav className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <Link href="/" className="py-2 text-[15px] text-pencil">
          홈으로
        </Link>
        <span className="text-[14px] text-pencil">
          {diary.mode === "solo" ? "나만 보는 일기장" : "교환일기"}
        </span>
      </nav>

      <header className="px-5 pt-10 sm:px-8">
        <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">
          {diary.title}
        </h1>
      </header>

      <section aria-label="오늘 일기 쓰기" className="mt-8 px-5 sm:px-8">
        <DiaryWriter />
      </section>

      <section aria-labelledby="past" className="mt-14 px-5 sm:px-8">
        <h2 id="past" className="font-serif text-[22px] text-ink">
          지난 일기
        </h2>
        {diary.entries.length === 0 ? (
          <p className="mt-3 border-y border-rule py-6 text-[15px] text-pencil">
            아직 쓴 일기가 없어요. 위 칸에 오늘의 첫 일기를 적어 보세요.
          </p>
        ) : (
          <ol className="mt-3 border-t border-rule">
            {diary.entries.map((e) => (
              <li key={e.id} className="border-b border-rule py-6">
                <p className="text-[14px] text-pencil">
                  {dateFormat.format(new Date(e.createdAt))}
                </p>
                <p className="mt-2 font-hand text-[22px] leading-snug text-pencil">
                  {e.prompt}
                </p>
                <p className="mt-3 whitespace-pre-wrap font-serif text-[17px] leading-[1.9] text-ink">
                  {e.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
