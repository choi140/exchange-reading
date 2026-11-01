"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Book } from "@/data/books";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";

type ShelfBook = Omit<Book, "paragraphs">;

// 1-7 책 목록 + 1-8 "혼자 읽기"·"함께 읽기" 버튼
// 3-2 혼자 읽기 → start_solo_room으로 내 혼자 방을 찾거나 만들고 이동
// 4-3 함께 읽기 → join_room으로 배정된 방으로 이동
export function BookShelf({ books }: { books: ShelfBook[] }) {
  const router = useRouter();
  const session = useAnonymousSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function openRoom(book: ShelfBook, mode: "solo" | "together") {
    const supabase = getBrowserSupabase();
    if (!supabase || session.status !== "ready") {
      setNotice("익명 계정을 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      return;
    }
    setBusy(`${book.id}:${mode}`);
    setNotice(null);
    const { data, error } = await supabase.rpc(
      mode === "solo" ? "start_solo_room" : "join_room",
      { p_book_id: book.id },
    );
    if (error || !data) {
      setBusy(null);
      setNotice(`방을 열지 못했어요. 다시 눌러 주세요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    router.push(`/room/${data}`);
  }

  return (
    <div>
      <ul className="border-t border-rule">
        {books.map((book) => (
          <li key={book.id} className="border-b border-rule py-5">
            <p className="font-serif text-[22px] leading-snug text-ink">
              {book.title}
            </p>
            <p className="mt-1 text-[14px] text-pencil">
              {book.author}
              {book.year ? `, ${book.year}년` : ""}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => openRoom(book, "solo")}
                className="h-11 flex-1 rounded-full border border-ink bg-ink px-4 text-[15px] text-page disabled:opacity-60 active:translate-y-px sm:flex-none"
              >
                {busy === `${book.id}:solo` ? "방을 여는 중…" : "혼자 읽기"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => openRoom(book, "together")}
                className="h-11 flex-1 rounded-full border border-ink px-4 text-[15px] text-ink disabled:opacity-60 active:translate-y-px sm:flex-none"
              >
                {busy === `${book.id}:together` ? "자리를 찾는 중…" : "함께 읽기"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="min-h-6 pt-3 text-[14px] text-pencil">
        {notice}
      </p>
    </div>
  );
}
