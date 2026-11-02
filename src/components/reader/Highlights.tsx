"use client";

import { useEffect, useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PEN, type PenColor } from "../PenChip";

// 7-6 문장 밑줄 + 9-7 밑줄에 한마디
// 문단 글자 위치(start~end)로 저장하고, 그 사람의 펜 색으로 밑줄을 긋는다. 밑줄을 누르면 한마디·답글이 열린다.

export type Highlight = {
  id: string;
  user_id: string;
  paragraph_index: number;
  start_offset: number;
  end_offset: number;
  memo?: string | null;
  created_at: string;
};
export const HIGHLIGHT_COLUMNS = "id, user_id, paragraph_index, start_offset, end_offset, memo, created_at";
export const HIGHLIGHT_COLUMNS_OLD = "id, user_id, paragraph_index, start_offset, end_offset, created_at";
const MEMO_MAX = 200;

export const PEN_VAR: Record<PenColor, string> = {
  black: "var(--color-pen-black)",
  blue: "var(--color-pen-blue)",
  green: "var(--color-pen-green)",
  orange: "var(--color-pen-orange)",
};

// 본문을 밑줄 구간별로 잘라 그린다. 겹치면 나중에 그은 밑줄 색. 밑줄을 누르면 그 구간의 밑줄들을 연다.
export function HighlightedText({
  text,
  highlights,
  penOf,
  newIds,
  onOpen,
}: {
  text: string;
  highlights: Highlight[];
  penOf: (userId: string) => PenColor;
  newIds?: Set<string>;
  onOpen?: (ids: string[]) => void;
}) {
  if (highlights.length === 0) return <>{text}</>;
  const cuts = new Set([0, text.length]);
  for (const h of highlights) {
    cuts.add(Math.max(0, Math.min(text.length, h.start_offset)));
    cuts.add(Math.max(0, Math.min(text.length, h.end_offset)));
  }
  const points = [...cuts].sort((a, b) => a - b);
  const parts: React.ReactNode[] = [];
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k];
    const b = points[k + 1];
    const covering = highlights.filter((h) => h.start_offset <= a && h.end_offset >= b);
    const seg = text.slice(a, b);
    if (covering.length === 0) {
      parts.push(seg);
      continue;
    }
    const top = covering[covering.length - 1];
    const hasMemo = covering.some((h) => h.memo);
    const isNew = covering.some((h) => newIds?.has(h.id));
    const ids = covering.map((h) => h.id);
    parts.push(
      <span
        key={a}
        data-hl={ids.join(",")}
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        aria-label={onOpen ? `밑줄 ${covering.length}개${hasMemo ? ", 한마디 있음" : ""}${isNew ? ", 새 밑줄" : ""}` : undefined}
        onClick={(e) => {
          if (!onOpen || window.getSelection()?.toString()) return;
          e.stopPropagation();
          onOpen(ids);
        }}
        onKeyDown={(e) => {
          if (onOpen && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onOpen(ids);
          }
        }}
        className={onOpen ? "cursor-pointer rounded-[2px] focus-visible:outline-2" : undefined}
        style={{
          textDecorationLine: "underline",
          textDecorationColor: PEN_VAR[penOf(top.user_id)],
          textDecorationThickness: covering.length > 1 ? "3px" : "2px",
          textUnderlineOffset: "5px",
          backgroundColor: isNew ? `color-mix(in srgb, ${PEN_VAR[penOf(top.user_id)]} 14%, transparent)` : undefined,
        }}
      >
        {seg}
        {hasMemo && b === Math.max(...covering.filter((h) => h.memo).map((h) => h.end_offset)) && (
          <sup aria-hidden="true" className="ml-px font-hand text-[0.8em]" style={{ color: PEN_VAR[penOf(top.user_id)] }}>
            ✎
          </sup>
        )}
      </span>,
    );
  }
  return <>{parts}</>;
}

function closestParagraph(node: Node) {
  const el = node instanceof Element ? node : node.parentElement;
  return el?.closest("[data-ptext]") ?? null;
}

