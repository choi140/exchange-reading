"use client";

import Link from "next/link";
import { Star } from "./BookCover";
import { useHomeSummary } from "./HomeSummary";

// 8-1/17-2 처음 화면: 기대어 선 책등 세 권을 눌러 어디로 갈지 고른다
export function HomeChooser() {
  const s = useHomeSummary();
  return (
    <nav aria-label="어디로 갈까요" className="relative h-[340px] overflow-hidden lg:h-full lg:min-h-[560px]">
      <Spine
        href="/read"
        title="교환독서"
        status={s ? (s.rooms > 0 ? `읽는 책 ${s.rooms}권` : "함께 읽기") : null}
        className="left-[8%] h-[66%] w-[24%] origin-bottom rotate-[8deg] bg-spine-orange text-white hover:-translate-y-3"
      />
      <Spine
        href="/diary"
        title="교환일기"
        status={s ? (s.myTurn > 0 ? `내 차례 ${s.myTurn}` : s.diaries > 0 ? `일기장 ${s.diaries}권` : "번갈아 쓰기") : null}
        className="left-[39%] h-[76%] w-[24%] origin-bottom rotate-[4deg] bg-spine-navy text-white hover:-translate-y-3"
      />
      <Spine
        href="/calendar"
        title="독서 달력"
        status="읽고 쓴 날"
        className="left-[70%] h-[86%] w-[24%] origin-bottom rotate-[1deg] bg-spine-mustard text-[#191919] hover:-translate-y-3"
      />
    </nav>
  );
}

function Spine({ href, title, status, className }: { href: string; title: string; status: string | null; className: string }) {
  return (
    <Link
      href={href}
      className={`grain absolute -bottom-6 flex flex-col items-center justify-between px-1.5 pb-11 pt-4 shadow-[8px_4px_0_#000] transition-transform duration-200 lg:pt-6 ${className}`}
    >
      <span className="flex flex-col items-center gap-3">
        <Star className="h-9 w-9 lg:h-11 lg:w-11" />
        <span className="min-h-5 text-center text-[12px] font-medium leading-tight lg:text-[14px]">{status}</span>
      </span>
      <span className="spine-text font-display text-[28px] leading-none lg:text-[38px]">{title}</span>
    </Link>
  );
}
