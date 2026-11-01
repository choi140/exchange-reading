"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { InviteCode } from "./CodeJoinForm";
import { NotAllowed } from "./NotAllowed";
import { PEN, PenChip, type PenColor } from "./PenChip";

// 책 리더 (혼자·함께 공통) (PRD #4.1)
// 1-10 리더 · 3-3~3-5 문단 메모 · 4-4 펜 색 표시 · 4-5 블라인드 · 4-6 그냥 보기 · 4-7 답글 · 4-8 mode 분기
// 방·멤버·메모는 RLS 때문에 이 브라우저의 익명 세션으로만 읽을 수 있어 클라이언트에서 불러온다.

const NOTE_MAX = 300;
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

const NOTE_COLUMNS = "id, user_id, paragraph_index, parent_id, body, created_at";

export function RoomReader({ roomId }: { roomId: string }) {
  const session = useAnonymousSession();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [notes, setNotes] = useState<Note[]>([]);
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set());
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

    const [membersRes, notesRes, unlocksRes] = await Promise.all([
      supabase.from("room_members").select("user_id, pen_color, alias").eq("room_id", roomId).order("joined_at"),
      supabase.from("notes").select(NOTE_COLUMNS).eq("room_id", roomId).order("created_at", { ascending: true }),
      supabase.from("unlocks").select("paragraph_index").eq("room_id", roomId),
    ]);
    const err = membersRes.error ?? notesRes.error ?? unlocksRes.error;
    if (err) return { status: "error", message: err.message } as const;

    return {
      status: "ready",
      room: roomRes.data as unknown as Room,
      members: (membersRes.data ?? []) as Member[],
      notes: (notesRes.data ?? []) as Note[],
      unlocked: new Set((unlocksRes.data ?? []).map((u) => u.paragraph_index as number)),
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
        setUnlocked(res.unlocked);
      } else {
        setState(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session.status, load]);

  // 문단별 메모(답글 제외)와 메모별 답글
  const { topsByParagraph, repliesByParent } = useMemo(() => {
    const tops = new Map<number, Note[]>();
    const replies = new Map<string, Note[]>();
    for (const n of notes) {
      if (n.parent_id) {
        replies.set(n.parent_id, [...(replies.get(n.parent_id) ?? []), n]);
      } else {
        tops.set(n.paragraph_index, [...(tops.get(n.paragraph_index) ?? []), n]);
      }
    }
    return { topsByParagraph: tops, repliesByParent: replies };
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
  const me = session.userId!;
  const together = room.mode === "together";
  const penOf = (userId: string): PenColor =>
    members.find((m) => m.user_id === userId)?.pen_color ?? "black";
  const myPen = penOf(me);

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

  return (
    <Shell pen={myPen}>
      <header className="px-5 pt-10 sm:px-8">
        <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">{room.book.title}</h1>
        <p className="mt-2 text-[15px] text-pencil">
          {room.book.author}
          {room.book.year ? `, ${room.book.year}년` : ""}
        </p>

        {together ? (
          <div className="mt-6">
            {/* 4-4 이 방 사람들: 펜 색과 별명으로만 구분 */}
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
                note={members.length < ROOM_SIZE ? "친구에게 이 코드를 보내면 같은 방에서 읽을 수 있어요 (최대 3명)." : "방이 다 찼어요."}
              />
            )}
            <p className="mt-3 text-[14px] leading-relaxed text-pencil">
              문단을 누르면 여백에 메모를 남길 수 있어요. 다른 사람의 메모는 그 문단에 내 메모를 먼저 남기면 열려요.
            </p>
          </div>
        ) : (
          <p className="mt-6 text-[14px] leading-relaxed text-pencil">
            문단을 누르면 여백에 메모를 남길 수 있어요. 메모는 나만 봐요.
          </p>
        )}
      </header>

      {/* 1-11 고운바탕 18px / 1.95, 붉은 여백선 오른쪽에 본문, 오른쪽 여백에 메모 개수 */}
      <article className="mt-6 bg-page py-6">
        <ol className="ml-5 border-l-2 border-margin sm:ml-8">
          {room.book.paragraphs.map((text, i) => {
            const tops = topsByParagraph.get(i) ?? [];
            const mine = tops.some((n) => n.user_id === me);
            // 4-5 블라인드: 함께 방에서, 내 메모도 그냥 보기 기록도 없으면 남의 메모를 가린다
            const blind = together && tops.length > 0 && !mine && !unlocked.has(i);
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
                    aria-label={
                      tops.length === 0
                        ? `${i + 1}번째 문단에 메모 쓰기`
                        : blind
                          ? `${i + 1}번째 문단 숨겨진 메모 ${tops.length}개`
                          : `${i + 1}번째 문단 메모 ${tops.length}개 보기`
                    }
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex justify-center pt-3"
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
                    onAdded={(n) => setNotes((prev) => [...prev, n])}
                    onUnlock={() => unlock(i)}
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

async function insertNote(fields: {
  room_id: string;
  paragraph_index: number;
  parent_id?: string;
  body: string;
}): Promise<{ note: Note | null; error: string | null }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { note: null, error: "Supabase 연결 정보가 없어요." };
  const { data, error } = await supabase.from("notes").insert(fields).select(NOTE_COLUMNS).single();
  if (error || !data) return { note: null, error: error?.message ?? "응답 없음" };
  return { note: data as Note, error: null };
}

// 3-3 메모 입력창(300자) + 3-4 저장 + 3-5 메모 목록 + 4-5·4-6 블라인드 + 4-7 답글
function NotePanel({
  roomId,
  paragraphIndex,
  together,
  blind,
  tops,
  repliesByParent,
  penOf,
  myPen,
  onAdded,
  onUnlock,
  onClose,
}: {
  roomId: string;
  paragraphIndex: number;
  together: boolean;
  blind: boolean;
  tops: Note[];
  repliesByParent: Map<string, Note[]>;
  penOf: (userId: string) => PenColor;
  myPen: PenColor;
  onAdded: (n: Note) => void;
  onUnlock: () => Promise<string | null | undefined>;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    setError(null);
    const res = await insertNote({ room_id: roomId, paragraph_index: paragraphIndex, body: text });
    setSaving(false);
    if (res.error || !res.note) {
      setError(`메모를 남기지 못했어요. 다시 눌러 주세요. (${res.error})`);
      return;
    }
    onAdded(res.note);
    setBody("");
  }

  return (
    <div className="mb-4 mr-3 border-t border-dashed border-rule pt-4">
      {blind ? (
        <div className="rounded-sm border border-dashed border-pencil/60 px-4 py-4">
          <p className="font-serif text-[17px] text-ink">숨겨진 메모 {tops.length}개</p>
          <p className="mt-1 text-[14px] leading-relaxed text-pencil">
            내 생각을 먼저 남기면 다른 사람의 메모가 열려요. 바로 보고 싶다면 그냥 볼 수도 있어요.
          </p>
          <button
            type="button"
            disabled={unlocking}
            onClick={async () => {
              setUnlocking(true);
              const err = await onUnlock();
              setUnlocking(false);
              if (err) setError(err);
            }}
            className="mt-3 h-10 rounded-full border border-ink px-4 text-[14px] text-ink disabled:opacity-60"
          >
            {unlocking ? "여는 중…" : "그냥 보기"}
          </button>
        </div>
      ) : (
        tops.length > 0 && (
          <ul className="space-y-5">
            {tops.map((n) => (
              <li key={n.id}>
                <NoteBody note={n} penOf={penOf} />
                {together && (
                  <div className="ml-3 mt-2 border-l border-rule pl-3">
                    {(repliesByParent.get(n.id) ?? []).map((r) => (
                      <div key={r.id} className="mb-2">
                        <NoteBody note={r} penOf={penOf} small />
                      </div>
                    ))}
                    {replyTo === n.id ? (
                      <ReplyForm
                        roomId={roomId}
                        paragraphIndex={paragraphIndex}
                        parent={n}
                        myPen={myPen}
                        onAdded={(r) => {
                          onAdded(r);
                          setReplyTo(null);
                        }}
                        onCancel={() => setReplyTo(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReplyTo(n.id)}
                        className="h-8 text-[13px] text-pencil underline underline-offset-4"
                      >
                        답글 달기
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      )}

      <form onSubmit={save} className={tops.length > 0 ? "mt-5" : ""}>
        <label htmlFor={`note-${paragraphIndex}`} className="sr-only">
          {paragraphIndex + 1}번째 문단에 메모
        </label>
        <textarea
          id={`note-${paragraphIndex}`}
          autoFocus={!blind}
          value={body}
          maxLength={NOTE_MAX}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={blind ? "내 메모를 남기면 숨겨진 메모가 열려요." : "이 문단에서 떠오른 생각을 적어 보세요."}
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

function NoteBody({ note, penOf, small }: { note: Note; penOf: (userId: string) => PenColor; small?: boolean }) {
  const pen = PEN[penOf(note.user_id)];
  return (
    <>
      <p
        className={`whitespace-pre-wrap font-hand ${small ? "text-[21px]" : "text-[24px]"} leading-[1.25] ${pen.className}`}
      >
        {note.body}
      </p>
      <p className="mt-1 text-[12px] text-pencil">
        {pen.label}, {timeFormat.format(new Date(note.created_at))}
      </p>
    </>
  );
}

// 4-7 메모 아래 한 단계 답글
function ReplyForm({
  roomId,
  paragraphIndex,
  parent,
  myPen,
  onAdded,
  onCancel,
}: {
  roomId: string;
  paragraphIndex: number;
  parent: Note;
  myPen: PenColor;
  onAdded: (n: Note) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    setError(null);
    const res = await insertNote({
      room_id: roomId,
      paragraph_index: paragraphIndex,
      parent_id: parent.id,
      body: text,
    });
    setSaving(false);
    if (res.error || !res.note) {
      setError(`답글을 남기지 못했어요. 다시 눌러 주세요. (${res.error})`);
      return;
    }
    onAdded(res.note);
  }

  return (
    <form onSubmit={save} className="mt-1">
      <label htmlFor={`reply-${parent.id}`} className="sr-only">
        답글
      </label>
      <textarea
        id={`reply-${parent.id}`}
        autoFocus
        value={body}
        maxLength={NOTE_MAX}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="답글을 적어 보세요."
        className={`block w-full resize-y rounded-sm border border-rule bg-page px-3 py-2 font-hand text-[21px] leading-[1.3] placeholder:font-sans placeholder:text-[14px] placeholder:text-pencil/70 focus:border-ink focus:outline-none ${PEN[myPen].className}`}
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 px-3 text-[13px] text-pencil">
          취소
        </button>
        <button
          type="submit"
          disabled={saving || body.trim().length === 0}
          className="h-9 rounded-full bg-ink px-4 text-[13px] text-page disabled:opacity-40"
        >
          {saving ? "남기는 중…" : "답글 남기기"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-pen-orange">
          {error}
        </p>
      )}
    </form>
  );
}
