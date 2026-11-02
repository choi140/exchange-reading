"use client";

import Link from "next/link";

// 5-7 예상하지 못한 오류가 나면 화면 전체가 하얗게 비지 않고 안내한다
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const message = error instanceof Error ? error.message : "";
  return (
    <main className="mx-auto w-full max-w-[640px] px-5 pt-16 sm:px-8">
      <h1 className="font-display text-[24px] text-ink">화면을 불러오지 못했어요</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-pencil">
        잠시 뒤 다시 시도해 주세요. 계속되면 홈으로 돌아가 다시 시작해 주세요.
      </p>
      {message && <p className="mt-2 text-[13px] text-pencil">({message})</p>}
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => retry()}
          className="h-11 rounded-full bg-ink px-6 text-[15px] text-page"
        >
          다시 시도하기
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-full border border-ink px-6 text-[15px] text-ink">
          홈으로 가기
        </Link>
      </div>
    </main>
  );
}
