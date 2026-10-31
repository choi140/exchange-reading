"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";

// 3-10 홈 "내 일기장": 내 일기장 목록 (PRD #4.3)
type MyDiary = {
  diary: {
    id: string;
    mode: "solo" | "exchange";
    status: "waiting" | "active";
    created_at: string;
    entries: { count: number }[];
  } | null;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; diaries: NonNullable<MyDiary["diary"]>[] };

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
    supabase
      .from("diary_members")
      .select("diary:diaries(id, mode, status, created_at, entries:diary_entries(count))")
      .eq("user_id", session.userId)
      .order("joined_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setState({ status: "error", message: error.message });
        else
          setState({
            status: "ready",
            diaries: ((data ?? []) as unknown as MyDiary[])
              .map((d) => d.diary)
              .filter((d): d is NonNullable<MyDiary["diary"]> => d !== null),
          });
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
      <p role="alert" className="mt-3 border-y border-rule py-6 text-[15px] text-pen-orange">
        내 일기장을 불러오지 못했어요. 새로고침해 주세요. ({state.message})
      </p>
    );
  }
  if (state.diaries.length === 0) {
    return (
      <p className="mt-3 border-y border-rule py-6 text-[15px] leading-relaxed text-pencil">
        아직 일기장이 없어요. 새 일기장을 눌러 첫 일기장을 만들어 보세요.
      </p>
    );
  }
  return (
    <ul className="mt-3 border-t border-rule">
      {state.diaries.map((d) => (
        <li key={d.id} className="border-b border-rule">
          <Link href={`/diary/${d.id}`} className="flex items-baseline justify-between gap-4 py-4">
            <span>
              <span className="block font-serif text-[18px] text-ink">{diaryTitle(d.mode)}</span>
              <span className="mt-0.5 block text-[14px] text-pencil">
                {dateFormat.format(new Date(d.created_at))}에 시작, {d.entries[0]?.count ?? 0}편
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
