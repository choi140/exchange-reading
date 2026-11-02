"use client";

import { useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PEN, type PenColor } from "./PenChip";

// 일기 한 편 보기
// 9-2 내 일기 지우기 · 9-4 일기에 댓글 · 9-5 목록에서는 미리보기, 날짜 탭에서는 전체

export type Entry = {
  id: string;
  user_id: string;
  prompt: string;
  body: string;
  created_at: string;
};
export type Comment = { id: string; entry_id: string; user_id: string; body: string; created_at: string };
export const COMMENT_COLUMNS = "id, entry_id, user_id, body, created_at";
const COMMENT_MAX = 300;

const dateFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" });
const timeFormat = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" });

function Author({ userId, me, exchange, penOf }: { userId: string; me: string | null; exchange: boolean; penOf: (u: string) => PenColor }) {
  if (!exchange) return null;
  const pen = PEN[penOf(userId)];
  return (
    <span className={`font-hand text-[20px] leading-none ${pen.className}`}>
      {pen.label}
      {userId === me ? " (나)" : ""}
    </span>
  );
}

// 9-5 일기 탭의 짧은 미리보기 (누르면 그날 탭으로)
export function EntryPreview({
  entry,
  me,
  exchange,
  penOf,
  commentCount,
  highlight,
  onOpen,
}: {
  entry: Entry;
  me: string | null;
  exchange: boolean;
  penOf: (u: string) => PenColor;
  commentCount: number;
  highlight?: boolean;
  onOpen: () => void;
}) {
  return (
    <li className={`border-b border-rule ${highlight ? "bg-rule/30" : ""}`}>
      <button type="button" onClick={onOpen} className="block w-full py-5 text-left">
        <span className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-pencil">
          <span>{dateFormat.format(new Date(entry.created_at))}</span>
          <Author userId={entry.user_id} me={me} exchange={exchange} penOf={penOf} />
        </span>
        {entry.prompt && <span className="mt-1.5 block font-hand text-[20px] leading-snug text-pencil">{entry.prompt}</span>}
        <span
          className={`mt-2 line-clamp-3 whitespace-pre-wrap font-serif text-[15px] leading-[1.8] text-ink ${
            exchange ? `border-l-2 pl-3 ${PEN[penOf(entry.user_id)].border}` : ""
          }`}
        >
          {entry.body}
        </span>
        <span className="mt-2 block text-[12px] text-pencil">
          {commentCount > 0 ? `댓글 ${commentCount} · ` : ""}이 날 일기 전체 보기
        </span>
      </button>
    </li>
  );
}

