"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { AppShell } from "./AppShell";
import { DiaryCalendar, dayKey } from "./DiaryCalendar";
import { DiaryWriter } from "./DiaryWriter";
import { diaryTitle } from "./MyDiaries";
import { InviteCode } from "./CodeJoinForm";
import { NotAllowed } from "./NotAllowed";
import { PEN, type PenColor } from "./PenChip";
import { Sheet } from "./Sheet";

// 일기장 (혼자·교환 공통) (PRD #4.2)
// 1-12 화면 · 3-9 지난 일기 · 5-2 짝 기다리기 · 5-4 교대 잠금 · 5-5 글마다 작성자 펜 색 · 7-10 나가기·끝난 교환일기
// 8-5 일기를 위에(달력 + 쓴 일기) · 8-6 오늘의 일기 쓰기 탭

type Diary = {
  id: string;
  mode: "solo" | "exchange";
  status: "waiting" | "active" | "closed";
  is_private: boolean;
  invite_code: string | null;
};
type Member = { user_id: string; alias: string; pen_color: PenColor; left_at: string | null };
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
  // 8-6 탭: 쓴 일기(달력 포함)가 기본, 쓰기는 따로
  const [tab, setTab] = useState<"list" | "write">("list");
  const [flashDay, setFlashDay] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);

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
      supabase.from("diary_members").select("user_id, alias, pen_color, left_at").eq("diary_id", diaryId).order("joined_at"),
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
  const closed = exchange && ready?.diary.status === "closed";
  const locked = exchange && !waiting && !closed && lastIsMine;

  const canWrite = !!ready && !waiting && !closed && !locked;
  const myTurn = exchange && canWrite;
  const todayKey = dayKey(new Date());
  const wroteToday = entries.some((e) => e.user_id === me && dayKey(e.created_at) === todayKey);

  function pickDay(key: string, has: boolean) {
    if (!has) {
      setTab("write");
      return;
    }
    setTab("list");
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-day="${key}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      setFlashDay(key);
    });
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[640px] pb-24">
        <div className="flex items-center justify-between gap-3 px-5 pt-6 sm:px-8">
          <Link href="/diary" className="py-2 text-[15px] text-pencil">
            ‹ 교환일기
          </Link>
          {ready && me && (
            <span className={`font-hand text-[22px] leading-none ${exchange ? PEN[penOf(me)].className : "text-pencil"}`}>
              {exchange ? `나는 ${PEN[penOf(me)].label}` : "나만 보는 일기장"}
            </span>
          )}
        </div>

        {state.status === "loading" && session.status !== "error" && (
          <div aria-label="일기장을 불러오는 중" className="px-5 pt-6 sm:px-8">
            <div className="h-8 w-44 rounded-sm bg-rule/60" />
            <div className="mt-8 h-72 rounded-lg bg-rule/25" />
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
            <header className="px-5 pt-4 sm:px-8">
              <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">{diaryTitle(ready.diary.mode)}</h1>
              {exchange && (
                <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-[14px] text-pencil">함께 쓰는 사람</span>
                  {ready.members.map((m) => (
                    <span key={m.user_id} className={`font-hand text-[22px] leading-none ${PEN[m.pen_color].className}`}>
                      {m.alias}
                      {m.user_id === me ? " (나)" : m.left_at ? " (떠남)" : ""}
                    </span>
                  ))}
                </p>
              )}
              {exchange && ready.diary.is_private && ready.diary.invite_code && waiting && (
                <InviteCode
                  code={ready.diary.invite_code}
                  note="친구에게 이 코드를 보내 주세요. 친구가 코드로 들어오면 짝이 돼요."
                />
              )}
            </header>

            {/* 8-6 탭: 일기(달력+쓴 일기) / 오늘의 일기 쓰기 */}
            <div role="tablist" aria-label="일기장" className="mt-6 flex border-b border-rule px-5 sm:px-8">
              <TabButton id="list" current={tab} onSelect={setTab}>
                일기 <span className="text-[13px] text-pencil">{entries.length}편</span>
              </TabButton>
              <TabButton id="write" current={tab} onSelect={setTab}>
                오늘의 일기 쓰기
                {myTurn && !wroteToday && <span aria-label="쓸 수 있음" className="ml-1.5 inline-block h-2 w-2 rounded-full bg-ink align-middle" />}
              </TabButton>
            </div>

            {tab === "list" ? (
              <section role="tabpanel" aria-label="일기" className="px-5 pt-6 sm:px-8">
                <DiaryCalendar entries={entries} penOf={penOf} onPickDay={pickDay} todayKey={todayKey} />

                {entries.length === 0 ? (
                  <div className="mt-6 border-y border-rule py-8 text-center">
                    <p className="text-[15px] text-pencil">
                      {waiting ? "짝이 생기면 여기에 둘의 일기가 쌓여요." : "아직 쓴 일기가 없어요."}
                    </p>
                    {!waiting && (
                      <button
                        type="button"
                        onClick={() => setTab("write")}
                        className="mt-4 h-11 rounded-full bg-ink px-6 text-[15px] text-page"
                      >
                        첫 일기 쓰러 가기
                      </button>
                    )}
                  </div>
                ) : (
                  <ol className="mt-6 border-t border-rule">
                    {entries.map((e, idx) => {
                      const k = dayKey(e.created_at);
                      const firstOfDay = idx === entries.findIndex((x) => dayKey(x.created_at) === k);
                      return (
                        <li
                          key={e.id}
                          data-day={firstOfDay ? k : undefined}
                          className={`scroll-mt-20 border-b border-rule py-6 transition-colors duration-700 ${
                            flashDay === k ? "bg-rule/30" : ""
                          } ${e.id === justSaved ? "bg-rule/30" : ""}`}
                        >
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
                      );
                    })}
                  </ol>
                )}
              </section>
            ) : (
              <section role="tabpanel" aria-label="오늘의 일기 쓰기" className="px-5 pt-6 sm:px-8">
                {closed ? (
                  <div className="rounded-sm border border-dashed border-pencil/60 px-5 py-6">
                    <p className="font-serif text-[20px] text-ink">짝이 교환일기를 떠났어요</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-pencil">
                      이 교환일기는 여기서 끝났어요. 지난 일기는 그대로 남아 있지만 새 일기는 쓸 수 없어요. 새 짝과 쓰려면 교환일기 화면에서 새 일기장을 만들어 주세요.
                    </p>
                  </div>
                ) : waiting ? (
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
                  <>
                    <p className="mb-4 text-[14px] text-pencil">{todayFormat.format(new Date())}</p>
                    <DiaryWriter
                      diaryId={ready.diary.id}
                      entryCount={entries.length}
                      onSaved={(entry) => {
                        setEntries((prev) => [entry, ...prev]);
                        setJustSaved(entry.id);
                        setTab("list");
                        requestAnimationFrame(() =>
                          document.querySelector('[role="tablist"]')?.scrollIntoView({ behavior: "smooth", block: "start" }),
                        );
                      }}
                    />
                  </>
                )}
              </section>
            )}

            <div className="mt-10 px-5 text-right sm:px-8">
              <LeaveDiaryButton diaryId={ready.diary.id} mode={ready.diary.mode} status={ready.diary.status} />
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

function TabButton({
  id,
  current,
  onSelect,
  children,
}: {
  id: "list" | "write";
  current: "list" | "write";
  onSelect: (t: "list" | "write") => void;
  children: React.ReactNode;
}) {
  const on = id === current;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={() => onSelect(id)}
      className={`-mb-px min-h-12 border-b-2 px-3 text-[16px] ${on ? "border-ink font-bold text-ink" : "border-transparent text-pencil"}`}
    >
      {children}
    </button>
  );
}

const todayFormat = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
  timeZone: "Asia/Seoul",
});

