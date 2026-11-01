"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Book } from "@/data/books";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { CodeJoinForm } from "./CodeJoinForm";
import { ChoiceButton, Sheet } from "./Sheet";

type ShelfBook = Omit<Book, "paragraphs">;
type RoomRpc = "start_solo_room" | "join_room" | "create_private_room";

// 1-7 책 목록 + 1-8 "혼자 읽기"·"함께 읽기" 버튼
// 3-2 혼자 읽기 → start_solo_room
// 4-3 / 7-2 함께 읽기 → 낯선 사람과(join_room) · 코드로 방 만들기(create_private_room) · 코드로 들어가기
export function BookShelf({ books }: { books: ShelfBook[] }) {
  const router = useRouter();
  const session = useAnonymousSession();
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
      <ul className="border-t border-rule">
        {books.map((book) => (
          <li key={book.id} className="border-b border-rule py-5">
            <p className="font-serif text-[22px] leading-snug text-ink">{book.title}</p>
            <p className="mt-1 text-[14px] text-pencil">
              {book.author}
              {book.year ? `, ${book.year}년` : ""}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => openRoom(book, "start_solo_room")}
                className="h-11 flex-1 rounded-full border border-ink bg-ink px-4 text-[15px] text-page disabled:opacity-60 active:translate-y-px sm:flex-none"
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
                className="h-11 flex-1 rounded-full border border-ink px-4 text-[15px] text-ink disabled:opacity-60 active:translate-y-px sm:flex-none"
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
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] border-t border-rule">
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
            <div className="border-b border-rule py-4">
              <CodeJoinForm onDone={() => setTogether(null)} />
            </div>
            <p aria-live="polite" className="min-h-5 pt-3 text-[14px] text-pen-orange">
              {sheetNotice}
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
