"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PEN, type PenColor } from "../PenChip";
import { Sheet } from "../Sheet";

// 7-7 다 읽고 편지 한 장 + 7-8 방 나가기 + 10-3 기념 카드로 가기 (책 끝에 놓는다)

export type Letter = { id: string; user_id: string; body: string; created_at: string };
export const LETTER_COLUMNS = "id, user_id, body, created_at";
const LETTER_MAX = 500;

export function EndOfBook({
  roomId,
  together,
  me,
  myPen,
  penOf,
  letters,
  onSent,
  centered = false,
}: {
  centered?: boolean; // 13-1 페이지 모드에서는 책 끝 쪽을 가운데로
  roomId: string;
  together: boolean;
  me: string;
  myPen: PenColor;
  penOf: (userId: string) => PenColor;
  letters: Letter[];
  onSent: (l: Letter) => void;
}) {
  const fieldId = useId();
  const mine = letters.find((l) => l.user_id === me);
  const others = letters.filter((l) => l.user_id !== me);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("letters")
      .insert({ room_id: roomId, body: text })
      .select(LETTER_COLUMNS)
      .single();
    setSaving(false);
    if (error || !data) {
      setError(`편지를 남기지 못했어요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    onSent(data as Letter);
    setBody("");
  }

  return (
    <section aria-labelledby={`${fieldId}-title`} data-letters className={`px-5 pb-6 pt-10 sm:px-8 ${centered ? "text-center" : ""}`}>
      <p className="text-center font-hand text-[26px] text-pencil">— 끝 —</p>
      <div className="mt-4 text-center">
        <Link
          href={`/room/${roomId}/card`}
          className="inline-flex h-11 items-center rounded-full border border-ink px-5 text-[14px] text-ink"
        >
          {together ? "함께 읽은 기념 카드 만들기" : "기념 카드 만들기"}
        </Link>
      </div>
      <h2 id={`${fieldId}-title`} className="mt-6 font-display text-[21px] text-ink">
        {together ? "다 읽었다면, 이 방 사람들에게 편지 한 장" : "다 읽은 나에게 편지 한 장"}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-pencil">
        {together
          ? "같이 읽은 사람들에게 남기는 마지막 쪽지예요. 한 사람당 한 장, 500자까지."
          : "이 책을 읽은 오늘의 나에게 남겨 두세요. 나만 봐요."}
      </p>

      {others.length > 0 && (
        <ul className="mt-5 space-y-4 text-left">
          {others.map((l) => (
            <li key={l.id} className={`border-l-2 pl-3 ${PEN[penOf(l.user_id)].border}`}>
              <p className={`whitespace-pre-wrap font-hand text-[23px] leading-[1.3] ${PEN[penOf(l.user_id)].className}`}>
                {l.body}
              </p>
              <p className="mt-1 text-[12px] text-pencil">{PEN[penOf(l.user_id)].label}의 편지</p>
            </li>
          ))}
        </ul>
      )}

      {mine ? (
        <div className={`mt-5 border-l-2 pl-3 text-left ${PEN[myPen].border}`}>
          <p className={`whitespace-pre-wrap font-hand text-[23px] leading-[1.3] ${PEN[myPen].className}`}>{mine.body}</p>
          <p className="mt-1 text-[12px] text-pencil">내가 남긴 편지</p>
        </div>
      ) : (
        <form onSubmit={send} className="mt-5 text-left">
          <label htmlFor={fieldId} className="sr-only">
            편지
          </label>
          <textarea
            id={fieldId}
            data-letter-body
            value={body}
            maxLength={LETTER_MAX}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder={together ? "함께 읽어서 좋았던 점, 기억에 남는 메모…" : "이 책을 읽고 남은 생각…"}
            className={`notebook-lines block w-full resize-y rounded-sm border border-rule px-3 font-hand text-[22px] placeholder:font-sans placeholder:text-[15px] placeholder:text-pencil/70 focus:border-ink focus:outline-none ${PEN[myPen].className}`}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[12px] tabular-nums text-pencil">
              {body.length} / {LETTER_MAX}자
            </span>
            <button
              type="submit"
              disabled={saving || body.trim().length === 0}
              className="h-10 rounded-full bg-ink px-5 text-[13px] text-page disabled:opacity-40"
            >
              {saving ? "남기는 중…" : "편지 남기기"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-pen-orange">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

export function LeaveRoomButton({ roomId, together, prominent = false }: { roomId: string; together: boolean; prominent?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leave() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("leave_room", { p_room: roomId });
    if (error) {
      setBusy(false);
      setError(`나가지 못했어요. 다시 눌러 주세요. (${error.message})`);
      return;
    }
    setOpen(false);
    router.replace("/read");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          prominent
            ? "h-11 rounded-full border border-pen-orange px-6 text-[14px] text-pen-orange"
            : "min-h-9 text-[0.78em] text-pencil underline underline-offset-4"
        }
      >
        이 방 나가기
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="이 방에서 나갈까요?">
        <p className="mt-3 text-[14px] leading-relaxed text-pencil">
          {together
            ? "이 방에 남긴 내 메모(그 아래 달린 답글 포함), 밑줄, 편지가 모두 지워지고, 내 자리는 다른 사람에게 돌아가요. 되돌릴 수 없어요."
            : "이 책에 남긴 내 메모, 밑줄, 편지가 모두 지워져요. 되돌릴 수 없어요."}
        </p>
        <button
          type="button"
          onClick={leave}
          disabled={busy}
          className="mt-5 h-12 w-full rounded-full border border-pen-orange text-[14px] text-pen-orange disabled:opacity-50"
        >
          {busy ? "나가는 중…" : "지우고 나가기"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-[13px] text-pen-orange">
            {error}
          </p>
        )}
      </Sheet>
    </>
  );
}
