"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PEN, type PenColor } from "../PenChip";

// 12-1 같은 사람들과 다음 책: 책 끝에서 다음 책을 제안하고, 방 사람 모두가 좋다고 하면 같은 펜 색으로 새 방이 열린다.

export type NextBookRow = { book_id: string; proposed_pen: PenColor; agreed: PenColor[]; next_room_id: string | null };
export const NEXT_BOOK_COLUMNS = "book_id, proposed_pen, agreed, next_room_id";

export function NextBook({
  roomId,
  myPen,
  books,
  next,
  onRefresh,
  centered = false,
}: {
  centered?: boolean; // 13-1 페이지 모드에서는 책 끝 쪽을 가운데로
  roomId: string;
  myPen: PenColor;
  books: { id: string; title: string }[]; // 지금 책을 뺀 책장
  next: NextBookRow | null;
  onRefresh: () => Promise<void>;
}) {
  const fieldId = useId();
  const [picked, setPicked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bookId = picked || books[0]?.id || "";
  const title = next ? books.find((b) => b.id === next.book_id)?.title : undefined;

  async function run(fn: string, args: Record<string, unknown>) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc(fn, args);
    if (error) setError(error.message);
    await onRefresh();
    setBusy(false);
  }
  async function recheck() {
    setBusy(true);
    await onRefresh();
    setBusy(false);
  }
  const respond = (yes: boolean) => run("respond_next_book", { p_room: roomId, p_yes: yes });

  return (
    // 페이지 모드에서 설명과 버튼이 두 쪽으로 갈리지 않게 한 덩어리로 둔다
    <section
      aria-labelledby={`${fieldId}-title`}
      className={`break-inside-avoid px-5 py-6 sm:px-8 ${centered ? "text-center [&_.answers]:justify-center" : "border-t border-rule"}`}
    >
      <h2 id={`${fieldId}-title`} className="font-display text-[20px] text-ink">
        같은 사람들과 다음 책
      </h2>

      {next?.next_room_id ? (
        <>
          <p className="mt-1 text-[14px] leading-relaxed text-pencil">모두 좋다고 했어요. 같은 펜 색 그대로, 다음 책을 이어 읽어요.</p>
          <Link
            href={`/room/${next.next_room_id}`}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[15px] text-page"
          >
            「{title}」 읽으러 가기
          </Link>
        </>
      ) : next && !next.agreed.includes(myPen) ? (
        <>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">
            <span className={`font-serif text-[16px] ${PEN[next.proposed_pen].className}`}>{PEN[next.proposed_pen].label}</span>이 다음 책을 함께
            읽자고 해요: 「{title}」
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-pencil">서로 누구인지는 앞으로도 몰라요. 안 읽겠다고 해도 상대에게 따로 알리지 않아요.</p>
          <div className="answers mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => respond(true)} disabled={busy} className="h-11 rounded-full bg-ink px-5 text-[15px] text-page disabled:opacity-50">
              같이 읽을래요
            </button>
            <button type="button" onClick={() => respond(false)} disabled={busy} className="h-11 rounded-full border border-ink px-5 text-[15px] text-ink disabled:opacity-50">
              이번엔 여기까지
            </button>
          </div>
        </>
      ) : next ? (
        <>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">다음 책으로 고른 「{title}」, 다른 사람의 답을 기다리는 중이에요.</p>
          <div className="answers mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={recheck} disabled={busy} className="h-10 rounded-full border border-ink px-4 text-[14px] text-ink disabled:opacity-50">
              다시 확인하기
            </button>
            {next.proposed_pen === myPen && (
              <button type="button" onClick={() => respond(false)} disabled={busy} className="h-10 px-2 text-[14px] text-pencil underline underline-offset-4 disabled:opacity-50">
                제안 거두기
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-[14px] leading-relaxed text-pencil">
            함께 읽어서 좋았다면 다음 책을 제안해 보세요. 모두 좋다고 하면 같은 펜 색으로 새 방이 열려요. 서로 누구인지는 앞으로도 몰라요.
          </p>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label htmlFor={fieldId} className="sr-only">
              다음 책
            </label>
            <select
              id={fieldId}
              value={bookId}
              onChange={(e) => setPicked(e.target.value)}
              className="h-11 min-w-0 rounded-lg border border-rule bg-page px-3 font-display text-[16px] text-ink focus:border-ink focus:outline-none"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => run("propose_next_book", { p_room: roomId, p_book: bookId })}
              disabled={busy || !bookId}
              className="h-11 rounded-full bg-ink px-5 text-[15px] text-page disabled:opacity-50"
            >
              {busy ? "남기는 중…" : "이 책 함께 읽자고 하기"}
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[14px] text-pen-orange">
          {error}
        </p>
      )}
    </section>
  );
}
