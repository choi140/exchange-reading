"use client";

import { useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PEN, type PenColor } from "../PenChip";
import { Sheet } from "../Sheet";
import type { Highlight } from "./Highlights";

// 9-7 밑줄을 누르면 열리는 창: 문장, 그 사람의 한마디, 답글. 내 밑줄은 지우기.
// 블라인드(4-5를 밑줄 단위로): 함께 읽기에서 그 문단에 내 밑줄이 없으면 남의 한마디·답글은 가려 둔다.

export type Reply = { id: string; highlight_id: string; user_id: string; body: string; created_at: string };
export const REPLY_COLUMNS = "id, highlight_id, user_id, body, created_at";
const REPLY_MAX = 200;

const timeFormat = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" });

export function HighlightSheet({
  open,
  onClose,
  roomId,
  together,
  me,
  penOf,
  paragraphs,
  items,
  replies,
  isBlind,
  isNew,
  onUnlock,
  onDeleted,
  onReplyAdded,
  onReplyDeleted,
}: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  together: boolean;
  me: string;
  penOf: (u: string) => PenColor;
  paragraphs: string[];
  items: Highlight[];
  replies: Reply[];
  isBlind: (h: Highlight) => boolean;
  isNew: (createdAt: string, userId: string) => boolean;
  onUnlock: (paragraphIndex: number) => Promise<string | null>;
  onDeleted: (id: string) => void;
  onReplyAdded: (r: Reply) => void;
  onReplyDeleted: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={items.length > 1 ? `이 문장의 밑줄 ${items.length}개` : "밑줄"}>
      <ul className="mt-4 space-y-6">
        {items.map((h) => (
          <HighlightItem
            key={h.id}
            h={h}
            roomId={roomId}
            together={together}
            me={me}
            penOf={penOf}
            quote={(paragraphs[h.paragraph_index]?.slice(h.start_offset, h.end_offset) ?? "").trim()}
            replies={replies.filter((r) => r.highlight_id === h.id)}
            blind={isBlind(h)}
            isNew={isNew}
            onUnlock={() => onUnlock(h.paragraph_index)}
            onDeleted={(id) => {
              onDeleted(id);
              if (items.length <= 1) onClose();
            }}
            onReplyAdded={onReplyAdded}
            onReplyDeleted={onReplyDeleted}
          />
        ))}
      </ul>
    </Sheet>
  );
}

function HighlightItem({
  h,
  roomId,
  together,
  me,
  penOf,
  quote,
  replies,
  blind,
  isNew,
  onUnlock,
  onDeleted,
  onReplyAdded,
  onReplyDeleted,
}: {
  h: Highlight;
  roomId: string;
  together: boolean;
  me: string;
  penOf: (u: string) => PenColor;
  quote: string;
  replies: Reply[];
  blind: boolean;
  isNew: (createdAt: string, userId: string) => boolean;
  onUnlock: () => Promise<string | null>;
  onDeleted: (id: string) => void;
  onReplyAdded: (r: Reply) => void;
  onReplyDeleted: (id: string) => void;
}) {
  const fieldId = useId();
  const pen = PEN[penOf(h.user_id)];
  const mine = h.user_id === me;
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy("reply");
    setError(null);
    const { data, error } = await supabase
      .from("highlight_replies")
      .insert({ highlight_id: h.id, room_id: roomId, body: text })
      .select(REPLY_COLUMNS)
      .single();
    setBusy(null);
    if (error || !data) {
      setError(`답글을 남기지 못했어요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    onReplyAdded(data as Reply);
    setBody("");
  }

  async function remove() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy("delete");
    const { error } = await supabase.from("highlights").delete().eq("id", h.id);
    setBusy(null);
    if (error) setError(`지우지 못했어요. (${error.message})`);
    else onDeleted(h.id);
  }

  async function removeReply(id: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { error } = await supabase.from("highlight_replies").delete().eq("id", id);
    if (!error) onReplyDeleted(id);
  }

  return (
    <li className={`border-l-2 pl-3 ${pen.border}`}>
      <p className="font-serif text-[16px] leading-relaxed text-ink">“{quote}”</p>
      <p className="mt-1 text-[12px] text-pencil">
        {pen.label}
        {mine ? " (나)" : ""}의 밑줄, {timeFormat.format(new Date(h.created_at))}
        {isNew(h.created_at, h.user_id) && <span className="ml-2 rounded-full border border-ink px-1.5 text-[11px] text-ink">새 밑줄</span>}
      </p>

      {blind ? (
        <div className="mt-3 rounded-lg border border-dashed border-pencil/60 px-3 py-3">
          <p className="text-[14px] leading-relaxed text-pencil">
            {h.memo || replies.length ? "숨겨진 한마디가 있어요. " : ""}이 문단에 내 밑줄을 먼저 그으면 다른 사람의 한마디가 열려요.
          </p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("unlock");
              const err = await onUnlock();
              setBusy(null);
              if (err) setError(err);
            }}
            className="mt-2 h-9 rounded-full border border-ink px-4 text-[14px] text-ink disabled:opacity-60"
          >
            {busy === "unlock" ? "여는 중…" : "그냥 보기"}
          </button>
        </div>
      ) : (
        <>
          {h.memo && <p className={`mt-2 whitespace-pre-wrap font-hand text-[23px] leading-[1.25] ${pen.className}`}>{h.memo}</p>}
          {together && (
            <div className="ml-2 mt-3 border-l border-rule pl-3">
              {replies.map((r) => {
                const rp = PEN[penOf(r.user_id)];
                return (
                  <div key={r.id} className="mb-2">
                    <p className={`whitespace-pre-wrap font-hand text-[21px] leading-[1.25] ${rp.className}`}>{r.body}</p>
                    <p className="text-[12px] text-pencil">
                      {rp.label}
                      {r.user_id === me ? " (나)" : ""}, {timeFormat.format(new Date(r.created_at))}
                      {isNew(r.created_at, r.user_id) && <span className="ml-2 rounded-full border border-ink px-1.5 text-[11px] text-ink">새 답글</span>}
                      {r.user_id === me && (
                        <button type="button" onClick={() => removeReply(r.id)} className="ml-2 underline underline-offset-2">
                          지우기
                        </button>
                      )}
                    </p>
                  </div>
                );
              })}
              <form onSubmit={reply} className="flex items-end gap-2">
                <label htmlFor={fieldId} className="sr-only">
                  답글
                </label>
                <textarea
                  id={fieldId}
                  value={body}
                  maxLength={REPLY_MAX}
                  onChange={(e) => setBody(e.target.value)}
                  rows={1}
                  placeholder="답글 달기"
                  className={`min-h-10 min-w-0 flex-1 resize-y rounded-lg border border-rule bg-page px-3 py-1.5 font-hand text-[20px] leading-[1.25] placeholder:font-sans placeholder:text-[14px] placeholder:text-pencil/70 focus:border-ink focus:outline-none ${PEN[penOf(me)].className}`}
                />
                <button
                  type="submit"
                  disabled={busy !== null || body.trim().length === 0}
                  className="h-10 shrink-0 rounded-full bg-ink px-4 text-[13px] text-page disabled:opacity-40"
                >
                  남기기
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {mine && (
        <button
          type="button"
          onClick={remove}
          disabled={busy !== null}
          className="mt-3 h-9 text-[13px] text-pencil underline underline-offset-4 disabled:opacity-50"
        >
          {busy === "delete" ? "지우는 중…" : "내 밑줄 지우기"}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-pen-orange">
          {error}
        </p>
      )}
    </li>
  );
}
