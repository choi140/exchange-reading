"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 5-9 없는 방·남의 방 주소로 들어오면 안내한 뒤 홈으로 (추가-2)
const SECONDS = 5;

export function NotAllowed({ title, desc }: { title: string; desc: string }) {
  const router = useRouter();
  const [left, setLeft] = useState(SECONDS);

  useEffect(() => {
    const timer = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (left <= 0) router.replace("/");
  }, [left, router]);

  return (
    <div className="px-5 pt-12 sm:px-8">
      <h1 className="font-display text-[24px] text-ink">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-pencil">{desc}</p>
      <p aria-live="polite" className="mt-3 text-[14px] text-pencil">
        {Math.max(left, 0)}초 뒤 홈으로 이동해요.
      </p>
      <Link href="/" replace className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[15px] text-page">
        지금 홈으로 가기
      </Link>
    </div>
  );
}
