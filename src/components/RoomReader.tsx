"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { PEN, PenChip, type PenColor } from "./PenChip";

// 1-10 리더 + 3-3~3-5 문단 메모 (PRD #4.1)
// 방·멤버·메모는 RLS 때문에 이 브라우저의 익명 세션으로만 읽을 수 있어 클라이언트에서 불러온다.

const NOTE_MAX = 300;

type Room = {
  id: string;
  mode: "solo" | "together";
  book: {
    title: string;
    author: string;
    year: number | null;
    source: string;
    paragraphs: string[];
  };
};
type Member = { user_id: string; pen_color: PenColor; alias: string };
type Note = {
  id: string;
  user_id: string;
  paragraph_index: number;
  parent_id: string | null;
  body: string;
  created_at: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; room: Room; members: Member[] };

export function RoomReader({ roomId }: { roomId: string }) {
  const session = useAnonymousSession();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [notes, setNotes] = useState<Note[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { status: "error", message: "Supabase 연결 정보가 없어요." } as const;

    const roomRes = await supabase
      .from("rooms")
      .select("id, mode, book:books(title, author, year, source, paragraphs)")
      .eq("id", roomId)
      .maybeSingle();
    if (roomRes.error) {
      // 방 id 모양이 아니면(uuid가 아니면) 없는 방으로 본다
      if (roomRes.error.code === "22P02") return { status: "missing" } as const;
      return { status: "error", message: roomRes.error.message } as const;
    }
    if (!roomRes.data) return { status: "missing" } as const;

    const [membersRes, notesRes] = await Promise.all([
      supabase.from("room_members").select("user_id, pen_color, alias").eq("room_id", roomId),
      supabase
        .from("notes")
        .select("id, user_id, paragraph_index, parent_id, body, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true }),
    ]);
    const err = membersRes.error ?? notesRes.error;
    if (err) return { status: "error", message: err.message } as const;

    return {
      status: "ready",
      room: roomRes.data as unknown as Room,
      members: (membersRes.data ?? []) as Member[],
      notes: (notesRes.data ?? []) as Note[],
    } as const;
  }, [roomId]);

  useEffect(() => {
    if (session.status !== "ready") return;
    let cancelled = false;
    load().then((res) => {
      if (cancelled) return;
      if (res.status === "ready") {
        setState({ status: "ready", room: res.room, members: res.members });
        setNotes(res.notes);
      } else {
        setState(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session.status, load]);

  const notesByParagraph = useMemo(() => {
    const map = new Map<number, Note[]>();
    for (const n of notes) {
      if (n.parent_id) continue; // 답글은 4단계에서
      const list = map.get(n.paragraph_index) ?? [];
      list.push(n);
      map.set(n.paragraph_index, list);
    }
    return map;
  }, [notes]);

  if (session.status === "error") {
    return <Shell>{null}</Shell>;
  }
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
        <div className="px-5 pt-12 sm:px-8">
          <h1 className="font-serif text-[24px] text-ink">들어갈 수 없는 방이에요</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-pencil">
            없는 방이거나, 이 브라우저의 내가 들어간 방이 아니에요. 홈의 책장에서 책을 골라 읽기를 시작해 주세요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[15px] text-page"
          >
            홈으로 가기
          </Link>
        </div>
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
  const penOf = (userId: string): PenColor =>
    members.find((m) => m.user_id === userId)?.pen_color ?? "black";
  const myPen = session.userId ? penOf(session.userId) : "black";

  return (
    <Shell pen={myPen}>
      <header className="px-5 pt-10 sm:px-8">
        <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">
          {room.book.title}
        </h1>
        <p className="mt-2 text-[15px] text-pencil">
          {room.book.author}
          {room.book.year ? `, ${room.book.year}년` : ""}
        </p>
        <p className="mt-6 text-[14px] leading-relaxed text-pencil">
          {room.mode === "solo"
            ? "문단을 누르면 여백에 메모를 남길 수 있어요. 메모는 나만 봐요."
            : "문단을 누르면 여백에 메모를 남길 수 있어요."}
        </p>
      </header>

      {/* 1-11 고운바탕 18px / 1.95, 붉은 여백선 오른쪽에 본문, 오른쪽 여백에 메모 개수 */}
      <article className="mt-6 bg-page py-6">
        <ol className="ml-5 border-l-2 border-margin sm:ml-8">
          {room.book.paragraphs.map((text, i) => {
            const list = notesByParagraph.get(i) ?? [];
            const open = openIndex === i;
            return (
              <li key={i} className="pl-4 sm:pl-6">
                <div className="grid grid-cols-[1fr_3rem] gap-1">
                  <p
                    onClick={() => setOpenIndex(open ? null : i)}
                    className={`cursor-pointer py-3 font-serif text-[18px] leading-[1.95] text-ink [text-wrap:pretty] ${
                      open ? "underline decoration-pen-blue/40 decoration-2 underline-offset-[6px]" : ""
                    }`}
                  >
                    {text}
                  </p>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-label={list.length ? `${i + 1}번째 문단 메모 ${list.length}개 보기` : `${i + 1}번째 문단에 메모 쓰기`}
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex justify-center pt-3"
                  >
                    {list.length > 0 ? (
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-current font-hand text-[24px] leading-none ${PEN[penOf(list[list.length - 1].user_id)].className}`}
                      >
                        {list.length}
                      </span>
                    ) : (
                      <span className={`font-hand text-[24px] leading-none ${open ? "text-pencil" : "text-rule"}`}>
                        +
                      </span>
                    )}
                  </button>
                </div>
                {open && (
                  <NotePanel
                    roomId={room.id}
                    paragraphIndex={i}
                    notes={list}
                    penOf={penOf}
                    myPen={myPen}
                    onAdded={(n) => setNotes((prev) => [...prev, n])}
                    onClose={() => setOpenIndex(null)}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </article>

      <p className="px-5 pt-6 text-[13px] leading-relaxed text-pencil sm:px-8">{room.book.source}</p>
    </Shell>
  );
}

function Shell({ children, pen }: { children: React.ReactNode; pen?: PenColor }) {
  return (
    <main className="mx-auto w-full max-w-[640px] pb-24">
      <nav className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-paper/95 px-5 py-3 backdrop-blur sm:px-8">
        <Link href="/" className="py-2 text-[15px] text-pencil">
          홈으로
        </Link>
        {pen && <PenChip color={pen} />}
      </nav>
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

const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Seoul",
});

// 3-3 메모 입력창(300자) + 3-4 저장 + 3-5 그 문단의 메모 목록
function NotePanel({
  roomId,
  paragraphIndex,
  notes,
  penOf,
  myPen,
  onAdded,
  onClose,
}: {
  roomId: string;
  paragraphIndex: number;
  notes: Note[];
  penOf: (userId: string) => PenColor;
  myPen: PenColor;
  onAdded: (n: Note) => void;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("notes")
      .insert({ room_id: roomId, paragraph_index: paragraphIndex, body: text })
      .select("id, user_id, paragraph_index, parent_id, body, created_at")
      .single();
    setSaving(false);
    if (error || !data) {
      setError(`메모를 남기지 못했어요. 다시 눌러 주세요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    onAdded(data as Note);
    setBody("");
  }

  return (
    <div className="mb-4 mr-3 border-t border-dashed border-rule pt-4">
      {notes.length > 0 && (
        <ul className="space-y-4">
          {notes.map((n) => (
            <li key={n.id}>
              <p className={`whitespace-pre-wrap font-hand text-[24px] leading-[1.25] ${PEN[penOf(n.user_id)].className}`}>
                {n.body}
              </p>
              <p className="mt-1 text-[12px] text-pencil">
                {PEN[penOf(n.user_id)].label}, {timeFormat.format(new Date(n.created_at))}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={save} className={notes.length > 0 ? "mt-5" : ""}>
        <label htmlFor={`note-${paragraphIndex}`} className="sr-only">
          {paragraphIndex + 1}번째 문단에 메모
        </label>
        <textarea
          id={`note-${paragraphIndex}`}
          autoFocus
          value={body}
          maxLength={NOTE_MAX}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="이 문단에서 떠오른 생각을 적어 보세요."
          className={`block w-full resize-y rounded-sm border border-rule bg-page px-3 py-2 font-hand text-[22px] leading-[1.3] placeholder:font-sans placeholder:text-[15px] placeholder:text-pencil/70 focus:border-ink focus:outline-none ${PEN[myPen].className}`}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[13px] tabular-nums text-pencil">
            {body.length} / {NOTE_MAX}자
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-10 px-3 text-[14px] text-pencil">
              닫기
            </button>
            <button
              type="submit"
              disabled={saving || body.trim().length === 0}
              className="h-10 rounded-full bg-ink px-5 text-[14px] text-page disabled:opacity-40 active:translate-y-px"
            >
              {saving ? "남기는 중…" : "메모 남기기"}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-[14px] text-pen-orange">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
