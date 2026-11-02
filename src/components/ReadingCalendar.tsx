"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { dayKey } from "./DiaryCalendar";

// 12-2 나의 독서 달력: 언제 얼마나 읽고 썼는지 보여 주기만 한다. 점수·연속 기록은 두지 않는다.

type Day = { reads: { title: string; paragraphs: number }[]; highlights: number; replies: number; letters: number; entries: number };
type Days = Record<string, Day>;

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; days: Days; today: string };

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const emptyDay = (): Day => ({ reads: [], highlights: 0, replies: 0, letters: 0, entries: 0 });

export function ReadingCalendar() {
  const session = useAnonymousSession();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (session.status !== "ready") return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const uid = session.userId;
    let cancelled = false;
    (async () => {
      const [reads, highlights, replies, letters, entries] = await Promise.all([
        supabase.from("reading_days").select("day, paragraphs, book:books(title)").eq("user_id", uid),
        supabase.from("highlights").select("created_at").eq("user_id", uid),
        supabase.from("highlight_replies").select("created_at").eq("user_id", uid),
        supabase.from("letters").select("created_at").eq("user_id", uid),
        supabase.from("diary_entries").select("created_at").eq("user_id", uid),
      ]);
      if (cancelled) return;
      if (entries.error) {
        setState({ status: "error", message: entries.error.message });
        return;
      }
      const days: Days = {};
      const at = (k: string) => (days[k] ??= emptyDay());
      // 옛 SQL만 실행한 DB에서는 없는 표를 건너뛰고 있는 기록만 보여 준다
      type ReadRow = { day: string; paragraphs: number; book: { title: string } | null };
      for (const r of (reads.error ? [] : (reads.data ?? [])) as unknown as ReadRow[]) {
        at(r.day).reads.push({ title: r.book?.title ?? "", paragraphs: r.paragraphs });
      }
      for (const h of highlights.error ? [] : (highlights.data ?? [])) at(dayKey(h.created_at as string)).highlights += 1;
      for (const r of replies.error ? [] : (replies.data ?? [])) at(dayKey(r.created_at as string)).replies += 1;
      for (const l of letters.error ? [] : (letters.data ?? [])) at(dayKey(l.created_at as string)).letters += 1;
      for (const e of entries.data ?? []) at(dayKey(e.created_at as string)).entries += 1;
      setState({ status: "ready", days, today: dayKey(new Date()) });
    })();
    return () => {
      cancelled = true;
    };
  }, [session.status, session.userId]);

  if (session.status === "error") return null;
  if (state.status === "loading") return <div aria-label="달력을 불러오는 중" className="h-80 rounded-lg bg-rule/25" />;
  if (state.status === "error") {
    return (
      <p role="alert" className="border-y border-rule py-6 text-[15px] text-pen-orange">
        달력을 불러오지 못했어요. 새로고침해 주세요. ({state.message})
      </p>
    );
  }
  return <Month days={state.days} today={state.today} />;
}

function Month({ days, today }: { days: Days; today: string }) {
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm }); // m: 1~12
  const [picked, setPicked] = useState<string | null>(days[today] ? today : null);

  const monthPrefix = `${view.y}-${String(view.m).padStart(2, "0")}-`;
  const month = useMemo(() => {
    const keys = Object.keys(days).filter((k) => k.startsWith(monthPrefix));
    const sum = emptyDay();
    let paragraphs = 0;
    for (const k of keys) {
      const d = days[k];
      paragraphs += d.reads.reduce((n, r) => n + r.paragraphs, 0);
      sum.highlights += d.highlights;
      sum.replies += d.replies;
      sum.letters += d.letters;
      sum.entries += d.entries;
    }
    return { count: keys.length, paragraphs, sum };
  }, [days, monthPrefix]);

  const startWeekday = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const move = (delta: number) => {
    setPicked(null);
    setView(({ y, m }) => {
      const d = new Date(Date.UTC(y, m - 1 + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
    });
  };

  const day = picked ? days[picked] : undefined;
  const [, pm, pd] = (picked ?? "").split("-").map(Number);

  return (
    <div>
      <div className="rounded-lg border border-rule bg-page px-3 pb-4 pt-3 sm:px-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => move(-1)} aria-label="이전 달" className="h-11 w-11 rounded-full text-[20px] text-ink">
            ‹
          </button>
          <p className="text-center">
            <span className="block font-serif text-[20px] text-ink">
              {view.y}년 {view.m}월
            </span>
            <span className="block text-[13px] text-pencil">{month.count > 0 ? `${month.count}일 펼쳤어요` : "이 달의 기록은 아직 없어요"}</span>
          </p>
          <button type="button" onClick={() => move(1)} aria-label="다음 달" className="h-11 w-11 rounded-full text-[20px] text-ink">
            ›
          </button>
        </div>

        <div role="grid" aria-label={`${view.y}년 ${view.m}월 독서 달력`} className="mt-2 grid grid-cols-7 gap-y-1 text-center">
          {WEEK.map((w) => (
            <span key={w} role="columnheader" className="py-1 text-[13px] text-pencil">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <span key={`e${i}`} />;
            const key = `${monthPrefix}${String(d).padStart(2, "0")}`;
            const has = Boolean(days[key]);
            const isToday = key === today;
            return (
              <span key={key} role="gridcell" className="flex justify-center">
                <button
                  type="button"
                  aria-label={`${view.m}월 ${d}일${isToday ? ", 오늘" : ""}${has ? ", 기록 있음" : ""}`}
                  aria-pressed={key === picked}
                  onClick={() => setPicked(key)}
                  disabled={!has}
                  className={`flex h-11 w-11 flex-col items-center justify-center rounded-full text-[15px] tabular-nums ${
                    has ? "text-ink" : "text-pencil"
                  } ${key === picked ? "bg-rule/50" : ""} ${isToday ? "ring-1 ring-ink" : ""}`}
                >
                  {d}
                  <span aria-hidden className={`mt-0.5 h-1 w-1 rounded-full ${has ? "bg-ink" : "bg-transparent"}`} />
                </button>
              </span>
            );
          })}
        </div>
      </div>

      {day ? (
        <div className="mt-5 border-y border-rule py-4">
          <p className="font-serif text-[18px] text-ink">
            {pm}월 {pd}일
          </p>
          <ul className="mt-2 space-y-1 text-[15px] leading-relaxed text-ink">
            {day.reads.map((r) => (
              <li key={r.title}>
                「{r.title}」 {r.paragraphs}문단 읽었어요
              </li>
            ))}
          </ul>
          <Counts day={day} />
        </div>
      ) : (
        month.count > 0 && (
          <div className="mt-5 border-y border-rule py-4">
            <p className="text-[15px] text-ink">{month.paragraphs > 0 ? `이 달에 ${month.paragraphs}문단 읽었어요` : "이 달의 기록"}</p>
            <Counts day={month.sum} />
          </div>
        )
      )}
      {Object.keys(days).length === 0 && (
        <p className="mt-5 text-[15px] leading-relaxed text-pencil">아직 기록이 없어요. 책을 읽거나 일기를 쓰면 여기에 조용히 쌓여요.</p>
      )}
    </div>
  );
}

function Counts({ day }: { day: Day }) {
  const parts = [
    day.highlights > 0 && `밑줄 ${day.highlights}개`,
    day.replies > 0 && `답글 ${day.replies}개`,
    day.letters > 0 && `편지 ${day.letters}장`,
    day.entries > 0 && `일기 ${day.entries}편`,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <p className="mt-1 text-[14px] text-pencil">{parts.join(" · ")}</p>;
}
