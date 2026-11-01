"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PEN, type PenColor } from "../PenChip";

// 7-6 문장 밑줄: 문단 글자 위치(start~end)로 저장하고, 그 사람의 펜 색으로 밑줄을 긋는다

export type Highlight = {
  id: string;
  user_id: string;
  paragraph_index: number;
  start_offset: number;
  end_offset: number;
  created_at: string;
};
export const HIGHLIGHT_COLUMNS = "id, user_id, paragraph_index, start_offset, end_offset, created_at";

const PEN_VAR: Record<PenColor, string> = {
  black: "var(--color-pen-black)",
  blue: "var(--color-pen-blue)",
  green: "var(--color-pen-green)",
  orange: "var(--color-pen-orange)",
};

// 본문을 밑줄 구간별로 잘라 그린다. 겹치면 나중에 그은 밑줄 색을 쓴다.
export function HighlightedText({
  text,
  highlights,
  penOf,
}: {
  text: string;
  highlights: Highlight[];
  penOf: (userId: string) => PenColor;
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
    } else {
      const top = covering[covering.length - 1];
      parts.push(
        <span
          key={a}
          style={{
            textDecorationLine: "underline",
            textDecorationColor: PEN_VAR[penOf(top.user_id)],
            textDecorationThickness: covering.length > 1 ? "3px" : "2px",
            textUnderlineOffset: "5px",
          }}
        >
          {seg}
        </span>,
      );
    }
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
  onAdded,
}: {
  roomId: string;
  myPen: PenColor;
  bottomOffset: number;
  onAdded: (h: Highlight) => void;
}) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onChange() {
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
  }, []);

  if (!picked) return null;

  async function save() {
    if (!picked) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("highlights")
      .insert({ room_id: roomId, paragraph_index: picked.paragraph, start_offset: picked.start, end_offset: picked.end })
      .select(HIGHLIGHT_COLUMNS)
      .single();
    setSaving(false);
    if (error || !data) {
      setError(`밑줄을 긋지 못했어요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    onAdded(data as Highlight);
    window.getSelection()?.removeAllRanges();
    setPicked(null);
  }

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto w-[min(600px,calc(100%-1.5rem))] rounded-2xl border border-rule bg-page px-4 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
      style={{ bottom: bottomOffset }}
    >
      <p className="line-clamp-2 font-serif text-[14px] leading-snug text-pencil">“{picked.preview}”</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`font-hand text-[20px] leading-none ${PEN[myPen].className}`}>{PEN[myPen].label}으로</span>
        <span className="flex gap-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            window.getSelection()?.removeAllRanges();
            setPicked(null);
          }}
          className="h-10 px-3 text-[14px] text-pencil"
        >
          취소
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={save}
          disabled={saving}
          className="h-10 rounded-full bg-ink px-5 text-[14px] text-page disabled:opacity-50"
        >
          {saving ? "긋는 중…" : "밑줄 긋기"}
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

// 메모 창 안에서 보여 주는 이 문단의 내 밑줄 (지우기)
export function MyUnderlines({
  text,
  mine,
  onDeleted,
}: {
  text: string;
  mine: Highlight[];
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  if (mine.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="text-[13px] text-pencil">이 문단에 내가 그은 밑줄</p>
      <ul className="mt-1 space-y-1">
        {mine.map((h) => (
          <li key={h.id} className="flex items-start justify-between gap-3">
            <span className="font-serif text-[14px] leading-snug text-ink">“{text.slice(h.start_offset, h.end_offset)}”</span>
            <button
              type="button"
              disabled={busy === h.id}
              onClick={async () => {
                const supabase = getBrowserSupabase();
                if (!supabase) return;
                setBusy(h.id);
                const { error } = await supabase.from("highlights").delete().eq("id", h.id);
                setBusy(null);
                if (!error) onDeleted(h.id);
              }}
              className="h-8 shrink-0 text-[13px] text-pencil underline underline-offset-4"
            >
              지우기
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
