"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { questionFor } from "@/data/questions";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { AppShell } from "./AppShell";
import { InviteCode } from "./CodeJoinForm";
import { DiaryCalendar, dayKey } from "./DiaryCalendar";
import { COMMENT_COLUMNS, EntryCard, EntryPreview, type Comment, type Entry } from "./DiaryEntries";
import { DiaryWriter } from "./DiaryWriter";
import { diaryTitle } from "./MyDiaries";
import { NotAllowed } from "./NotAllowed";
import { PEN, type PenColor } from "./PenChip";
import { Sheet } from "./Sheet";

export type { Entry } from "./DiaryEntries";

// 일기장 (혼자·교환 공통) (PRD #4.2)
// 1-12 화면 · 3-9 지난 일기 · 5-2 짝 기다리기 · 5-4 교대 잠금 · 5-5 작성자 펜 색 · 7-10 나가기
// 8-5 달력 + 쓴 일기 · 8-6 오늘의 일기 쓰기 탭
// 9-1 이름 바꾸기 · 9-2 내 일기 지우기 · 9-3 교환일기는 두 사람이 같은 질문 · 9-4 댓글 · 9-5 날짜별 탭

type Diary = {
  id: string;
  mode: "solo" | "exchange";
  status: "waiting" | "active" | "closed";
  is_private: boolean;
  invite_code: string | null;
  title?: string | null;
  created_at?: string;
};
type Member = { user_id: string; alias: string; pen_color: PenColor; left_at: string | null };

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; diary: Diary; members: Member[] };

type Tab = "list" | "write" | "day";

const dayTitleFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" });
const dayLongFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long", timeZone: "Asia/Seoul" });
const keyToDate = (k: string) => new Date(`${k}T12:00:00+09:00`);