// 9-5 날짜 탭의 전체 일기 + 9-2 지우기 + 9-4 댓글
export function EntryCard({
  entry,
  me,
  exchange,
  penOf,
  comments,
  diaryId,
  canComment,
  onDeleted,
  onCommentAdded,
  onCommentDeleted,
}: {
  entry: Entry;
  me: string | null;
  exchange: boolean;
  penOf: (u: string) => PenColor;
  comments: Comment[];
  diaryId: string;
  canComment: boolean;
  onDeleted: (id: string) => void;
  onCommentAdded: (c: Comment) => void;
  onCommentDeleted: (id: string) => void;
}) {
  const mine = entry.user_id === me;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from("diary_entries").delete().eq("id", entry.id);
    setBusy(false);
    if (error) {
      setError(`지우지 못했어요. (${error.message})`);
      return;
    }
    onDeleted(entry.id);
  }

  return (
    <article className="border-b border-rule py-6">
      <p className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-pencil">
        <span>{timeFormat.format(new Date(entry.created_at))}</span>
        <Author userId={entry.user_id} me={me} exchange={exchange} penOf={penOf} />
      </p>
      {entry.prompt && <p className="mt-2 font-hand text-[22px] leading-snug text-pencil">{entry.prompt}</p>}
      <p
        className={`mt-3 whitespace-pre-wrap font-serif text-[15px] leading-[1.9] text-ink ${
          exchange ? `border-l-2 pl-3 ${PEN[penOf(entry.user_id)].border}` : ""
        }`}
      >
        {entry.body}
      </p>

      {mine && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3 text-[12px]">
          {confirming ? (
            <>
              <span className="text-pencil">이 일기{comments.length ? "와 댓글" : ""}을 지울까요?</span>
              <button type="button" onClick={() => setConfirming(false)} className="h-9 px-2 text-pencil">
                취소
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="h-9 rounded-full border border-pen-orange px-4 text-pen-orange disabled:opacity-50"
              >
                {busy ? "지우는 중…" : "지우기"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="h-9 text-pencil underline underline-offset-4">
              내 일기 지우기
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-1 text-right text-[12px] text-pen-orange">
          {error}
        </p>
      )}

      <Comments
        entry={entry}
        diaryId={diaryId}
        me={me}
        penOf={penOf}
        comments={comments}
        canComment={canComment}
        onAdded={onCommentAdded}
        onDeleted={onCommentDeleted}
      />
    </article>
  );
}

function Comments({
  entry,
  diaryId,
  me,
  penOf,
  comments,
  canComment,
  onAdded,
  onDeleted,
}: {
  entry: Entry;
  diaryId: string;
  me: string | null;
  penOf: (u: string) => PenColor;
  comments: Comment[];
  canComment: boolean;
  onAdded: (c: Comment) => void;
  onDeleted: (id: string) => void;
}) {
  const fieldId = useId();
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
      .from("diary_comments")
      .insert({ entry_id: entry.id, diary_id: diaryId, body: text })
      .select(COMMENT_COLUMNS)
      .single();
    setSaving(false);
    if (error || !data) {
      setError(`댓글을 남기지 못했어요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    onAdded(data as Comment);
    setBody("");
  }

  async function remove(id: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { error } = await supabase.from("diary_comments").delete().eq("id", id);
    if (!error) onDeleted(id);
  }

  return (
    <div className="mt-4 rounded-lg bg-paper/70 px-4 py-3">
      {comments.length > 0 && (
        <ul className="mb-3 space-y-3">
          {comments.map((c) => {
            const pen = PEN[penOf(c.user_id)];
            return (
              <li key={c.id}>
                <p className={`whitespace-pre-wrap font-hand text-[21px] leading-[1.25] ${pen.className}`}>{c.body}</p>
                <p className="mt-0.5 flex items-center gap-3 text-[12px] text-pencil">
                  <span>
                    {pen.label}
                    {c.user_id === me ? " (나)" : ""}, {timeFormat.format(new Date(c.created_at))}
                  </span>
                  {c.user_id === me && (
                    <button type="button" onClick={() => remove(c.id)} className="underline underline-offset-2">
                      지우기
                    </button>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {canComment ? (
        <form onSubmit={save} className="flex items-end gap-2">
          <label htmlFor={fieldId} className="sr-only">
            댓글
          </label>
          <textarea
            id={fieldId}
            value={body}
            maxLength={COMMENT_MAX}
            onChange={(e) => setBody(e.target.value)}
            rows={1}
            placeholder={entry.user_id === me ? "덧붙이고 싶은 말" : "이 일기에 댓글 남기기"}
            className="min-h-11 min-w-0 flex-1 resize-y rounded-lg border border-rule bg-page px-3 py-2 text-[14px] text-ink placeholder:text-pencil/70 focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || body.trim().length === 0}
            className="h-11 shrink-0 rounded-full bg-ink px-4 text-[13px] text-page disabled:opacity-40"
          >
            {saving ? "…" : "남기기"}
          </button>
        </form>
      ) : (
        comments.length === 0 && <p className="text-[12px] text-pencil">댓글이 없어요.</p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-[12px] text-pen-orange">
          {error}
        </p>
      )}
    </div>
  );
}
