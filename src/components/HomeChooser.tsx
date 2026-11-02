"use client";

import Link from "next/link";
import { Star } from "./BookCover";
import { useHomeSummary } from "./HomeSummary";

// 8-1/17-2 처음 화면: 기대어 선 책등 세 권을 눌러 어디로 갈지 고른다
export function HomeChooser() {
  const s = useHomeSummary();
  return (
    <nav aria-label="어디로 갈까요" className="relative h-[440px] overflow-hidden lg:h-full lg:min-h-[640px]">
      <Spine
        href="/read"
        title="교환독서"
        status={s ? (s.rooms > 0 ? `읽는 책 ${s.rooms}권` : "함께 읽기") : null}
        className="left-[4%] h-[78%] w-[29%] origin-bottom rotate-[13deg] bg-spine-orange text-white hover:-translate-y-3"
      />
      <Spine
        href="/diary"
        title="교환일기"
        status={s ? (s.myTurn > 0 ? `내 차례 ${s.myTurn}` : s.diaries > 0 ? `일기장 ${s.diaries}권` : "번갈아 쓰기") : null}
        className="left-[36%] h-[88%] w-[29%] origin-bottom rotate-[7deg] bg-spine-navy text-white hover:-translate-y-3"
      />
      <Spine
        href="/calendar"
        title="독서 달력"
        status="읽고 쓴 날"
        className="left-[69%] h-[97%] w-[29%] origin-bottom rotate-[2deg] bg-spine-mustard text-[#191919] hover:-translate-y-3"
      />
    </nav>
  );
}

function Spine({ href, title, status, className }: { href: string; title: string; status: string | null; className: string }) {
  return (
    <Link
      href={href}
      className={`grain absolute -bottom-6 flex flex-col items-center justify-between px-2 pb-14 pt-5 shadow-[9px_5px_0_#000] transition-transform duration-200 lg:pt-8 ${className}`}
    >
      <span className="flex flex-col items-center gap-3">
        <Star className="h-11 w-11 lg:h-14 lg:w-14" />
        <span className="min-h-5 text-center text-[13px] font-medium leading-tight lg:text-[15px]">{status}</span>
      </span>
      <span className="spine-text font-display text-[38px] leading-none lg:text-[56px]">{title}</span>
    </Link>
  );
}
