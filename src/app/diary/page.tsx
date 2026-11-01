import { AppShell } from "@/components/AppShell";
import { DiaryStarter } from "@/components/DiaryStarter";
import { MyDiaries } from "@/components/MyDiaries";

// 8-3 교환일기 화면: 내 일기장 + 새 일기장 시작하기
export default function DiaryHome() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[640px] px-5 pb-20 pt-10 sm:px-8">
        <header>
          <h1 className="font-serif text-[32px] font-bold leading-tight text-ink">교환일기</h1>
          <p className="mt-3 max-w-[30em] text-[15px] leading-relaxed text-pencil">
            혼자 쓰거나, 낯선 사람이나 친구와 한 편씩 번갈아 써요. 한 편을 쓰면 다음 질문이 열려요.
          </p>
        </header>

        <section aria-labelledby="my-diaries" className="mt-10">
          <h2 id="my-diaries" className="font-serif text-[22px] text-ink">
            내 일기장
          </h2>
          <MyDiaries />
        </section>

        <section aria-labelledby="new-diary" className="mt-12">
          <h2 id="new-diary" className="font-serif text-[22px] text-ink">
            새 일기장 시작하기
          </h2>
          <div className="mt-4">
            <DiaryStarter />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
