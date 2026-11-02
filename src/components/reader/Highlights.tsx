"use client";

import { useEffect, useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PEN, type PenColor } from "../PenChip";

// 7-6 문장 밑줄 + 9-7 밑줄에 한마디 + 22-1 형광펜
// 문단 글자 위치(start~end)로 저장하고, 그 사람의 펜 색으로 밑줄을 긋거나 형광펜을 칠한다. 누르면 한마디·답글이 열린다.

export type Highlight = {
  id: string;
  user_id: string;
  paragraph_index: number;
  start_offset: number;
  end_offset: number;
  memo?: string | null;
  mark?: "underline" | "marker"; // 15_marker.sql을 실행하기 전의 DB에는 없다
  created_at: string;
};
const COLUMNS_NO_MEMO = "id, user_id, paragraph_index, start_offset, end_offset, created_at";
const COLUMNS_NO_MARK = "id, user_id, paragraph_index, start_offset, end_offset, memo, created_at";
const COLUMNS_ALL = "id, user_id, paragraph_index, start_offset, end_offset, memo, mark, created_at";
const MEMO_MAX = 200;

// 옛 SQL만 실행한 DB에서도 깨지지 않게, 없는 칸(42703)을 빼고 다시 읽는다
export async function loadHighlights(supabase: NonNullable<ReturnType<typeof getBrowserSupabase>>, roomId: string) {
  for (const columns of [COLUMNS_ALL, COLUMNS_NO_MARK, COLUMNS_NO_MEMO]) {
    const { data, error } = await supabase.from("highlights").select(columns).eq("room_id", roomId).order("created_at", { ascending: true });
    if (error?.code === "42703") continue;
    return {
      highlights: (error ? [] : (data ?? [])) as unknown as Highlight[],
      memo: columns !== COLUMNS_NO_MEMO,
      marker: columns === COLUMNS_ALL,
    };
  }
  return { highlights: [] as Highlight[], memo: false, marker: false };
}

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
    const lines = covering.filter((h) => h.mark !== "marker");
    const markers = covering.filter((h) => h.mark === "marker");
    const lineColor = lines.length > 0 ? PEN_VAR[penOf(lines[lines.length - 1].user_id)] : undefined;
    const markerColor = markers.length > 0 ? PEN_VAR[penOf(markers[markers.length - 1].user_id)] : undefined;
    const hasMemo = covering.some((h) => h.memo);
    const isNew = covering.some((h) => newIds?.has(h.id));
    const ids = covering.map((h) => h.id);
    parts.push(
      <span
        key={a}
        data-hl={ids.join(",")}
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        aria-label={
          onOpen
            ? `${[lines.length > 0 && `밑줄 ${lines.length}개`, markers.length > 0 && `형광펜 ${markers.length}개`].filter(Boolean).join(", ")}${hasMemo ? ", 한마디 있음" : ""}${isNew ? ", 새 표시" : ""}`
            : undefined
        }
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
          textDecorationLine: lineColor ? "underline" : undefined,
          textDecorationColor: lineColor,
          textDecorationThickness: lines.length > 1 ? "3px" : "2px",
          textUnderlineOffset: "5px",
          backgroundColor: markerColor
            ? `color-mix(in srgb, ${markerColor} ${isNew ? 42 : 28}%, transparent)`
            : isNew
              ? `color-mix(in srgb, ${PEN_VAR[penOf(top.user_id)]} 14%, transparent)`
              : undefined,
        }}
      >
        {seg}
        {hasMemo && b === Math.max(...covering.filter((h) => h.memo).map((h) => h.end_offset)) && (
          <sup aria-hidden="true" className="ml-px font-serif text-[0.7em]" style={{ color: PEN_VAR[penOf(top.user_id)] }}>
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
  withMarker,
  onAdded,
}: {
  roomId: string;
  myPen: PenColor;
  bottomOffset: number;
  withMemo: boolean;
  withMarker: boolean;
  onAdded: (h: Highlight) => void;
}) {
  const memoId = useId();
  const [picked, setPicked] = useState<Picked | null>(null);
  // 한마디를 쓰는 동안에는 선택이 풀려도 고른 문장을 붙잡아 둔다
  const [writing, setWriting] = useState(false);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState<"underline" | "marker" | null>(null);
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

  async function save(mark: "underline" | "marker") {
    if (!picked) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setSaving(mark);
    const row: Record<string, unknown> = {
      room_id: roomId,
      paragraph_index: picked.paragraph,
      start_offset: picked.start,
      end_offset: picked.end,
    };
    if (memo.trim()) row.memo = memo.trim();
    if (withMarker) row.mark = mark;
    const { data, error } = await supabase
      .from("highlights")
      .insert(row)
      .select(withMarker ? COLUMNS_ALL : withMemo ? COLUMNS_NO_MARK : COLUMNS_NO_MEMO)
      .single();
    setSaving(null);
    if (error || !data) {
      setError(`${mark === "marker" ? "형광펜을 칠하지" : "밑줄을 긋지"} 못했어요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    onAdded(data as unknown as Highlight);
    reset();
  }

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto w-[min(600px,calc(100%-1.5rem))] rounded-2xl border border-rule bg-page px-4 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
      style={{ bottom: bottomOffset }}
    >
      <p className="line-clamp-2 font-serif text-[14px] leading-snug text-pencil">“{picked.preview}”</p>
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
            className={`mt-2 block w-full resize-none rounded-lg border border-rule bg-page px-3 py-2 font-serif text-[16px] leading-[1.7] placeholder:text-[14px] placeholder:text-pencil/70 focus:border-ink focus:outline-none ${PEN[myPen].className}`}
          />
        </>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className={`font-serif text-[15px] leading-none ${PEN[myPen].className}`}>{PEN[myPen].label}으로</span>
        <span className="flex flex-wrap justify-end gap-1">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={reset} className="h-10 px-3 text-[14px] text-pencil">
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
              className="h-10 rounded-full border border-ink px-4 text-[14px] text-ink"
            >
              + 한마디
            </button>
          )}
          {withMarker && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => save("marker")}
              disabled={saving !== null}
              style={{ backgroundColor: `color-mix(in srgb, ${PEN_VAR[myPen]} 28%, transparent)` }}
              className="h-10 rounded-full px-4 text-[14px] text-ink disabled:opacity-50"
            >
              {saving === "marker" ? "칠하는 중…" : "형광펜"}
            </button>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => save("underline")}
            disabled={saving !== null}
            className="h-10 rounded-full bg-ink px-4 text-[14px] text-page disabled:opacity-50"
          >
            {saving === "underline" ? "긋는 중…" : "밑줄 긋기"}
          </button>
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-pen-orange">
          {error}
        </p>
      )}
    </div>
  );
}
