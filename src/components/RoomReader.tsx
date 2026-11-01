"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  getLastSeen,
  getReadingPosition,
  setLastSeen,
  setReadingPosition,
  TEXT_SIZE_PX,
  usePrefs,
} from "@/lib/prefs";
import { useAnonymousSession } from "./AnonymousSession";
import { InviteCode } from "./CodeJoinForm";
import { NotAllowed } from "./NotAllowed";
import { PEN, PenChip, type PenColor } from "./PenChip";
import { NOTE_COLUMNS, NotePanel, type Note } from "./reader/NotePanel";
import { EndOfBook, LeaveRoomButton, LETTER_COLUMNS, type Letter } from "./reader/EndOfBook";
import { HIGHLIGHT_COLUMNS, HighlightedText, MyUnderlines, UnderlineBar, type Highlight } from "./reader/Highlights";
import { Paged } from "./reader/Paged";
import { ReaderSettingsButton } from "./reader/ReaderSettings";

// 책 리더 (혼자·함께 공통) (PRD #4.1)
// 1-10 리더 · 3-3~3-5 문단 메모 · 4-4 펜 색 · 4-5 블라인드 · 4-6 그냥 보기 · 4-7 답글 · 4-8 mode 분기
// 7-1 스크롤/페이지 · 7-2 참여 코드 · 7-4 글자 크기·밤 모드·이어 읽기 · 7-5 새 메모 표시
// 7-6 문장 밑줄 · 7-7 다 읽고 편지 · 7-8 방 나가기
// 방·멤버·메모는 RLS 때문에 이 브라우저의 익명 세션으로만 읽을 수 있어 클라이언트에서 불러온다.

const ROOM_SIZE = 3;

type Mode = "solo" | "together";
type Room = {
  id: string;
  mode: Mode;
  is_private: boolean;
  invite_code: string | null;
  book: {
    title: string;
    author: string;
    year: number | null;
    source: string;
    paragraphs: string[];
  };
};
type Member = { user_id: string; pen_color: PenColor; alias: string };

type LoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; room: Room; members: Member[] };

