"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";

// 3-10 홈 "내 일기장" + 5-6 교환일기 "내 차례" 표시 (PRD #4.3)
type MyDiary = {
  id: string;
  mode: "solo" | "exchange";
  status: "waiting" | "active" | "closed";
  title?: string | null;
  created_at: string;
  entry_count: number;
  my_turn: boolean;
  last_entry_at?: string | null;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; diaries: MyDiary[]; now: number };

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

export function diaryTitle(mode: "solo" | "exchange") {
  return mode === "solo" ? "혼자 쓰는 일기" : "교환일기";
}

export function MyDiaries() {
  const session = useAnonymousSession();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (session.status !== "ready") return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    supabase.rpc("my_diaries").then(({ data, error }) => {
      if (cancelled) return;
      if (error) setState({ status: "error", message: error.message });
      else setState({ status: "ready", diaries: (data ?? []) as MyDiary[], now: Date.now() });
    });
    return () => {
      cancelled = true;
    };
  }, [session.status, session.userId]);

  if (session.status === "error") return null;
  if (state.status === "loading") {
    return <div aria-label="내 일기장을 불러오는 중" className="mt-3 h-16 border-y border-rule bg-rule/20" />;
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="mt-3 border-y border-rule py-6 text-[14px] text-pen-orange">
        내 일기장을 불러오지 못했어요. 새로고침해 주세요. ({state.message})
      </p>
    );
  }
  if (state.diaries.length === 0) {
    return (
      <p className="mt-3 border-y border-rule py-6 text-[14px] leading-relaxed text-pencil">
        아직 일기장이 없어요. 아래 “새 일기장 시작하기”에서 골라 보세요.
      </p>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-rule rounded-2xl bg-page px-4 sm:px-5">
      {state.diaries.map((d) => (
        <li key={d.id}>
          <Link href={`/diary/${d.id}`} className="flex items-baseline justify-between gap-4 py-4">
            <span>
              <span className="block font-display text-[16px] text-ink [overflow-wrap:anywhere]">{d.title || diaryTitle(d.mode)}</span>
              {d.title && <span className="block text-[12px] text-pencil">{diaryTitle(d.mode)}</span>}
              <span className="mt-0.5 block text-[13px] text-pencil">
                {dateFormat.format(new Date(d.created_at))}에 시작, {Number(d.entry_count)}편
              </span>
            </span>
            {d.mode === "exchange" &&
              (d.status === "waiting" ? (
                <span className="shrink-0 text-[13px] text-pencil">짝을 기다리는 중</span>
              ) : d.status === "closed" ? (
                <span className="shrink-0 text-[13px] text-pencil">마무리됨</span>
              ) : d.my_turn ? (
                <span className="shrink-0 rounded-full bg-ink px-3 py-1 text-[13px] text-page">내 차례</span>
              ) : d.last_entry_at && state.now - new Date(d.last_entry_at).getTime() > 7 * 86400000 ? (
                <span className="shrink-0 text-[13px] text-pencil">짝이 조용해요</span>
              ) : (
                <span className="shrink-0 text-[13px] text-pencil">짝의 차례</span>
              ))}
          </Link>
        </li>
      ))}
    </ul>
  );
}