// 7-10 일기장 나가기
function LeaveDiaryButton({
  diaryId,
  mode,
  status,
}: {
  diaryId: string;
  mode: Diary["mode"];
  status: Diary["status"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletes = mode === "solo" || status === "waiting";
  const label = mode === "solo" ? "이 일기장 지우기" : status === "waiting" ? "교환일기 그만두기" : "이 교환일기 나가기";
  const explain =
    mode === "solo"
      ? "이 일기장과 쓴 일기가 모두 지워져요. 되돌릴 수 없어요."
      : status === "waiting"
        ? "아직 짝이 없어서 이 교환일기는 지워져요."
        : status === "closed"
          ? "짝도 이미 떠난 교환일기예요. 나가면 이 일기장은 완전히 지워져요."
          : "나가면 이 교환일기는 끝나요. 짝은 지금까지의 일기를 계속 볼 수 있지만 둘 다 새 일기는 쓸 수 없고, 나는 다시 들어올 수 없어요.";

  async function leave() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("leave_diary", { p_diary: diaryId });
    if (error) {
      setBusy(false);
      setError(`나가지 못했어요. 다시 눌러 주세요. (${error.message})`);
      return;
    }
    setOpen(false);
    router.replace("/diary");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 text-[14px] text-pencil underline underline-offset-4"
      >
        {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`${label}?`}>
        <p className="mt-3 text-[15px] leading-relaxed text-pencil">{explain}</p>
        <button
          type="button"
          onClick={leave}
          disabled={busy}
          className="mt-5 h-12 w-full rounded-full border border-pen-orange text-[15px] text-pen-orange disabled:opacity-50"
        >
          {busy ? "처리하는 중…" : deletes ? "지우기" : "나가기"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-[14px] text-pen-orange">
            {error}
          </p>
        )}
      </Sheet>
    </>
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
