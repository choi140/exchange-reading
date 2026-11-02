"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { getLastSeen, getReadingPosition, setLastSeen, setReadingPosition, TEXT_SIZE_PX, usePrefs } from "@/lib/prefs";
import { useReadingLog } from "@/lib/reading-log";
import { useAnonymousSession } from "./AnonymousSession";
import { InviteCode } from "./CodeJoinForm";
import { NotAllowed } from "./NotAllowed";
import { PEN, PenChip, type PenColor } from "./PenChip";
import { BookPager } from "./reader/BookPager";
import { EndOfBook, LeaveRoomButton, LETTER_COLUMNS, type Letter } from "./reader/EndOfBook";
import { HighlightSheet, REPLY_COLUMNS, type Reply } from "./reader/HighlightSheet";
import { HIGHLIGHT_COLUMNS, HIGHLIGHT_COLUMNS_OLD, HighlightedText, UnderlineBar, type Highlight } from "./reader/Highlights";
import { NEXT_BOOK_COLUMNS, NextBook, type NextBookRow } from "./reader/NextBook";
import { ReaderSettingsButton } from "./reader/ReaderSettings";

// 책 리더 (혼자·함께 공통) (PRD #4.1)
// 4-4 펜 색 · 7-1/9-6 스크롤·책처럼 넘기는 페이지 · 7-2 참여 코드 · 7-4 글자 크기·밤 모드·이어 읽기
// 7-5 새 표시 · 7-6 문장 밑줄 · 7-7 편지 · 7-8 나가기
// 9-7 문단 메모 대신 "밑줄에 한마디": 밑줄을 누르면 한마디·답글. 블라인드는 문단 단위(그 문단에 내 밑줄이 있거나 그냥 보기).
// 방·멤버·밑줄은 RLS 때문에 이 브라우저의 익명 세션으로만 읽을 수 있어 클라이언트에서 불러온다.

const ROOM_SIZE = 3;

