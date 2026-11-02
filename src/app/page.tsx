import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CodeJoinForm } from "@/components/CodeJoinForm";
import { HomeChooser } from "@/components/HomeChooser";

// 8-1/17-2 처음 화면: 큰 제목과 책등 세 권
export default function Home() {
  return (
    <AppShell>
      <main className="grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] [container-type:inline-size] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-center px-5 pb-8 pt-8 sm:px-10 lg:py-14">
          <h1 className="font-display text-[clamp(76px,12cqw,150px)] leading-[1.02] text-ink">
            낯선
            <br />
            <span className="relative inline-block">
              밑줄
              <svg
                aria-hidden="true"
                viewBox="0 0 200 18"
                preserveAspectRatio="none"
                className="absolute -bottom-[0.06em] left-[-3%] h-[0.16em] w-[106%] text-pen-blue"
              >
                <path d="M3 11 C 40 5, 70 14, 104 8 S 168 4, 197 9" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-10 max-w-[28em] text-[15px] font-medium leading-relaxed text-ink">
            모르는 사람이나 친구와 책 한 권, 일기장 한 권을 천천히 주고받는 곳. 로그인 없이 바로 시작해요.
          </p>
          <div className="mt-7 flex max-w-[520px] flex-wrap items-center gap-x-6 gap-y-3">
            <div className="min-w-[260px] flex-1">
              <CodeJoinForm pill />
            </div>
            <Link href="/read" className="text-[14px] font-bold text-accent underline underline-offset-4">
              책 고르러 가기
            </Link>
          </div>
        </div>
        <HomeChooser />
      </main>
    </AppShell>
  );
}