// 문단(data-ptext) 안에서 고른 글자 범위를 문단 기준 위치로 바꾼다
function offsetIn(root: Element, node: Node, offset: number) {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(node, offset);
  return r.toString().length;
}

type Picked = { paragraph: number; start: number; end: number; preview: string };

export function UnderlineBar({
  roomId,
  myPen,
  bottomOffset,
  withMemo,
  onAdded,
}: {
  roomId: string;
  myPen: PenColor;
  bottomOffset: number;
  withMemo: boolean;
  onAdded: (h: Highlight) => void;
}) {
  const memoId = useId();
  const [picked, setPicked] = useState<Picked | null>(null);
  // 한마디를 쓰는 동안에는 선택이 풀려도 고른 문장을 붙잡아 둔다
  const [writing, setWriting] = useState(false);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onChange() {
      if (writing) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPicked(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const startEl = closestParagraph(range.startContainer);
      const endEl = closestParagraph(range.endContainer);
      // 한 문단 안에서 고른 것만 밑줄로 받는다
      if (!startEl || startEl !== endEl) {
        setPicked(null);
        return;
      }
      const start = offsetIn(startEl, range.startContainer, range.startOffset);
      const end = offsetIn(startEl, range.endContainer, range.endOffset);
      const preview = sel.toString().trim();
      if (end <= start || !preview) {
        setPicked(null);
        return;
      }
      setError(null);
      setPicked({ paragraph: Number((startEl as HTMLElement).dataset.ptext), start, end, preview });
    }
    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, [writing]);

  if (!picked) return null;

  function reset() {
    window.getSelection()?.removeAllRanges();
    setPicked(null);
    setWriting(false);
    setMemo("");
  }

  async function save() {
    if (!picked) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setSaving(true);
    const row: Record<string, unknown> = {
      room_id: roomId,
      paragraph_index: picked.paragraph,
      start_offset: picked.start,
      end_offset: picked.end,
    };
    if (memo.trim()) row.memo = memo.trim();
    const { data, error } = await supabase.from("highlights").insert(row).select(HIGHLIGHT_COLUMNS).single();
    setSaving(false);
    if (error || !data) {
      setError(`밑줄을 긋지 못했어요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    onAdded(data as Highlight);
    reset();
  }

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto w-[min(600px,calc(100%-1.5rem))] rounded-2xl border border-rule bg-page px-4 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
      style={{ bottom: bottomOffset }}
    >
      <p className="line-clamp-2 font-serif text-[13px] leading-snug text-pencil">“{picked.preview}”</p>
      {writing && (
        <>
          <label htmlFor={memoId} className="sr-only">
            밑줄에 한마디
          </label>
          <textarea
            id={memoId}
            autoFocus
            value={memo}
            maxLength={MEMO_MAX}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            placeholder="이 문장에 한마디 (안 써도 돼요)"
            className={`mt-2 block w-full resize-none rounded-lg border border-rule bg-page px-3 py-2 font-hand text-[21px] leading-[1.25] placeholder:font-sans placeholder:text-[14px] placeholder:text-pencil/70 focus:border-ink focus:outline-none ${PEN[myPen].className}`}
          />
        </>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`font-hand text-[20px] leading-none ${PEN[myPen].className}`}>{PEN[myPen].label}으로</span>
        <span className="flex gap-1">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={reset} className="h-10 px-3 text-[13px] text-pencil">
            취소
          </button>
          {withMemo && !writing && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setWriting(true);
                window.getSelection()?.removeAllRanges();
              }}
              className="h-10 rounded-full border border-ink px-4 text-[13px] text-ink"
            >
              + 한마디
            </button>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={save}
            disabled={saving}
            className="h-10 rounded-full bg-ink px-4 text-[13px] text-page disabled:opacity-50"
          >
            {saving ? "긋는 중…" : "밑줄 긋기"}
          </button>
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-[12px] text-pen-orange">
          {error}
        </p>
      )}
    </div>
  );
}