export function RoomReader({ roomId }: { roomId: string }) {
  const session = useAnonymousSession();
  const prefs = usePrefs();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [notes, setNotes] = useState<Note[]>([]);
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set());
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // 7-5 이번에 들어오기 전 마지막으로 본 시각 (그 뒤에 남이 쓴 메모가 "새 메모")
  const [seenBefore, setSeenBefore] = useState<string | null>(null);
  // 7-4 이어 읽기: 지금 보고 있는 문단 (0부터)
  const [position, setPosition] = useState(0);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { status: "error", message: "Supabase 연결 정보가 없어요." } as const;

    const roomRes = await supabase
      .from("rooms")
      .select("id, mode, is_private, invite_code, book:books(title, author, year, source, paragraphs)")
      .eq("id", roomId)
      .maybeSingle();
    if (roomRes.error) {
      // 방 id 모양이 아니면(uuid가 아니면) 없는 방으로 본다
      if (roomRes.error.code === "22P02") return { status: "missing" } as const;
      return { status: "error", message: roomRes.error.message } as const;
    }
    if (!roomRes.data) return { status: "missing" } as const;

    const [membersRes, notesRes, unlocksRes, highlightsRes, lettersRes] = await Promise.all([
      supabase.from("room_members").select("user_id, pen_color, alias").eq("room_id", roomId).order("joined_at"),
      supabase.from("notes").select(NOTE_COLUMNS).eq("room_id", roomId).order("created_at", { ascending: true }),
      supabase.from("unlocks").select("paragraph_index").eq("room_id", roomId),
      supabase.from("highlights").select(HIGHLIGHT_COLUMNS).eq("room_id", roomId).order("created_at", { ascending: true }),
      supabase.from("letters").select(LETTER_COLUMNS).eq("room_id", roomId).order("created_at", { ascending: true }),
    ]);
    const err = membersRes.error ?? notesRes.error ?? unlocksRes.error;
    if (err) return { status: "error", message: err.message } as const;

    return {
      status: "ready",
      room: roomRes.data as unknown as Room,
      members: (membersRes.data ?? []) as Member[],
      notes: (notesRes.data ?? []) as Note[],
      unlocked: new Set((unlocksRes.data ?? []).map((u) => u.paragraph_index as number)),
      // 08_extras.sql을 아직 실행하지 않았으면 밑줄·편지는 비어 있는 채로 둔다
      highlights: (highlightsRes.error ? [] : (highlightsRes.data ?? [])) as Highlight[],
      letters: (lettersRes.error ? [] : (lettersRes.data ?? [])) as Letter[],
    } as const;
  }, [roomId]);

  useEffect(() => {
    if (session.status !== "ready") return;
    let cancelled = false;
    load().then((res) => {
      if (cancelled) return;
      if (res.status === "ready") {
        const saved = getReadingPosition(roomId);
        const max = res.room.book.paragraphs.length - 1;
        const start = saved !== null && saved > 0 ? Math.min(saved, max) : 0;
        setSeenBefore(getLastSeen(roomId));
        setLastSeen(roomId, new Date().toISOString());
        setPosition(start);
        setResumedFrom(start > 0 ? start : null);
        setState({ status: "ready", room: res.room, members: res.members });
        setNotes(res.notes);
        setUnlocked(res.unlocked);
        setHighlights(res.highlights);
        setLetters(res.letters);
      } else {
        setState(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session.status, load, roomId]);

  // 문단별 메모(답글 제외)와 메모별 답글
  const { topsByParagraph, repliesByParent } = useMemo(() => {
    const tops = new Map<number, Note[]>();
    const replies = new Map<string, Note[]>();
    for (const n of notes) {
      if (n.parent_id) replies.set(n.parent_id, [...(replies.get(n.parent_id) ?? []), n]);
      else tops.set(n.paragraph_index, [...(tops.get(n.paragraph_index) ?? []), n]);
    }
    return { topsByParagraph: tops, repliesByParent: replies };
  }, [notes]);

  const me = session.userId;
  const isNew = useCallback(
    (n: Note) => seenBefore !== null && n.user_id !== me && n.created_at > seenBefore,
    [seenBefore, me],
  );
  const newParagraphs = useMemo(
    () => [...new Set(notes.filter(isNew).map((n) => n.paragraph_index))].sort((a, b) => a - b),
    [notes, isNew],
  );

  const movePosition = useCallback(
    (p: number) => {
      setPosition(p);
      setReadingPosition(roomId, p);
    },
    [roomId],
  );

  if (session.status === "error") return <Shell>{null}</Shell>;
  if (state.status === "loading") {
    return (
      <Shell>
        <ReaderSkeleton />
      </Shell>
    );
  }
  if (state.status === "missing") {
    return (
      <Shell>
        <NotAllowed
          title="들어갈 수 없는 방이에요"
          desc="없는 방이거나, 이 브라우저의 내가 들어간 방이 아니에요. 홈의 책장에서 책을 골라 읽기를 시작해 주세요."
        />
      </Shell>
    );
  }
  if (state.status === "error") {
    return (
      <Shell>
        <p role="alert" className="px-5 pt-12 text-[15px] leading-relaxed text-pen-orange sm:px-8">
          방을 불러오지 못했어요. 새로고침해 주세요. ({state.message})
        </p>
      </Shell>
    );
  }

  const { room, members } = state;
  const together = room.mode === "together";
  const penOf = (userId: string): PenColor => members.find((m) => m.user_id === userId)?.pen_color ?? "black";
  const myPen = penOf(me!);
  const fontPx = TEXT_SIZE_PX[prefs.size];
  const paged = prefs.view === "page";

  async function unlock(paragraphIndex: number) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { error } = await supabase
      .from("unlocks")
      .upsert(
        { room_id: room.id, paragraph_index: paragraphIndex },
        { onConflict: "room_id,user_id,paragraph_index", ignoreDuplicates: true },
      );
    if (error) return `메모를 열지 못했어요. 다시 눌러 주세요. (${error.message})`;
    setUnlocked((prev) => new Set(prev).add(paragraphIndex));
    return null;
  }

  function jumpTo(i: number, open: boolean) {
    movePosition(i);
    if (open) setOpenIndex(i);
    if (!paged) {
      requestAnimationFrame(() =>
        document.querySelector(`[data-p="${i}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" }),
      );
    }
  }

  // 책 머리: 제목, 함께 읽는 사람, 참여 코드, 이어 읽기·새 메모 안내
  const header = () => (
    <header className="px-5 pb-4 sm:px-8">
      <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">{room.book.title}</h1>
      <p className="mt-2 text-[15px] text-pencil">
        {room.book.author}
        {room.book.year ? `, ${room.book.year}년` : ""}
      </p>

      {together ? (
        <div className="mt-6">
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-[14px] text-pencil">이 방에서 함께 읽는 사람</span>
            {members.map((m) => (
              <span key={m.user_id} className={`font-hand text-[22px] leading-none ${PEN[m.pen_color].className}`}>
                {m.alias}
                {m.user_id === me ? " (나)" : ""}
              </span>
            ))}
            {members.length < ROOM_SIZE && (
              <span className="text-[14px] text-pencil">빈자리 {ROOM_SIZE - members.length}</span>
            )}
          </p>
          {room.is_private && room.invite_code && (
            <InviteCode
              code={room.invite_code}
              note={
                members.length < ROOM_SIZE
                  ? "친구에게 이 코드를 보내면 같은 방에서 읽을 수 있어요 (최대 3명)."
                  : "방이 다 찼어요."
              }
            />
          )}
          <p className="mt-3 text-[14px] leading-relaxed text-pencil">
            문단을 누르면 여백에 메모를 남길 수 있어요. 다른 사람의 메모는 그 문단에 내 메모를 먼저 남기면 열려요.
            문장을 길게 눌러 고르면 내 펜 색으로 밑줄을 그을 수 있어요.
          </p>
          <div className="mt-1 text-right">
            <LeaveRoomButton roomId={room.id} together />
          </div>
        </div>
      ) : (
        <p className="mt-6 text-[14px] leading-relaxed text-pencil">
          문단을 누르면 여백에 메모를 남길 수 있어요. 문장을 길게 눌러 고르면 밑줄을 그을 수 있어요. 메모와 밑줄은 나만 봐요.
        </p>
      )}

      {newParagraphs.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink px-4 py-3">
          <span className="text-[15px] text-ink">마지막으로 본 뒤 새 메모가 {newParagraphs.length}곳에 있어요</span>
          <button
            type="button"
            onClick={() => jumpTo(newParagraphs.find((p) => p > position) ?? newParagraphs[0], true)}
            className="h-9 rounded-full bg-ink px-4 text-[14px] text-page"
          >
            새 메모로 가기
          </button>
        </div>
      )}
      {resumedFrom !== null && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[14px] text-pencil">
          <span>지난번 읽던 곳({resumedFrom + 1}번째 문단)부터 보여 드려요.</span>
          <button
            type="button"
            onClick={() => {
              setResumedFrom(null);
              jumpTo(0, false);
              if (!paged) window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="h-9 text-ink underline underline-offset-4"
          >
            처음부터 읽기
          </button>
        </div>
      )}
    </header>
  );

  // 문단 한 줄: 본문 + 오른쪽 여백의 메모 개수 (+ 열렸을 때 메모 창)
  const paragraph = (i: number, measuring: boolean) => {
    const text = room.book.paragraphs[i];
    const tops = topsByParagraph.get(i) ?? [];
    const mine = tops.some((n) => n.user_id === me);
    const blind = together && tops.length > 0 && !mine && !unlocked.has(i);
    const open = !measuring && openIndex === i;
    const hasNew = !measuring && newParagraphs.includes(i);
    // 블라인드인 문단에서는 남의 밑줄도 가린다
    const paraHighlights = highlights.filter((h) => h.paragraph_index === i);
    const visibleHighlights = blind ? paraHighlights.filter((h) => h.user_id === me) : paraHighlights;
    return (
      <li key={i} data-p={measuring ? undefined : i} className="scroll-mt-20 pl-4 sm:pl-6">
        <div className="grid grid-cols-[1fr_3rem] gap-1">
          <p
            data-ptext={measuring ? undefined : i}
            onClick={() => {
              // 문장을 고르는 중(밑줄 긋기)이면 메모 창을 열지 않는다
              if (window.getSelection()?.toString()) return;
              setOpenIndex(open ? null : i);
            }}
            style={{ fontSize: fontPx }}
            className={`-mx-2 cursor-pointer rounded-md px-2 py-3 font-serif leading-[1.95] text-ink [text-wrap:pretty] ${
              open ? "bg-rule/35" : ""
            }`}
          >
            <HighlightedText text={text} highlights={visibleHighlights} penOf={penOf} />
          </p>
          <button
            type="button"
            tabIndex={measuring ? -1 : 0}
            aria-expanded={open}
            aria-label={
              tops.length === 0
                ? `${i + 1}번째 문단에 메모 쓰기`
                : blind
                  ? `${i + 1}번째 문단 숨겨진 메모 ${tops.length}개${hasNew ? ", 새 메모 있음" : ""}`
                  : `${i + 1}번째 문단 메모 ${tops.length}개 보기${hasNew ? ", 새 메모 있음" : ""}`
            }
            onClick={() => setOpenIndex(open ? null : i)}
            className="relative flex justify-center pt-3"
          >
            {tops.length === 0 ? (
              <span className={`font-hand text-[24px] leading-none ${open ? "text-pencil" : "text-rule"}`}>+</span>
            ) : blind ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-pencil font-hand text-[24px] leading-none text-pencil">
                {tops.length}
              </span>
            ) : (
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-current font-hand text-[24px] leading-none ${PEN[penOf(tops[tops.length - 1].user_id)].className}`}
              >
                {tops.length}
              </span>
            )}
            {hasNew && <span className="absolute right-0.5 top-2 h-2.5 w-2.5 rounded-full bg-ink ring-2 ring-page" />}
          </button>
        </div>
        {open && (
          <NotePanel
            roomId={room.id}
            paragraphIndex={i}
            together={together}
            blind={blind}
            tops={tops}
            repliesByParent={repliesByParent}
            penOf={penOf}
            myPen={myPen}
            isNew={isNew}
            underlines={
              <MyUnderlines
                text={text}
                mine={paraHighlights.filter((h) => h.user_id === me)}
                onDeleted={(id) => setHighlights((prev) => prev.filter((h) => h.id !== id))}
              />
            }
            onAdded={(n) => setNotes((prev) => [...prev, n])}
            onUnlock={() => unlock(i)}
            onClose={() => setOpenIndex(null)}
          />
        )}
      </li>
    );
  };

  const list = (children: React.ReactNode) => <ol className="ml-5 border-l-2 border-margin sm:ml-8">{children}</ol>;
  const endOfBook = () => (
    <>
      <EndOfBook
        roomId={room.id}
        together={together}
        me={me!}
        myPen={myPen}
        penOf={penOf}
        letters={letters}
        onSent={(l) => setLetters((prev) => [...prev, l])}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-6 sm:px-8">
        <p className="text-[13px] leading-relaxed text-pencil">{room.book.source}</p>
        <LeaveRoomButton roomId={room.id} together={together} />
      </div>
    </>
  );
  const underlineBar = (
    <UnderlineBar
      roomId={room.id}
      myPen={myPen}
      bottomOffset={paged ? 84 : 16}
      onAdded={(h) => setHighlights((prev) => [...prev, h])}
    />
  );

  if (paged) {
    return (
      <main className="mx-auto flex h-dvh w-full max-w-[640px] flex-col">
        <Nav pen={myPen} />
        <Paged
          itemCount={room.book.paragraphs.length + 1}
          renderItem={(item, measuring) => (item === 0 ? header() : paragraph(item - 1, measuring))}
          renderList={list}
          renderFooter={endOfBook}
          measureKey={`${prefs.size}|${members.length}|${room.invite_code ?? ""}|${together}|${newParagraphs.length}|${resumedFrom}|${letters.length}`}
          anchorItem={position === 0 ? 0 : position + 1}
          onAnchorChange={(item) => {
            setOpenIndex(null);
            movePosition(Math.max(0, item - 1));
          }}
        />
        {underlineBar}
      </main>
    );
  }

  return (
    <Shell pen={myPen}>
      <div className="pt-10">{header()}</div>
      <ScrollPosition onChange={movePosition} start={resumedFrom} />
      <article className="mt-2 bg-page py-6">{list(room.book.paragraphs.map((_, i) => paragraph(i, false)))}</article>
      {endOfBook()}
      {underlineBar}
    </Shell>
  );
}

// 7-4 스크롤 모드에서 보고 있는 문단을 기억하고, 들어올 때 그 문단으로 이동
function ScrollPosition({ onChange, start }: { onChange: (p: number) => void; start: number | null }) {
  const restored = useRef(false);
  useEffect(() => {
    if (!restored.current && start !== null) {
      restored.current = true;
      document.querySelector(`[data-p="${start}"]`)?.scrollIntoView({ block: "start" });
    }
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const items = document.querySelectorAll<HTMLElement>("[data-p]");
        for (const el of items) {
          if (el.getBoundingClientRect().bottom > 90) {
            onChange(Number(el.dataset.p));
            break;
          }
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onChange, start]);
  return null;
}

function Nav({ pen }: { pen?: PenColor }) {
  return (
    <nav className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-rule bg-paper/95 px-5 py-2 backdrop-blur sm:px-8">
      <Link href="/" className="py-2 text-[15px] text-pencil">
        홈으로
      </Link>
      <div className="flex items-center gap-3">
        {pen && <PenChip color={pen} />}
        <ReaderSettingsButton />
      </div>
    </nav>
  );
}

function Shell({ children, pen }: { children: React.ReactNode; pen?: PenColor }) {
  return (
    <main className="mx-auto w-full max-w-[640px] pb-24">
      <Nav pen={pen} />
      {children}
    </main>
  );
}

function ReaderSkeleton() {
  return (
    <div aria-label="방을 불러오는 중" className="px-5 pt-10 sm:px-8">
      <div className="h-8 w-48 rounded-sm bg-rule/60" />
      <div className="mt-3 h-4 w-28 rounded-sm bg-rule/40" />
      <div className="mt-10 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 rounded-sm bg-rule/30" />
        ))}
      </div>
    </div>
  );
}
