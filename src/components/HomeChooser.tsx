"use client";

import Link from "next/link";
import { useHomeSummary } from "./HomeSummary";

// 8-1 처음 화면: 교환독서를 할지, 교환일기를 할지 고른다
// (7~9단계 디자인 점검) 둥근 카드 두 장 + 펜 색 아이콘 → 책의 차례처럼 가는 줄로 나눈 두 줄.
// 색은 사람(펜)만 뜻하므로 여기서는 쓰지 않는다.
export function HomeChooser() {
  const s = useHomeSummary();
  return (
    <ul className="border-t border-rule">
      <Entry
        href="/read"
        title="교환독서"
        line="한 권의 책을 낯선 사람이나 친구와 돌려 읽어요. 마음에 드는 문장에 밑줄을 긋고 한마디를 남겨요."
        status={s ? (s.rooms > 0 ? `읽고 있는 책 ${s.rooms}권` : "아직 읽는 책이 없어요") : null}
      />
      <Entry
        href="/diary"
        title="교환일기"
        line="혼자 쓰거나, 짝과 같은 질문에 한 편씩 번갈아 답해요."
        status={s ? (s.diaries > 0 ? `일기장 ${s.diaries}권` : "아직 일기장이 없어요") : null}
        turn={s?.myTurn ?? 0}
      />
    </ul>
  );
}

function Entry({
  href,
  title,
  line,
  status,
  turn = 0,
}: {
  href: string;
  title: string;
  line: string;
  status: string | null;
  turn?: number;
}) {
  return (
    <li className="border-b border-rule">
      <Link href={href} className="group block py-7">
        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="font-serif text-[34px] font-bold leading-tight text-ink decoration-2 underline-offset-8 group-hover:underline">
            {title}
          </span>
          <span className="flex items-center gap-2 text-[14px] text-pencil">
            {status ?? "\u00a0"}
            {turn > 0 && <span className="rounded-full bg-ink px-3 py-1 text-[13px] text-page">내 차례 {turn}</span>}
          </span>
        </span>
        <span className="mt-2 block max-w-[34em] text-[15px] leading-relaxed text-pencil">{line}</span>
      </Link>
    </li>
  );
}
