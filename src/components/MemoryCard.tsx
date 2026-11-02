"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { NotAllowed } from "./NotAllowed";
import { PEN, type PenColor } from "./PenChip";
import { LETTER_COLUMNS, type Letter } from "./reader/EndOfBook";
import { HIGHLIGHT_COLUMNS, HIGHLIGHT_COLUMNS_OLD, type Highlight } from "./reader/Highlights";

// 10-3 다 읽은 뒤 기념 카드: 함께 그은 밑줄·한마디·편지를 도서관 대출 카드 같은 한 장으로 모아 이미지로 저장·공유

type Room = {
  id: string;
  mode: "solo" | "together";
  book: { id: string; title: string; author: string; year: number | null; paragraphs: string[] };
};
type Member = { user_id: string; pen_color: PenColor; alias: string };

const MAX_QUOTES = 6;
const MAX_LETTERS = 3;
const dateFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Seoul" });

// 카드는 밤 모드와 상관없이 늘 낮 색으로 (저장한 이미지가 같은 모양이 되게)
const DAY_VARS = {
  "--color-paper": "#f7f5ef",
  "--color-page": "#ffffff",
  "--color-ink": "#191919",
  "--color-pencil": "#66635c",
  "--color-rule": "#e3dfd5",
  "--color-margin": "#e3dfd5",
  "--color-pen-black": "#191919",
  "--color-pen-blue": "#2b55c8",
  "--color-pen-green": "#1d7a50",
  "--color-pen-orange": "#d2691e",
} as React.CSSProperties;

