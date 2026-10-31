"use client";

import Link from "next/link";
import { useState } from "react";
import type { Book } from "@/data/books";

// 1-7 책 목록 + 1-8 "혼자 읽기"·"함께 읽기" 버튼 (기능은 3·4단계에서 연결)
export function BookShelf({ books }: { books: Book[] }) {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <ul className="border-t border-rule">
        {books.map((book) => (
          <li key={book.id} className="border-b border-rule py-5">
            <Link
              href={`/room/${book.id}`}
              className="group block rounded-sm"
            >
              <span className="font-serif text-[22px] leading-snug text-ink group-hover:underline group-hover:decoration-pen-blue group-hover:decoration-2 group-hover:underline-offset-4">
                {book.title}
              </span>
              <span className="mt-1 block text-[14px] text-pencil">
                {book.author}, {book.year}년
              </span>
            </Link>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setNotice(`「${book.title}」 혼자 읽기는 곧 열려요.`)
                }
                className="h-11 flex-1 rounded-full border border-ink bg-ink px-4 text-[15px] text-page active:translate-y-px sm:flex-none"
              >
                혼자 읽기
              </button>
              <button
                type="button"
                onClick={() =>
                  setNotice(`「${book.title}」 함께 읽기는 곧 열려요.`)
                }
                className="h-11 flex-1 rounded-full border border-ink px-4 text-[15px] text-ink active:translate-y-px sm:flex-none"
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
    </div>
  );
}
