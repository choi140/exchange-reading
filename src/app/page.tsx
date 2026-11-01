import { AppShell } from "@/components/AppShell";
import { HomeChooser } from "@/components/HomeChooser";
import { Logo } from "@/components/Logo";

// 8-1 처음 화면: 교환독서와 교환일기 중 고르기
export default function Home() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-10 sm:px-8 md:pt-16">
        <header>
          <h1>
            <Logo />
          </h1>
          <p className="mt-8 max-w-[30em] text-[16px] leading-relaxed text-pencil">
            모르는 사람이나 친구와 책 한 권, 일기장 한 권을 천천히 주고받는 곳. 로그인 없이 바로 시작해요.
          </p>
        </header>
        <section aria-label="무엇을 할까요" className="mt-10">
          <h2 className="font-serif text-[22px] text-ink">오늘은 무엇을 할까요?</h2>
          <div className="mt-4">
            <HomeChooser />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
