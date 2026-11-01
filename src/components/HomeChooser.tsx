"use client";

import Link from "next/link";
import { useHomeSummary } from "./HomeSummary";

// 8-1 처음 화면: 교환독서를 할지, 교환일기를 할지 고른다
export function HomeChooser() {
  const s = useHomeSummary();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Choice
        href="/read"
        title="교환독서"
        line="한 권의 책을 낯선 사람이나 친구와 돌려 읽어요. 문단마다 메모를 남기고, 펜 색으로 서로를 알아봐요."
        status={s ? (s.rooms > 0 ? `읽고 있는 책 ${s.rooms}권` : "아직 읽는 책이 없어요") : null}
        mark={
          <svg aria-hidden="true" viewBox="0 0 64 40" className="h-10 w-16 text-pen-blue">
            <path d="M4 8c10-4 20-4 28 2 8-6 18-6 28-2v26c-10-4-20-4-28 2-8-6-18-6-28-2z" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M32 10v26" stroke="var(--color-ink)" strokeWidth="1.2" />
            <path d="M9 24c5-1.5 11-1.5 17 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </svg>
        }
      />
      <Choice
        href="/diary"
        title="교환일기"
        line="혼자 쓰거나, 짝과 한 편씩 번갈아 써요. 날마다 바뀌는 질문이 첫 줄을 도와줘요."
        status={
          s
            ? s.diaries > 0
              ? `일기장 ${s.diaries}권${s.myTurn > 0 ? ` · 내 차례 ${s.myTurn}` : ""}`
              : "아직 일기장이 없어요"
            : null
        }
        highlight={!!s && s.myTurn > 0}
        mark={
          <svg aria-hidden="true" viewBox="0 0 64 40" className="h-10 w-16 text-pen-orange">
            <rect x="14" y="3" width="36" height="34" rx="2" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" />
            <path d="M14 3v34" stroke="var(--color-margin)" strokeWidth="2" />
            <path d="M21 15h22M21 22h22M21 29h14" stroke="var(--color-rule)" strokeWidth="1.4" />
            <path d="M22 22c5 2 11-2 18 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </svg>
        }
      />
    </div>
  );
}

function Choice({
  href,
  title,
  line,
  status,
  mark,
  highlight,
}: {
  href: string;
  title: string;
  line: string;
  status: string | null;
  mark: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-rule bg-page px-5 py-6 hover:border-ink active:translate-y-px"
    >
      {mark}
      <span className="mt-4 font-serif text-[26px] font-bold leading-tight text-ink">{title}</span>
      <span className="mt-2 text-[15px] leading-relaxed text-pencil">{line}</span>
      <span className="mt-5 flex items-center justify-between gap-3">
        <span className={`text-[14px] ${highlight ? "rounded-full bg-ink px-3 py-1 text-page" : "text-pencil"}`}>
          {status ?? " "}
        </span>
        <span className="text-[15px] text-ink underline decoration-rule underline-offset-4 group-hover:decoration-ink">
          {title} 하러 가기
        </span>
      </span>
    </Link>
  );
}
