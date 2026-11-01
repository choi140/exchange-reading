import Link from "next/link";

// 5-7 없는 주소
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-5 pt-16 sm:px-8">
      <h1 className="font-serif text-[24px] text-ink">없는 페이지예요</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-pencil">
        주소가 바뀌었거나 잘못 입력됐어요. 홈에서 다시 시작해 주세요.
      </p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[15px] text-page">
        홈으로 가기
      </Link>
    </main>
  );
}
