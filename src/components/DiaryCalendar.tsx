"use client";

import { useMemo, useState } from "react";
import { PEN, type PenColor } from "./PenChip";

// 8-5 일기 달력: 일기를 쓴 날에 쓴 사람의 펜 색 동그라미. 교환일기에서 둘 다 쓴 날은 두 색을 반씩.

const PEN_VAR: Record<PenColor, string> = {
  black: "var(--color-pen-black)",
  blue: "var(--color-pen-blue)",
  green: "var(--color-pen-green)",
  orange: "var(--color-pen-orange)",
};

// 한국 시간 기준 날짜 키 (YYYY-MM-DD)
const keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });
export function dayKey(iso: string | Date) {
  return keyFormat.format(typeof iso === "string" ? new Date(iso) : iso);
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export function DiaryCalendar({
  entries,
  penOf,
  onPickDay,
  todayKey,
}: {
  entries: { user_id: string; created_at: string }[];
  penOf: (userId: string) => PenColor;
  onPickDay: (key: string, hasEntries: boolean) => void;
  todayKey: string;
}) {
  const [ty, tm] = todayKey.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm }); // m: 1~12

  // 날짜별 쓴 사람들의 펜 색 (쓴 순서대로, 중복 없이)
  const byDay = useMemo(() => {
    const map = new Map<string, PenColor[]>();
    for (const e of [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
      const k = dayKey(e.created_at);
      const pens = map.get(k) ?? [];
      const pen = penOf(e.user_id);
      if (!pens.includes(pen)) pens.push(pen);
      map.set(k, pens);
    }
    return map;
  }, [entries, penOf]);

  const first = new Date(Date.UTC(view.y, view.m - 1, 1));
  const startWeekday = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const monthPrefix = `${view.y}-${String(view.m).padStart(2, "0")}-`;
  const countThisMonth = [...byDay.keys()].filter((k) => k.startsWith(monthPrefix)).length;

  const move = (delta: number) =>
    setView(({ y, m }) => {
      const d = new Date(Date.UTC(y, m - 1 + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
    });

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-lg border border-rule bg-page px-3 pb-4 pt-3 sm:px-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} aria-label="이전 달" className="h-11 w-11 rounded-full text-[20px] text-ink">
          ‹
        </button>
        <p className="text-center">
          <span className="block font-serif text-[20px] text-ink">
            {view.y}년 {view.m}월
          </span>
          <span className="block text-[13px] text-pencil">
            {countThisMonth > 0 ? `${countThisMonth}일 썼어요` : "이 달엔 아직 쓴 일기가 없어요"}
          </span>
        </p>
        <button type="button" onClick={() => move(1)} aria-label="다음 달" className="h-11 w-11 rounded-full text-[20px] text-ink">
          ›
        </button>
      </div>

      <div role="grid" aria-label={`${view.y}년 ${view.m}월 일기 달력`} className="mt-2 grid grid-cols-7 gap-y-1 text-center">
        {WEEK.map((w, i) => (
          <span
            key={w}
            role="columnheader"
            className={`py-1 text-[13px] ${i === 0 ? "text-pen-orange" : i === 6 ? "text-pen-blue" : "text-pencil"}`}
          >
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const key = `${monthPrefix}${String(d).padStart(2, "0")}`;
          const pens = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          const has = pens.length > 0;
          const bg =
            pens.length === 1
              ? PEN_VAR[pens[0]]
              : pens.length > 1
                ? `conic-gradient(${pens.map((p, k) => `${PEN_VAR[p]} ${(k / pens.length) * 100}% ${((k + 1) / pens.length) * 100}%`).join(", ")})`
                : undefined;
          const label = `${view.m}월 ${d}일${isToday ? ", 오늘" : ""}${
            has ? `, ${pens.map((p) => PEN[p].label).join("·")}이 씀` : ""
          }`;
          return (
            <span key={key} role="gridcell" className="flex justify-center">
              <button
                type="button"
                aria-label={label}
                onClick={() => onPickDay(key, has)}
                disabled={!has && !isToday}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[15px] tabular-nums sm:h-11 sm:w-11 ${
                  has ? "font-bold text-page" : isToday ? "text-ink" : "text-pencil"
                } ${isToday ? "ring-2 ring-ink ring-offset-2 ring-offset-page" : ""}`}
                style={bg ? { background: bg } : undefined}
              >
                {d}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