type Mode = "solo" | "together";
type Room = {
  id: string;
  mode: Mode;
  is_private: boolean;
  invite_code: string | null;
  book_id: string;
  book: { title: string; author: string; year: number | null; source: string; paragraphs: string[] };
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
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set());
  const [letters, setLetters] = useState<Letter[]>([]);
  const [memoReady, setMemoReady] = useState(true); // 10_v6.sql을 실행했는지
  const [nextReady, setNextReady] = useState(false); // 14_v9.sql을 실행했는지
  const [next, setNext] = useState<NextBookRow | null>(null);
  const [shelf, setShelf] = useState<{ id: string; title: string }[]>([]);
  const { start: startReading, move: moveReading } = useReadingLog(roomId);
  const [sheetIds, setSheetIds] = useState<string[] | null>(null);
  const [seenBefore, setSeenBefore] = useState<string | null>(null);
  // 지금 보는 문단 (-1 = 책 머리)
  const [position, setPosition] = useState(-1);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);
  const [jump, setJump] = useState({ p: -1, n: 0 });

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { status: "error", message: "Supabase 연결 정보가 없어요." } as const;

    const roomRes = await supabase
      .from("rooms")
      .select("id, mode, is_private, invite_code, book_id, book:books(title, author, year, source, paragraphs)")
      .eq("id", roomId)
      .maybeSingle();
    if (roomRes.error) {
      if (roomRes.error.code === "22P02") return { status: "missing" } as const;
      return { status: "error", message: roomRes.error.message } as const;
    }
    if (!roomRes.data) return { status: "missing" } as const;

    const [membersRes, unlocksRes, lettersRes, repliesRes, nextRes, shelfRes] = await Promise.all([
      supabase.from("room_members").select("user_id, pen_color, alias").eq("room_id", roomId).order("joined_at"),
      supabase.from("unlocks").select("paragraph_index").eq("room_id", roomId),
      supabase.from("letters").select(LETTER_COLUMNS).eq("room_id", roomId).order("created_at", { ascending: true }),
      supabase.from("highlight_replies").select(REPLY_COLUMNS).eq("room_id", roomId).order("created_at", { ascending: true }),
      supabase.from("room_next").select(NEXT_BOOK_COLUMNS).eq("room_id", roomId),
      supabase.from("books").select("id, title"),
    ]);
    type Rows = { data: unknown[] | null; error: { code?: string; message: string } | null };
    let hlRes: Rows = await supabase.from("highlights").select(HIGHLIGHT_COLUMNS).eq("room_id", roomId).order("created_at", { ascending: true });
    let memo = true;
    if (hlRes.error?.code === "42703") {
      memo = false; // memo 칸이 아직 없다
      hlRes = await supabase.from("highlights").select(HIGHLIGHT_COLUMNS_OLD).eq("room_id", roomId).order("created_at", { ascending: true });
    }
    const err = membersRes.error ?? unlocksRes.error;
    if (err) return { status: "error", message: err.message } as const;

    return {
      status: "ready",
      room: roomRes.data as unknown as Room,
      members: (membersRes.data ?? []) as Member[],
      unlocked: new Set((unlocksRes.data ?? []).map((u) => u.paragraph_index as number)),
      highlights: (hlRes.error ? [] : (hlRes.data ?? [])) as Highlight[],
      replies: (repliesRes.error ? [] : (repliesRes.data ?? [])) as Reply[],
      letters: (lettersRes.error ? [] : (lettersRes.data ?? [])) as Letter[],
      memo: memo && !repliesRes.error,
      nextReady: !nextRes.error,
      next: ((nextRes.data ?? [])[0] ?? null) as NextBookRow | null,
      shelf: (shelfRes.data ?? []) as { id: string; title: string }[],
    } as const;
  }, [roomId]);

  const refreshNext = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data, error } = await supabase.from("room_next").select(NEXT_BOOK_COLUMNS).eq("room_id", roomId);
    if (!error) setNext(((data ?? [])[0] ?? null) as NextBookRow | null);
  }, [roomId]);

  useEffect(() => {
    if (session.status !== "ready") return;
    let cancelled = false;
    load().then((res) => {
      if (cancelled) return;
      if (res.status !== "ready") {
        setState(res);
        return;
      }
      const saved = getReadingPosition(roomId);
      const max = res.room.book.paragraphs.length - 1;
      const start = saved !== null && saved > 0 ? Math.min(saved, max) : -1;
      setSeenBefore(getLastSeen(roomId));
      setLastSeen(roomId, new Date().toISOString());
      setPosition(start);
      startReading(start);
      setResumedFrom(start > 0 ? start : null);
      setHighlights(res.highlights);
      setReplies(res.replies);
      setUnlocked(res.unlocked);
      setLetters(res.letters);
      setMemoReady(res.memo);
      setNextReady(res.nextReady);
      setNext(res.next);
      setShelf(res.shelf);
      setState({ status: "ready", room: res.room, members: res.members });
    });
    return () => {
      cancelled = true;
    };
  }, [session.status, load, roomId, startReading]);

  const me = session.userId;
  const movePosition = useCallback(
    (p: number) => {
      setPosition(p);
      setReadingPosition(roomId, Math.max(0, p));
      moveReading(p);
    },
    [roomId, moveReading],
  );

  const isNew = useCallback(
    (createdAt: string, userId: string) => seenBefore !== null && userId !== me && createdAt > seenBefore,
    [seenBefore, me],
  );
  // 새로 생긴 남의 밑줄, 또는 새 답글이 달린 밑줄
  const newHighlightIds = useMemo(() => {
    const ids = new Set(highlights.filter((h) => isNew(h.created_at, h.user_id)).map((h) => h.id));
    for (const r of replies) if (isNew(r.created_at, r.user_id)) ids.add(r.highlight_id);
    return ids;
  }, [highlights, replies, isNew]);
  const newList = useMemo(
    () =>
      highlights
        .filter((h) => newHighlightIds.has(h.id))
        .sort((a, b) => a.paragraph_index - b.paragraph_index || a.start_offset - b.start_offset),
    [highlights, newHighlightIds],
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
          desc="없는 방이거나, 이 브라우저의 내가 들어간 방이 아니에요. 교환독서 화면에서 책을 골라 읽기를 시작해 주세요."
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
  const lastParagraph = room.book.paragraphs.length - 1;
  const nextTitle = shelf.find((b) => b.id === next?.book_id)?.title;
  const askedNext = next !== null && !next.next_room_id && !next.agreed.includes(myPen);
  const myParagraphs = new Set(highlights.filter((h) => h.user_id === me).map((h) => h.paragraph_index));
  const isBlind = (h: Highlight) =>
    together && h.user_id !== me && !myParagraphs.has(h.paragraph_index) && !unlocked.has(h.paragraph_index);

  async function unlock(paragraphIndex: number): Promise<string | null> {
    const supabase = getBrowserSupabase();
    if (!supabase) return "Supabase 연결 정보가 없어요.";
    const { error } = await supabase
      .from("unlocks")
      .upsert({ room_id: room.id, paragraph_index: paragraphIndex }, { onConflict: "room_id,user_id,paragraph_index", ignoreDuplicates: true });
    if (error) return `열지 못했어요. 다시 눌러 주세요. (${error.message})`;
    setUnlocked((prev) => new Set(prev).add(paragraphIndex));
    return null;
  }

  function goTo(p: number) {
    movePosition(p);
    if (paged) setJump((j) => ({ p, n: j.n + 1 }));
    else if (p < 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else document.querySelector(`[data-p="${p}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const header = (
    <header data-flow-block className="pb-6" style={paged ? { breakAfter: "column" } : undefined}>
      <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">{room.book.title}</h1>
      <p className="mt-2 text-[15px] text-pencil">
        {room.book.author}
        {room.book.year ? `, ${room.book.year}년` : ""}
      </p>

      {together && (
        <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-[14px] text-pencil">이 방에서 함께 읽는 사람</span>
          {members.map((m) => (
            <span key={m.user_id} className={`font-hand text-[22px] leading-none ${PEN[m.pen_color].className}`}>
              {m.alias}
              {m.user_id === me ? " (나)" : ""}
            </span>
          ))}
          {/* 12-1 다음 책 방은 코드가 없어 새 사람이 들어올 수 없다 */}
          {members.length < ROOM_SIZE && (!room.is_private || room.invite_code) && (
            <span className="text-[14px] text-pencil">빈자리 {ROOM_SIZE - members.length}</span>
          )}
        </p>
      )}
      {together && room.is_private && room.invite_code && (
        <InviteCode
          code={room.invite_code}
          note={members.length < ROOM_SIZE ? "친구에게 이 코드를 보내면 같은 방에서 읽을 수 있어요 (최대 3명)." : "방이 다 찼어요."}
        />
      )}
      <p className="mt-4 text-[14px] leading-relaxed text-pencil">
        마음에 드는 문장을 길게 눌러 고르면 {PEN[myPen].label}으로 밑줄을 그어요{memoReady ? ". 밑줄에 한마디를 붙일 수도 있어요" : ""}.
        {together
          ? " 다른 사람의 밑줄을 누르면 한마디와 답글이 보여요. 그 문단에 내 밑줄을 먼저 그어야 열려요."
          : " 밑줄은 나만 봐요."}
      </p>

      {next?.next_room_id ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink px-4 py-3">
          <span className="text-[15px] text-ink">같은 사람들과 다음 책을 읽기로 했어요</span>
          <Link href={`/room/${next.next_room_id}`} className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[14px] text-page">
            「{nextTitle}」 읽으러 가기
          </Link>
        </div>
      ) : (
        askedNext && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink px-4 py-3">
            <span className="text-[15px] text-ink">다음 책 제안이 있어요: 「{nextTitle}」</span>
            <button type="button" onClick={() => goTo(lastParagraph)} className="h-9 rounded-full bg-ink px-4 text-[14px] text-page">
              책 끝에서 답하기
            </button>
          </div>
        )
      )}
      {newList.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink px-4 py-3">
          <span className="text-[15px] text-ink">마지막으로 본 뒤 새 밑줄·답글 {newList.length}곳</span>
          <button
            type="button"
            onClick={() => {
              const target = newList.find((h) => h.paragraph_index > position) ?? newList[0];
              goTo(target.paragraph_index);
              setSheetIds([target.id]);
            }}
            className="h-9 rounded-full bg-ink px-4 text-[14px] text-page"
          >
            새 밑줄로 가기
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
              goTo(-1);
            }}
            className="h-9 text-ink underline underline-offset-4"
          >
            처음부터 읽기
          </button>
        </div>
      )}
      {together && (
        <div className="mt-2 text-right">
          <LeaveRoomButton roomId={room.id} together />
        </div>
      )}
    </header>
  );

  // 9-6 본문: 문단 사이 빈 줄 없이 첫 줄 들여쓰기로 이어지는 책 모양
  const body = room.book.paragraphs.map((text, i) => (
    <p
      key={i}
      data-p={i}
      data-ptext={i}
      style={{ fontSize: fontPx, textIndent: "1em" }}
      className="scroll-mt-24 font-serif leading-[1.95] text-ink [text-wrap:pretty]"
    >
      <HighlightedText
        text={text}
        highlights={highlights.filter((h) => h.paragraph_index === i)}
        penOf={penOf}
        newIds={newHighlightIds}
        onOpen={setSheetIds}
      />
    </p>
  ));

  const endOfBook = (
    <div data-flow-block style={paged ? { breakBefore: "column" } : undefined}>
      <EndOfBook
        roomId={room.id}
        together={together}
        me={me!}
        myPen={myPen}
        penOf={penOf}
        letters={letters}
        onSent={(l) => setLetters((prev) => [...prev, l])}
      />
      {together && nextReady && (members.length > 1 || next) && (
        <NextBook
          roomId={room.id}
          myPen={myPen}
          books={shelf.filter((b) => b.id !== room.book_id)}
          next={next}
          onRefresh={refreshNext}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <p className="text-[13px] leading-relaxed text-pencil">{room.book.source}</p>
        <LeaveRoomButton roomId={room.id} together={together} />
      </div>
    </div>
  );

  const sheetItems = sheetIds ? highlights.filter((h) => sheetIds.includes(h.id)) : [];
  const overlays = (
    <>
      <UnderlineBar
        roomId={room.id}
        myPen={myPen}
        bottomOffset={paged ? 84 : 16}
        withMemo={memoReady}
        onAdded={(h) => setHighlights((prev) => [...prev, h])}
      />
      <HighlightSheet
        open={sheetItems.length > 0}
        onClose={() => setSheetIds(null)}
        roomId={room.id}
        together={together}
        me={me!}
        penOf={penOf}
        paragraphs={room.book.paragraphs}
        items={sheetItems}
        replies={replies}
        isBlind={isBlind}
        isNew={isNew}
        onUnlock={unlock}
        onDeleted={(id) => {
          setHighlights((prev) => prev.filter((h) => h.id !== id));
          setReplies((prev) => prev.filter((r) => r.highlight_id !== id));
        }}
        onReplyAdded={(r) => setReplies((prev) => [...prev, r])}
        onReplyDeleted={(id) => setReplies((prev) => prev.filter((r) => r.id !== id))}
      />
    </>
  );

  if (paged) {
    return (
      <main className="mx-auto flex h-dvh w-full max-w-[680px] flex-col">
        <Nav pen={myPen} />
        <BookPager
          layoutKey={`${prefs.size}|${members.length}|${room.invite_code ?? ""}|${newList.length > 0}|${resumedFrom}|${letters.length}|${next?.book_id}|${next?.agreed.length}|${next?.next_room_id}`}
          anchor={position}
          jump={jump}
          onAnchorChange={movePosition}
        >
          {header}
          {body}
          {endOfBook}
        </BookPager>
        {overlays}
      </main>
    );
  }

  return (
    <Shell pen={myPen}>
      <div className="px-5 pt-10 sm:px-8">{header}</div>
      <ScrollPosition onChange={movePosition} start={resumedFrom} />
      <article className="mx-5 border-l-2 border-margin bg-page py-6 pl-4 pr-3 sm:mx-8 sm:pl-6">{body}</article>
      <div className="px-5 pt-8 sm:px-8">{endOfBook}</div>
      {overlays}
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
        for (const el of document.querySelectorAll<HTMLElement>("[data-p]")) {
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
      <Link href="/read" className="py-2 text-[15px] text-pencil">
        ‹ 교환독서
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
    <main className="mx-auto w-full max-w-[680px] pb-24">
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
