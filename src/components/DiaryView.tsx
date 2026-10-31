"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { DiaryWriter } from "./DiaryWriter";
import { diaryTitle } from "./MyDiaries";

// 1-12 일기장 화면 + 3-9 지난 일기 목록을 DB에서 읽기 (PRD #4.2)

type Diary = { id: string; mode: "solo" | "exchange"; status: "waiting" | "active" };
export type Entry = {
  id: string;
  user_id: string;
  prompt: string;
  body: string;
  created_at: string;
};

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; diary: Diary };

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Seoul",
});

export function DiaryView({ diaryId }: { diaryId: string }) {
  const session = useAnonymousSession();
  const [state, setState] = useState<State>({ status: "loading" });
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (session.status !== "ready") return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      const diaryRes = await supabase
        .from("diaries")
        .select("id, mode, status")
        .eq("id", diaryId)
        .maybeSingle();
      if (cancelled) return;
      if (diaryRes.error) {
        if (diaryRes.error.code === "22P02") setState({ status: "missing" });
        else setState({ status: "error", message: diaryRes.error.message });
        return;
      }
      if (!diaryRes.data) {
        setState({ status: "missing" });
        return;
      }
      const entriesRes = await supabase
        .from("diary_entries")
        .select("id, user_id, prompt, body, created_at")
        .eq("diary_id", diaryId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (entriesRes.error) {
        setState({ status: "error", message: entriesRes.error.message });
        return;
      }
      setEntries((entriesRes.data ?? []) as Entry[]);
      setState({ status: "ready", diary: diaryRes.data as Diary });
    })();

    return () => {
      cancelled = true;
    };
  }, [session.status, diaryId]);

  const navLabel =
    state.status === "ready"
      ? state.diary.mode === "solo"
        ? "나만 보는 일기장"
        : "교환일기"
      : "";

  return (
    <main className="mx-auto w-full max-w-[640px] pb-24">
      <nav className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <Link href="/" className="py-2 text-[15px] text-pencil">
          홈으로
        </Link>
        <span className="text-[14px] text-pencil">{navLabel}</span>
      </nav>

      {state.status === "loading" && session.status !== "error" && (
        <div aria-label="일기장을 불러오는 중" className="px-5 pt-10 sm:px-8">
          <div className="h-8 w-44 rounded-sm bg-rule/60" />
          <div className="mt-8 h-16 rounded-sm bg-rule/30" />
          <div className="mt-5 h-48 rounded-sm bg-rule/20" />
        </div>
      )}

      {state.status === "missing" && (
        <div className="px-5 pt-12 sm:px-8">
          <h1 className="font-serif text-[24px] text-ink">들어갈 수 없는 일기장이에요</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-pencil">
            없는 일기장이거나, 이 브라우저의 내가 쓰는 일기장이 아니에요.
          </p>
          <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[15px] text-page">
            홈으로 가기
          </Link>
        </div>
      )}

      {state.status === "error" && (
        <p role="alert" className="px-5 pt-12 text-[15px] leading-relaxed text-pen-orange sm:px-8">
          일기장을 불러오지 못했어요. 새로고침해 주세요. ({state.message})
        </p>
      )}

      {state.status === "ready" && (
        <>
          <header className="px-5 pt-10 sm:px-8">
            <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">
              {diaryTitle(state.diary.mode)}
            </h1>
          </header>

          <section aria-label="오늘 일기 쓰기" className="mt-8 px-5 sm:px-8">
            <DiaryWriter
              diaryId={state.diary.id}
              onSaved={(entry) => setEntries((prev) => [entry, ...prev])}
            />
          </section>

          <section aria-labelledby="past" className="mt-14 px-5 sm:px-8">
            <h2 id="past" className="font-serif text-[22px] text-ink">
              지난 일기
            </h2>
            {entries.length === 0 ? (
              <p className="mt-3 border-y border-rule py-6 text-[15px] text-pencil">
                아직 쓴 일기가 없어요. 위 칸에 오늘의 첫 일기를 적어 보세요.
              </p>
            ) : (
              <ol className="mt-3 border-t border-rule">
                {entries.map((e) => (
                  <li key={e.id} className="border-b border-rule py-6">
                    <p className="text-[14px] text-pencil">{dateFormat.format(new Date(e.created_at))}</p>
                    {e.prompt && (
                      <p className="mt-2 font-hand text-[22px] leading-snug text-pencil">{e.prompt}</p>
                    )}
                    <p className="mt-3 whitespace-pre-wrap font-serif text-[17px] leading-[1.9] text-ink">
                      {e.body}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  );
}