export function MemoryCardPage({ roomId }: { roomId: string }) {
  const session = useAnonymousSession();
  const [data, setData] = useState<
    | { status: "loading" }
    | { status: "missing" }
    | { status: "error"; message: string }
    | { status: "ready"; room: Room; members: Member[]; highlights: Highlight[]; letters: Letter[]; replies: number }
  >({ status: "loading" });
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"save" | "share" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session.status !== "ready") return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const roomRes = await supabase
        .from("rooms")
        .select("id, mode, book:books(id, title, author, year, paragraphs)")
        .eq("id", roomId)
        .maybeSingle();
      if (cancelled) return;
      if (roomRes.error) {
        setData(roomRes.error.code === "22P02" ? { status: "missing" } : { status: "error", message: roomRes.error.message });
        return;
      }
      if (!roomRes.data) {
        setData({ status: "missing" });
        return;
      }
      type Rows = { data: unknown[] | null; error: { code?: string; message: string } | null };
      let hl: Rows = await supabase.from("highlights").select(HIGHLIGHT_COLUMNS).eq("room_id", roomId).order("created_at");
      if (hl.error?.code === "42703") hl = await supabase.from("highlights").select(HIGHLIGHT_COLUMNS_OLD).eq("room_id", roomId).order("created_at");
      const [members, letters, replies] = await Promise.all([
        supabase.from("room_members").select("user_id, pen_color, alias").eq("room_id", roomId).order("joined_at"),
        supabase.from("letters").select(LETTER_COLUMNS).eq("room_id", roomId).order("created_at"),
        supabase.from("highlight_replies").select("id", { count: "exact", head: true }).eq("room_id", roomId),
      ]);
      if (cancelled) return;
      setData({
        status: "ready",
        room: roomRes.data as unknown as Room,
        members: (members.data ?? []) as Member[],
        highlights: (hl.error ? [] : (hl.data ?? [])) as Highlight[],
        letters: (letters.error ? [] : (letters.data ?? [])) as Letter[],
        replies: replies.error ? 0 : (replies.count ?? 0),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [session.status, roomId]);

  if (data.status === "missing") {
    return <NotAllowed title="들어갈 수 없는 방이에요" desc="없는 방이거나, 이 브라우저의 내가 들어간 방이 아니에요." />;
  }
  if (data.status === "error") {
    return (
      <p role="alert" className="px-5 pt-12 text-[15px] text-pen-orange">
        기념 카드를 만들지 못했어요. 새로고침해 주세요. ({data.message})
      </p>
    );
  }
  if (data.status === "loading") {
    return <div aria-label="기념 카드를 만드는 중" className="mx-auto mt-10 h-[520px] w-[360px] max-w-full rounded-sm bg-rule/25" />;
  }

  const { room, members, highlights, letters } = data;
  const me = session.userId;
  const penOf = (u: string): PenColor => members.find((m) => m.user_id === u)?.pen_color ?? "black";
  // 한마디가 있는 밑줄을 먼저, 그다음 책 순서대로
  const picked = [...highlights]
    .sort((a, b) => Number(!!b.memo) - Number(!!a.memo) || a.paragraph_index - b.paragraph_index || a.start_offset - b.start_offset)
    .slice(0, MAX_QUOTES)
    .sort((a, b) => a.paragraph_index - b.paragraph_index || a.start_offset - b.start_offset);
  const memoCount = highlights.filter((h) => h.memo).length;
  // 한글 파일 이름은 일부 브라우저에서 "download"로 바뀌어 영문(책 id)으로 짓는다
  const fileName = `natseon-miljul-${room.book.id}.png`;

  async function render() {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
  }

  // 파일 이름이 유지되도록 data: 주소 대신 blob 주소로 내려받는다
  async function download(dataUrl: string) {
    const blob = await (await fetch(dataUrl)).blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10000);
  }

  async function save() {
    setBusy("save");
    setNotice(null);
    try {
      const url = await render();
      if (!url) return;
      await download(url);
      setNotice("이미지로 저장했어요.");
    } catch (e) {
      setNotice(`이미지를 만들지 못했어요. (${(e as Error).message})`);
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    setNotice(null);
    try {
      const url = await render();
      if (!url) return;
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `「${room.book.title}」 기념 카드` });
      } else {
        await download(url);
        setNotice("이 브라우저는 바로 공유를 지원하지 않아서 이미지로 저장했어요. 저장한 이미지를 보내 주세요.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNotice(`공유하지 못했어요. (${(e as Error).message})`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-5 pb-20 pt-6 sm:px-8">
      <Link href={`/room/${room.id}`} className="py-2 text-[15px] text-pencil">
        ‹ 책으로 돌아가기
      </Link>
      <h1 className="mt-4 font-display text-[26px] font-bold text-ink">기념 카드</h1>
      <p className="mt-1 text-[14px] leading-relaxed text-pencil">
        {room.mode === "together" ? "함께 그은 밑줄과 한마디, 편지를 한 장에 모았어요." : "내가 그은 밑줄과 한마디, 편지를 한 장에 모았어요."}{" "}
        한마디가 있는 밑줄을 먼저, 최대 {MAX_QUOTES}개까지 담아요.
      </p>

      {/* 저장되는 카드 */}
      <div className="mt-6 flex justify-center">
        <div ref={cardRef} style={DAY_VARS} className="w-[360px] max-w-full bg-page text-ink">
          <div className="border-l-2 border-margin py-6 pl-5 pr-5">
            <p className="flex items-baseline justify-between gap-3 text-[12px] text-pencil">
              <span className="font-display text-[14px] font-bold text-ink">낯선 밑줄</span>
              <span>{dateFormat.format(new Date())} 다 읽음</span>
            </p>
            <p className="mt-4 font-display text-[28px] font-bold leading-tight">{room.book.title}</p>
            <p className="mt-1 text-[13px] text-pencil">
              {room.book.author}
              {room.book.year ? `, ${room.book.year}년` : ""}
            </p>

            <dl className="mt-4 border-y border-rule text-[12px]">
              <div className="flex items-baseline gap-3 border-b border-rule py-2">
                <dt className="w-16 shrink-0 text-pencil">{room.mode === "together" ? "함께 읽음" : "읽은 사람"}</dt>
                <dd className="flex flex-wrap gap-x-3">
                  {members.map((m) => (
                    <span key={m.user_id} className={`font-hand text-[18px] leading-none ${PEN[m.pen_color].className}`}>
                      {m.alias}
                      {m.user_id === me ? "(나)" : ""}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="flex items-baseline gap-3 py-2">
                <dt className="w-16 shrink-0 text-pencil">남긴 것</dt>
                <dd>
                  밑줄 {highlights.length}개, 한마디 {memoCount}개{room.mode === "together" ? `, 답글 ${data.replies}개` : ""}, 편지 {letters.length}장
                </dd>
              </div>
            </dl>

            {picked.length === 0 ? (
              <p className="mt-5 text-[13px] text-pencil">아직 그은 밑줄이 없어요.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {picked.map((h) => {
                  const pen = PEN[penOf(h.user_id)];
                  const quote = (room.book.paragraphs[h.paragraph_index]?.slice(h.start_offset, h.end_offset) ?? "").trim();
                  return (
                    <li key={h.id} className={`border-l-2 pl-3 ${pen.border}`}>
                      <p className="font-serif text-[14px] leading-[1.7]">“{quote.length > 90 ? `${quote.slice(0, 90)}…` : quote}”</p>
                      {h.memo && <p className={`mt-1 font-hand text-[19px] leading-[1.2] ${pen.className}`}>{h.memo}</p>}
                    </li>
                  );
                })}
              </ul>
            )}

            {letters.length > 0 && (
              <div className="mt-6 border-t border-dashed border-rule pt-4">
                <p className="text-[12px] text-pencil">마지막 장의 편지</p>
                <ul className="mt-2 space-y-3">
                  {letters.slice(0, MAX_LETTERS).map((l) => {
                    const pen = PEN[penOf(l.user_id)];
                    return (
                      <li key={l.id}>
                        <p className={`whitespace-pre-wrap font-hand text-[19px] leading-[1.25] ${pen.className}`}>
                          {l.body.length > 120 ? `${l.body.slice(0, 120)}…` : l.body}
                        </p>
                        <p className="text-[11px] text-pencil">{pen.label}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={save} disabled={busy !== null} className="h-11 rounded-full border border-ink px-5 text-[15px] text-ink disabled:opacity-50">
          {busy === "save" ? "만드는 중…" : "이미지로 저장"}
        </button>
        <button type="button" onClick={share} disabled={busy !== null} className="h-11 rounded-full bg-ink px-5 text-[15px] text-page disabled:opacity-50">
          {busy === "share" ? "만드는 중…" : "공유하기"}
        </button>
      </div>
      <p aria-live="polite" className="mt-3 min-h-6 text-center text-[14px] text-pencil">
        {notice}
      </p>
    </div>
  );
}
