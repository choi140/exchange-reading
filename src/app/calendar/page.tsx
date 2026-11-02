import { AppShell } from "@/components/AppShell";
import { ReadingCalendar } from "@/components/ReadingCalendar";

// 12-2 나의 독서 달력
export default function CalendarPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[960px] px-5 pb-20 pt-10 sm:px-8">
        <header>
          <h1 className="font-display text-[40px] leading-tight text-ink">나의 독서 달력</h1>
          <p className="mt-3 max-w-[32em] text-[15px] leading-relaxed text-pencil">
            언제 얼마나 읽고 썼는지 조용히 쌓이는 기록이에요. 나만 볼 수 있어요.
          </p>
        </header>
        <div className="mt-8">
          <ReadingCalendar />
        </div>
      </main>
    </AppShell>
  );
}