export function DiaryView({ diaryId }: { diaryId: string }) {
  const session = useAnonymousSession();
  const [state, setState] = useState<State>({ status: "loading" });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("list");
  const [day, setDay] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  // 불러온 시각 (며칠 지났는지 셀 때 쓴다. 렌더 중에는 시계를 읽지 않는다)
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async (): Promise<{ state: State; entries?: Entry[]; comments?: Comment[] }> => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { state: { status: "error", message: "Supabase 연결 정보가 없어요." } };
    let diaryRes = await supabase
      .from("diaries")
      .select("id, mode, status, is_private, invite_code, title, created_at")
      .eq("id", diaryId)
      .maybeSingle();
    // 10_v6.sql 전이면 title 칸이 없다
    if (diaryRes.error?.code === "42703") {
      diaryRes = await supabase.from("diaries").select("id, mode, status, is_private, invite_code, created_at").eq("id", diaryId).maybeSingle();
    }
    if (diaryRes.error) {
      if (diaryRes.error.code === "22P02") return { state: { status: "missing" } };
      return { state: { status: "error", message: diaryRes.error.message } };
    }
    if (!diaryRes.data) return { state: { status: "missing" } };

    const [membersRes, entriesRes, commentsRes] = await Promise.all([
      supabase.from("diary_members").select("user_id, alias, pen_color, left_at").eq("diary_id", diaryId).order("joined_at"),
      supabase.from("diary_entries").select("id, user_id, prompt, body, created_at").eq("diary_id", diaryId).order("created_at", { ascending: false }),
      supabase.from("diary_comments").select(COMMENT_COLUMNS).eq("diary_id", diaryId).order("created_at", { ascending: true }),
    ]);
    const err = membersRes.error ?? entriesRes.error;
    if (err) return { state: { status: "error", message: err.message } };
    return {
      state: { status: "ready", diary: diaryRes.data as Diary, members: (membersRes.data ?? []) as Member[] },
      entries: (entriesRes.data ?? []) as Entry[],
      comments: commentsRes.error ? [] : ((commentsRes.data ?? []) as Comment[]),
    };
  }, [diaryId]);

  useEffect(() => {
    if (session.status !== "ready") return;
    let cancelled = false;
    load().then((res) => {
      if (cancelled) return;
      if (res.entries) setEntries(res.entries);
      if (res.comments) setComments(res.comments);
      setLoadedAt(Date.now());
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
    if (res.comments) setComments(res.comments);
    setLoadedAt(Date.now());
    setState(res.state);
    setRefreshing(false);
  }

  const commentsByEntry = useMemo(() => {
    const m = new Map<string, Comment[]>();
    for (const c of comments) m.set(c.entry_id, [...(m.get(c.entry_id) ?? []), c]);
    return m;
  }, [comments]);

  const me = session.userId;
  const ready = state.status === "ready" ? state : null;
  const exchange = ready?.diary.mode === "exchange";
  const penOf = (userId: string): PenColor => ready?.members.find((m) => m.user_id === userId)?.pen_color ?? "black";
  // 5-4 마지막 일기가 내 글이면 잠금 (DB 정책도 같은 규칙으로 막는다)
  const lastIsMine = entries.length > 0 && entries[0].user_id === me;
  const waiting = exchange && ready?.diary.status === "waiting";
  const closed = exchange && ready?.diary.status === "closed";
  const locked = exchange && !waiting && !closed && lastIsMine;
  const canWrite = !!ready && !waiting && !closed && !locked;
  // 10-2 짝이 멀어졌을 때: 짝의 차례로 7일 넘게 멈춰 있으면 기다릴지·마무리할지 묻는다
  const daysSince = (iso?: string) => (iso && loadedAt ? Math.floor((loadedAt - new Date(iso).getTime()) / 86400000) : 0);
  const quietDays = locked ? daysSince(entries[0]?.created_at) : 0;
  const snoozed = useSnooze(diaryId, loadedAt);
  const partnerAway = locked && quietDays >= AWAY_DAYS && !snoozed.active;
  const waitingDays = waiting ? daysSince(ready?.diary.created_at) : 0;
  const someoneLeft = !!ready?.members.some((m) => m.left_at);
  const myTurn = exchange && canWrite;
  const todayKey = dayKey(new Date());

  // 9-3 질문: 혼자 쓰기는 한 편마다 다음 질문.
  // 교환일기는 두 사람이 같은 질문에 한 번씩 답한다 → 짝이 답한 질문이 있으면 그 질문, 둘 다 답했으면 다음 질문.
  const { question, questionLabel } = (() => {
    if (!ready) return { question: "", questionLabel: "" };
    if (!exchange) return { question: questionFor(ready.diary.id, entries.length), questionLabel: `${entries.length + 1}번째 질문` };
    const round = Math.floor(entries.length / 2);
    if (entries.length % 2 === 1 && entries[0].prompt) {
      return { question: entries[0].prompt, questionLabel: `짝이 답한 ${round + 1}번째 질문에 나도 답해요` };
    }
    return { question: questionFor(ready.diary.id, round), questionLabel: `${round + 1}번째 질문 · 두 사람이 같은 질문에 답해요` };
  })();

  function openDay(key: string, has: boolean) {
    if (!has) {
      if (key === todayKey) setTab("write");
      return;
    }
    setDay(key);
    setTab("day");
    requestAnimationFrame(() => document.querySelector('[role="tablist"]')?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const dayEntries = day ? [...entries].filter((e) => dayKey(e.created_at) === day).reverse() : [];
  const title = ready ? ready.diary.title || diaryTitle(ready.diary.mode) : "";

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[640px] pb-24">
        <div className="flex items-center justify-between gap-3 px-5 pt-6 sm:px-8">
          <Link href="/diary" className="py-2 text-[14px] text-pencil">
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
          <NotAllowed title="들어갈 수 없는 일기장이에요" desc="없는 일기장이거나, 이 브라우저의 내가 쓰는 일기장이 아니에요." />
        )}

        {state.status === "error" && (
          <p role="alert" className="px-5 pt-12 text-[14px] leading-relaxed text-pen-orange sm:px-8">
            일기장을 불러오지 못했어요. 새로고침해 주세요. ({state.message})
          </p>
        )}

        {ready && (
          <>
            <header className="px-5 pt-4 sm:px-8">
              <TitleEditor
                diaryId={ready.diary.id}
                title={title}
                placeholder={diaryTitle(ready.diary.mode)}
                onRenamed={(t) =>
                  setState((s) => (s.status === "ready" ? { ...s, diary: { ...s.diary, title: t } } : s))
                }
              />
              {exchange && (
                <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-[13px] text-pencil">함께 쓰는 사람</span>
                  {ready.members.map((m) => (
                    <span key={m.user_id} className={`font-hand text-[22px] leading-none ${PEN[m.pen_color].className}`}>
                      {m.alias}
                      {m.user_id === me ? " (나)" : m.left_at ? " (떠남)" : ""}
                    </span>
                  ))}
                </p>
              )}
              {exchange && ready.diary.is_private && ready.diary.invite_code && waiting && (
                <InviteCode code={ready.diary.invite_code} note="친구에게 이 코드를 보내 주세요. 친구가 코드로 들어오면 짝이 돼요." />
              )}
            </header>

            {/* 8-6 / 9-5 탭: 일기 · 오늘의 일기 쓰기 · (고른 날짜) */}
            <div role="tablist" aria-label="일기장" className="mt-6 flex overflow-x-auto border-b border-rule px-5 sm:px-8">
              <TabButton on={tab === "list"} onClick={() => setTab("list")}>
                일기 <span className="text-[12px] text-pencil">{entries.length}편</span>
              </TabButton>
              <TabButton on={tab === "write"} onClick={() => setTab("write")}>
                오늘의 일기 쓰기
                {myTurn && <span aria-label="쓸 수 있음" className="ml-1.5 inline-block h-2 w-2 rounded-full bg-ink align-middle" />}
              </TabButton>
              {day && (
                <span className="flex items-stretch">
                  <TabButton on={tab === "day"} onClick={() => setTab("day")}>
                    {dayTitleFormat.format(keyToDate(day))}
                  </TabButton>
                  <button
                    type="button"
                    aria-label="날짜 탭 닫기"
                    onClick={() => {
                      setDay(null);
                      setTab("list");
                    }}
                    className="-mb-px border-b-2 border-transparent px-1 text-[16px] text-pencil"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            {tab === "list" && (
              <section role="tabpanel" aria-label="일기" className="px-5 pt-6 sm:px-8">
                <DiaryCalendar entries={entries} penOf={penOf} onPickDay={openDay} todayKey={todayKey} />
                <p className="mt-2 text-[12px] text-pencil">날짜를 누르면 그날 쓴 일기만 따로 볼 수 있어요.</p>

                {entries.length === 0 ? (
                  <div className="mt-6 border-y border-rule py-8 text-center">
                    <p className="text-[14px] text-pencil">{waiting ? "짝이 생기면 여기에 둘의 일기가 쌓여요." : "아직 쓴 일기가 없어요."}</p>
                    {!waiting && !closed && (
                      <button type="button" onClick={() => setTab("write")} className="mt-4 h-11 rounded-full bg-ink px-6 text-[14px] text-page">
                        첫 일기 쓰러 가기
                      </button>
                    )}
                  </div>
                ) : (
                  <ol className="mt-6 border-t border-rule">
                    {entries.map((e) => (
                      <EntryPreview
                        key={e.id}
                        entry={e}
                        me={me}
                        exchange={!!exchange}
                        penOf={penOf}
                        commentCount={commentsByEntry.get(e.id)?.length ?? 0}
                        highlight={e.id === justSaved}
                        onOpen={() => openDay(dayKey(e.created_at), true)}
                      />
                    ))}
                  </ol>
                )}
              </section>
            )}

            {tab === "day" && day && (
              <section role="tabpanel" aria-label={dayLongFormat.format(keyToDate(day))} className="px-5 pt-6 sm:px-8">
                <h2 className="font-display text-[21px] text-ink">{dayLongFormat.format(keyToDate(day))}</h2>
                {dayEntries.length === 0 ? (
                  <p className="mt-4 border-y border-rule py-6 text-[14px] text-pencil">이 날 쓴 일기가 없어요.</p>
                ) : (
                  <div className="mt-2">
                    {dayEntries.map((e) => (
                      <EntryCard
                        key={e.id}
                        entry={e}
                        me={me}
                        exchange={!!exchange}
                        penOf={penOf}
                        comments={commentsByEntry.get(e.id) ?? []}
                        diaryId={ready.diary.id}
                        canComment={!closed}
                        onDeleted={(id) => {
                          setEntries((prev) => prev.filter((x) => x.id !== id));
                          setComments((prev) => prev.filter((c) => c.entry_id !== id));
                        }}
                        onCommentAdded={(c) => setComments((prev) => [...prev, c])}
                        onCommentDeleted={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === "write" && (
              <section role="tabpanel" aria-label="오늘의 일기 쓰기" className="px-5 pt-6 sm:px-8">
                {closed ? (
                  <div className="rounded-sm border border-dashed border-pencil/60 px-5 py-6">
                    <p className="font-display text-[18px] text-ink">
                      {someoneLeft ? "짝이 교환일기를 떠났어요" : "이 교환일기는 마무리됐어요"}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-pencil">
                      지난 일기는 그대로 남아 있지만 새 일기는 쓸 수 없어요. 새 짝과 쓰려면 교환일기 화면에서 새 일기장을 만들어 주세요.
                    </p>
                  </div>
                ) : waiting ? (
                  <WaitBox
                    title="짝을 기다리는 중"
                    desc={
                      (ready.diary.is_private
                        ? "위 참여 코드로 친구가 들어오면 짝이 돼요. 짝이 생기면 둘 중 누구든 첫 일기를 쓸 수 있어요."
                        : "교환일기를 고른 다른 사람이 오면 이 일기장의 짝이 돼요. 짝이 생기면 둘 중 누구든 첫 일기를 쓸 수 있어요.") +
                      (waitingDays >= WAIT_HINT_DAYS
                        ? ` ${waitingDays}일째 기다리고 있어요. 아는 사람과 쓰고 싶다면 아래 "교환일기 그만두기" 뒤에 교환일기 화면의 "아는 사람과 교환일기"로 친구를 불러 보세요.`
                        : "")
                    }
                    onRefresh={refresh}
                    refreshing={refreshing}
                  />
                ) : partnerAway ? (
                  <AwayBox
                    diaryId={ready.diary.id}
                    days={quietDays}
                    onWait={snoozed.snooze}
                    onClosed={() =>
                      setState((st) => (st.status === "ready" ? { ...st, diary: { ...st.diary, status: "closed" } } : st))
                    }
                  />
                ) : locked ? (
                  <WaitBox
                    title="짝의 답장을 기다리는 중"
                    desc="마지막 일기를 내가 썼어요. 짝이 같은 질문에 답하면 다음 질문으로 다시 내 차례가 돼요."
                    onRefresh={refresh}
                    refreshing={refreshing}
                  />
                ) : (
                  <>
                    <p className="mb-4 text-[13px] text-pencil">{dayLongFormat.format(new Date())}</p>
                    <DiaryWriter
                      diaryId={ready.diary.id}
                      question={question}
                      questionLabel={questionLabel}
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

const AWAY_DAYS = 7;
const WAIT_HINT_DAYS = 3;
const SNOOZE_DAYS = 3;

// "조금 더 기다리기"를 누르면 3일 동안 다시 묻지 않는다 (이 브라우저에 기억)
function useSnooze(diaryId: string, now: number) {
  const key = `nb:snooze:${diaryId}`;
  const [until, setUntil] = useState<number | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v) setUntil(Number(v));
    } catch {}
  }, [key]);
  return {
    active: until !== null && until > now,
    snooze: () => {
      const t = Date.now() + SNOOZE_DAYS * 86400000;
      try {
        localStorage.setItem(key, String(t));
      } catch {}
      setUntil(t);
    },
  };
}

// 10-2 짝이 잠시 멀어졌을 때: 기다리기 / 마무리하기 / 마무리하고 새 짝 찾기
function AwayBox({
  diaryId,
  days,
  onWait,
  onClosed,
}: {
  diaryId: string;
  days: number;
  onWait: () => void;
  onClosed: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"close" | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function close(thenNew: boolean) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(thenNew ? "new" : "close");
    setError(null);
    const { error } = await supabase.rpc("close_diary", { p_diary: diaryId });
    if (error) {
      setBusy(null);
      setError(`마무리하지 못했어요. (${error.message})`);
      return;
    }
    if (!thenNew) {
      setBusy(null);
      onClosed();
      return;
    }
    const res = await supabase.rpc("find_diary_partner");
    if (res.error || !res.data) {
      setBusy(null);
      onClosed();
      setError(`마무리했지만 새 짝을 찾지 못했어요. 교환일기 화면에서 다시 시작해 주세요. (${res.error?.message ?? "응답 없음"})`);
      return;
    }
    router.push(`/diary/${res.data}`);
  }

  return (
    <div className="rounded-sm border border-dashed border-pencil/60 px-5 py-6">
      <p className="font-display text-[18px] text-ink">짝이 잠시 멀어졌어요</p>
      <p className="mt-2 text-[14px] leading-relaxed text-pencil">
        마지막으로 일기를 주고받은 지 {days}일이 지났어요. 바쁜 날이 이어지는 걸지도 몰라요. 조금 더 기다릴까요, 여기서 마무리할까요?
        마무리해도 지금까지의 일기는 두 사람 모두 계속 볼 수 있어요.
      </p>
      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
        <button type="button" onClick={onWait} disabled={busy !== null} className="h-11 rounded-full border border-ink px-5 text-[14px] text-ink">
          조금 더 기다리기
        </button>
        <button type="button" onClick={() => close(false)} disabled={busy !== null} className="h-11 rounded-full border border-ink px-5 text-[14px] text-ink disabled:opacity-50">
          {busy === "close" ? "마무리하는 중…" : "여기서 마무리하기"}
        </button>
        <button type="button" onClick={() => close(true)} disabled={busy !== null} className="h-11 rounded-full bg-ink px-5 text-[14px] text-page disabled:opacity-50">
          {busy === "new" ? "새 짝을 찾는 중…" : "마무리하고 새 짝 찾기"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-pen-orange">
          {error}
        </p>
      )}
    </div>
  );
}

function TabButton({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={onClick}
      className={`-mb-px min-h-12 shrink-0 border-b-2 px-3 text-[15px] ${on ? "border-ink font-bold text-ink" : "border-transparent text-pencil"}`}
    >
      {children}
    </button>
  );
}

// 9-1 일기장 이름 바꾸기 (교환일기는 두 사람 모두 바꿀 수 있다)
function TitleEditor({
  diaryId,
  title,
  placeholder,
  onRenamed,
}: {
  diaryId: string;
  title: string;
  placeholder: string;
  onRenamed: (t: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const next = value.trim();
    const { error } = await supabase.rpc("rename_diary", { p_diary: diaryId, p_title: next });
    setBusy(false);
    if (error) {
      setError(`이름을 바꾸지 못했어요. (${error.message})`);
      return;
    }
    onRenamed(next || null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="font-display text-[30px] leading-tight text-ink [overflow-wrap:anywhere]">{title}</h1>
        <button
          type="button"
          onClick={() => {
            setValue(title === placeholder ? "" : title);
            setEditing(true);
          }}
          className="h-9 text-[13px] text-pencil underline underline-offset-4"
        >
          이름 바꾸기
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={save}>
      <label htmlFor="diary-title" className="text-[13px] text-pencil">
        일기장 이름 (30자까지, 비우면 기본 이름)
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="diary-title"
          autoFocus
          value={value}
          maxLength={30}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 min-w-0 flex-1 rounded-lg border border-rule bg-page px-3 font-display text-[18px] text-ink focus:border-ink focus:outline-none"
        />
        <button type="button" onClick={() => setEditing(false)} className="h-12 shrink-0 px-2 text-[13px] text-pencil">
          취소
        </button>
        <button type="submit" disabled={busy} className="h-12 shrink-0 rounded-full bg-ink px-4 text-[13px] text-page disabled:opacity-50">
          {busy ? "…" : "저장"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-[12px] text-pen-orange">
          {error}
        </p>
      )}
    </form>
  );
}

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
        className="h-9 text-[13px] text-pencil underline underline-offset-4"
      >
        {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`${label}?`}>
        <p className="mt-3 text-[14px] leading-relaxed text-pencil">{explain}</p>
        <button
          type="button"
          onClick={leave}
          disabled={busy}
          className="mt-5 h-12 w-full rounded-full border border-pen-orange text-[14px] text-pen-orange disabled:opacity-50"
        >
          {busy ? "처리하는 중…" : deletes ? "지우기" : "나가기"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-[13px] text-pen-orange">
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
      <p className="font-display text-[18px] text-ink">{title}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-pencil">{desc}</p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="mt-4 h-10 rounded-full border border-ink px-4 text-[13px] text-ink disabled:opacity-60"
      >
        {refreshing ? "확인하는 중…" : "다시 확인하기"}
      </button>
    </div>
  );
}
