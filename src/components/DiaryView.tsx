"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { DiaryWriter } from "./DiaryWriter";
import { diaryTitle } from "./MyDiaries";
import { InviteCode } from "./CodeJoinForm";
import { NotAllowed } from "./NotAllowed";
import { PEN, type PenColor } from "./PenChip";

// 일기장 (혼자·교환 공통) (PRD #4.2)
// 1-12 화면 · 3-9 지난 일기 · 5-2 짝 기다리기 · 5-4 교대 잠금 · 5-5 글마다 작성자 펜 색

type Diary = {
  id: string;
  mode: "solo" | "exchange";
  status: "waiting" | "active";
  is_private: boolean;
  invite_code: string | null;
};
type Member = { user_id: string; alias: string; pen_color: PenColor };
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
  | { status: "ready"; diary: Diary; members: Member[] };

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
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (): Promise<
    { state: State; entries?: Entry[] }
  > => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { state: { status: "error", message: "Supabase 연결 정보가 없어요." } };
    const diaryRes = await supabase.from("diaries").select("id, mode, status, is_private, invite_code").eq("id", diaryId).maybeSingle();
    if (diaryRes.error) {
      if (diaryRes.error.code === "22P02") return { state: { status: "missing" } };
      return { state: { status: "error", message: diaryRes.error.message } };
    }
    if (!diaryRes.data) return { state: { status: "missing" } };

    const [membersRes, entriesRes] = await Promise.all([
      supabase.from("diary_members").select("user_id, alias, pen_color").eq("diary_id", diaryId).order("joined_at"),
      supabase
        .from("diary_entries")
        .select("id, user_id, prompt, body, created_at")
        .eq("diary_id", diaryId)
        .order("created_at", { ascending: false }),
    ]);
    const err = membersRes.error ?? entriesRes.error;
    if (err) return { state: { status: "error", message: err.message } };
    return {
      state: { status: "ready", diary: diaryRes.data as Diary, members: (membersRes.data ?? []) as Member[] },
      entries: (entriesRes.data ?? []) as Entry[],
    };
  }, [diaryId]);

  useEffect(() => {
    if (session.status !== "ready") return;
    let cancelled = false;
    load().then((res) => {
      if (cancelled) return;
      if (res.entries) setEntries(res.entries);
      setState(res.state);
    });
    return () => {
      cancelled = true;
    };
  }, [session.status, load]);

  async function refresh() {
    setRefreshing(true);
    const res = await load();
    if (res.entries) setEntries(res.entries);
    setState(res.state);
    setRefreshing(false);
  }

  const me = session.userId;
  const ready = state.status === "ready" ? state : null;
  const exchange = ready?.diary.mode === "exchange";
  const penOf = (userId: string): PenColor =>
    ready?.members.find((m) => m.user_id === userId)?.pen_color ?? "black";
  // 5-4 마지막 일기가 내 글이면 잠금 (DB 정책도 같은 규칙으로 막는다)
  const lastIsMine = entries.length > 0 && entries[0].user_id === me;
  const waiting = exchange && ready?.diary.status === "waiting";
  const locked = exchange && !waiting && lastIsMine;

  return (
    <main className="mx-auto w-full max-w-[640px] pb-24">
      <nav className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <Link href="/" className="py-2 text-[15px] text-pencil">
          홈으로
        </Link>
        {ready && me && (
          <span className={`font-hand text-[22px] leading-none ${exchange ? PEN[penOf(me)].className : "text-pencil"}`}>
            {exchange ? `나는 ${PEN[penOf(me)].label}` : "나만 보는 일기장"}
          </span>
        )}
      </nav>

      {state.status === "loading" && session.status !== "error" && (
        <div aria-label="일기장을 불러오는 중" className="px-5 pt-10 sm:px-8">
          <div className="h-8 w-44 rounded-sm bg-rule/60" />
          <div className="mt-8 h-16 rounded-sm bg-rule/30" />
          <div className="mt-5 h-48 rounded-sm bg-rule/20" />
        </div>
      )}

      {state.status === "missing" && (
        <NotAllowed
          title="들어갈 수 없는 일기장이에요"
          desc="없는 일기장이거나, 이 브라우저의 내가 쓰는 일기장이 아니에요."
        />
      )}

      {state.status === "error" && (
        <p role="alert" className="px-5 pt-12 text-[15px] leading-relaxed text-pen-orange sm:px-8">
          일기장을 불러오지 못했어요. 새로고침해 주세요. ({state.message})
        </p>
      )}

      {ready && (
        <>
          <header className="px-5 pt-10 sm:px-8">
            <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">{diaryTitle(ready.diary.mode)}</h1>
            {exchange && ready.diary.is_private && ready.diary.invite_code && (
              <InviteCode
                code={ready.diary.invite_code}
                note={waiting ? "친구에게 이 코드를 보내 주세요. 친구가 코드로 들어오면 짝이 돼요." : "이 교환일기의 코드예요."}
              />
            )}
            {exchange && (
              <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-[14px] text-pencil">함께 쓰는 사람</span>
                {ready.members.map((m) => (
                  <span key={m.user_id} className={`font-hand text-[22px] leading-none ${PEN[m.pen_color].className}`}>
                    {m.alias}
                    {m.user_id === me ? " (나)" : ""}
                  </span>
                ))}
              </p>
            )}
          </header>

          <section aria-label="오늘 일기 쓰기" className="mt-8 px-5 sm:px-8">
            {waiting ? (
              <WaitBox
                title="짝을 기다리는 중"
                desc={
                  ready.diary.is_private
                    ? "위 참여 코드로 친구가 들어오면 짝이 돼요. 짝이 생기면 둘 중 누구든 첫 일기를 쓸 수 있어요."
                    : "교환일기를 고른 다른 사람이 오면 이 일기장의 짝이 돼요. 짝이 생기면 둘 중 누구든 첫 일기를 쓸 수 있어요."
                }
                onRefresh={refresh}
                refreshing={refreshing}
              />
            ) : locked ? (
              <WaitBox
                title="짝의 답장을 기다리는 중"
                desc="마지막 일기를 내가 썼어요. 짝이 한 편을 쓰면 다시 내 차례가 돼요."
                onRefresh={refresh}
                refreshing={refreshing}
              />
            ) : (
              <DiaryWriter
                diaryId={ready.diary.id}
                entryCount={entries.length}
                onSaved={(entry) => setEntries((prev) => [entry, ...prev])}
              />
            )}
          </section>

          <section aria-labelledby="past" className="mt-14 px-5 sm:px-8">
            <h2 id="past" className="font-serif text-[22px] text-ink">
              지난 일기
            </h2>
            {entries.length === 0 ? (
              <p className="mt-3 border-y border-rule py-6 text-[15px] text-pencil">
                {waiting ? "짝이 생기면 여기에 둘의 일기가 쌓여요." : "아직 쓴 일기가 없어요. 위 칸에 첫 일기를 적어 보세요."}
              </p>
            ) : (
              <ol className="mt-3 border-t border-rule">
                {entries.map((e) => (
                  <li key={e.id} className="border-b border-rule py-6">
                    <p className="flex flex-wrap items-baseline justify-between gap-2 text-[14px] text-pencil">
                      <span>{dateFormat.format(new Date(e.created_at))}</span>
                      {exchange && (
                        <span className={`font-hand text-[20px] leading-none ${PEN[penOf(e.user_id)].className}`}>
                          {PEN[penOf(e.user_id)].label}
                          {e.user_id === me ? " (나)" : ""}
                        </span>
                      )}
                    </p>
                    {e.prompt && <p className="mt-2 font-hand text-[22px] leading-snug text-pencil">{e.prompt}</p>}
                    <p
                      className={`mt-3 whitespace-pre-wrap font-serif text-[17px] leading-[1.9] text-ink ${
                        exchange ? `border-l-2 pl-3 ${PEN[penOf(e.user_id)].border}` : ""
                      }`}
                    >
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

function WaitBox({
  title,
  desc,
  onRefresh,
  refreshing,
}: {
  title: string;
  desc: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="rounded-sm border border-dashed border-pencil/60 px-5 py-6">
      <p className="font-serif text-[20px] text-ink">{title}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-pencil">{desc}</p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="mt-4 h-10 rounded-full border border-ink px-4 text-[14px] text-ink disabled:opacity-60"
      >
        {refreshing ? "확인하는 중…" : "다시 확인하기"}
      </button>
    </div>
  );
}
