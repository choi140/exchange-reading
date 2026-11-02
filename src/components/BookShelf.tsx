"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Book } from "@/data/books";
import { setPrefs, usePrefs, type ShelfView } from "@/lib/prefs";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { BookCover } from "./BookCover";
import { CodeJoinForm } from "./CodeJoinForm";
import { ChoiceButton, Sheet } from "./Sheet";

type ShelfBook = Omit<Book, "paragraphs">;
type RoomRpc = "start_solo_room" | "join_room" | "create_private_room";

// 14-3 책장 배치: 고른 배치는 이 브라우저에 기억한다
const SHELF_VIEWS: { value: ShelfView; label: string }[] = [
  { value: "list", label: "목록" },
  { value: "three", label: "3열" },
  { value: "four", label: "4열" },
];
const SHELF_LIST: Record<ShelfView, string> = {
  list: "border-t border-rule",
  three: "grid grid-cols-3 gap-x-3 gap-y-7 border-t border-rule pt-6",
  four: "grid grid-cols-4 gap-x-2 gap-y-7 border-t border-rule pt-6 sm:gap-x-3",
};
const SHELF_TITLE: Record<ShelfView, string> = {
  list: "text-[22px]",
  three: "mt-2 text-[15px]",
  four: "mt-2 text-[14px]",
};

// 1-7 책 목록 + 1-8 "혼자 읽기"·"함께 읽기" 버튼
// 3-2 혼자 읽기 → start_solo_room
// 4-3 / 7-2 함께 읽기 → 낯선 사람과(join_room) · 코드로 방 만들기(create_private_room) · 코드로 들어가기
export function BookShelf({ books }: { books: ShelfBook[] }) {
  const router = useRouter();
  const session = useAnonymousSession();
  const { shelf: view } = usePrefs();
  const inList = view === "list";
  const buttonSize = inList ? "h-10 px-4 text-[14px] sm:h-11 sm:text-[15px]" : view === "three" ? "h-10 px-1 text-[14px]" : "h-9 px-0.5 text-[12px] sm:text-[13px]";
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [together, setTogether] = useState<ShelfBook | null>(null);
  const [sheetNotice, setSheetNotice] = useState<string | null>(null);

  async function openRoom(book: ShelfBook, rpc: RoomRpc) {
    const supabase = getBrowserSupabase();
    const say = rpc === "start_solo_room" ? setNotice : setSheetNotice;
    if (!supabase || session.status !== "ready") {
      say("익명 계정을 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      return;
    }
    setBusy(`${book.id}:${rpc}`);
    say(null);
    const { data, error } = await supabase.rpc(rpc, { p_book_id: book.id });
    if (error || !data) {
      setBusy(null);
      say(`방을 열지 못했어요. 다시 눌러 주세요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    setTogether(null);
    setBusy(null);
    router.push(`/room/${data}`);
  }

  return (
    <div>
      <div role="group" aria-label="책장 배치" className="mb-3 flex flex-wrap gap-2">
        {SHELF_VIEWS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === view}
            onClick={() => setPrefs({ shelf: o.value })}
            className={`h-9 rounded-full border px-4 text-[14px] ${o.value === view ? "border-ink bg-ink text-page" : "border-rule text-ink"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <ul className={SHELF_LIST[view]}>
        {books.map((book) => (
          <li key={book.id} className={inList ? "flex items-center justify-between gap-4 border-b border-rule py-5" : "min-w-0"}>
            {!inList && <BookCover id={book.id} title={book.title} author={book.author} />}
            <div className="min-w-0">
              <p className={`font-serif leading-snug text-ink ${SHELF_TITLE[view]}`}>{book.title}</p>
              <p className={`mt-1 text-pencil ${inList ? "text-[14px]" : "text-[12px] sm:text-[13px]"}`}>
                {book.author}
                {book.year ? `, ${book.year}년` : ""}
              </p>
            </div>
            {/* 15-2 목록에서는 버튼을 책 옆에 (휴대폰은 위아래로) */}
            <div className={inList ? "flex shrink-0 flex-col gap-2 sm:flex-row" : "mt-3 flex flex-col gap-2"}>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => openRoom(book, "start_solo_room")}
                className={`rounded-full border border-ink bg-ink text-page disabled:opacity-60 active:translate-y-px ${buttonSize}`}
              >
                {busy === `${book.id}:start_solo_room` ? "방을 여는 중…" : "혼자 읽기"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  setSheetNotice(null);
                  setTogether(book);
                }}
                className={`rounded-full border border-ink text-ink disabled:opacity-60 active:translate-y-px ${buttonSize}`}
              >
                함께 읽기
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="min-h-6 pt-3 text-[14px] text-pencil">
        {notice}
      </p>

      <Sheet
        open={together !== null}
        onClose={() => setTogether(null)}
        title={together ? `「${together.title}」 누구와 읽을까요?` : ""}
      >
        {together && (
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3">
            <ChoiceButton
              title={busy === `${together.id}:join_room` ? "자리를 찾는 중…" : "낯선 사람과 읽기"}
              desc="빈자리 있는 방에 들어가요. 최대 3명이 펜 색으로만 서로를 알아봐요."
              disabled={busy !== null}
              onClick={() => openRoom(together, "join_room")}
            />
            <ChoiceButton
              title={busy === `${together.id}:create_private_room` ? "방을 만드는 중…" : "코드로 방 만들기"}
              desc="아는 사람과 읽어요. 6자리 참여 코드가 생기면 친구에게 보내 주세요."
              disabled={busy !== null}
              onClick={() => openRoom(together, "create_private_room")}
            />
            <div className="rounded-lg border border-rule bg-paper/60 px-4 py-4">
              <CodeJoinForm onDone={() => setTogether(null)} />
            </div>
            <p aria-live="polite" className="min-h-5 text-[14px] text-pen-orange">
              {sheetNotice}
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
