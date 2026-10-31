"use client";

import { useState, useSyncExternalStore } from "react";
import { questionFor } from "@/data/questions";

const MAX = 1000;
const noop = () => () => {};

// 1-12 쓰기 창 + 1-13 오늘의 질문 (저장은 3단계에서 연결)
export function DiaryWriter() {
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  // 날짜는 접속한 순간 기준으로 고른다 (빌드 시점 날짜로 굳지 않게)
  const question = useSyncExternalStore(
    noop,
    () => questionFor(),
    () => "",
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setNotice("저장은 곧 연결돼요. 지금 쓴 글은 새로고침하면 사라져요.");
      }}
    >
      <div className="border-l-2 border-pen-blue pl-4">
        <p className="text-[14px] text-pencil">오늘의 질문</p>
        <p className="mt-1 font-hand text-[26px] leading-snug text-pen-blue">
          {question || "\u00a0"}
        </p>
      </div>

      <label htmlFor="diary-body" className="sr-only">
        오늘의 일기
      </label>
      <textarea
        id="diary-body"
        value={body}
        maxLength={MAX}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        placeholder="질문에 답해도 좋고, 오늘 있었던 일을 적어도 좋아요."
        className="notebook-lines mt-5 block w-full resize-y rounded-sm border border-rule px-4 pt-0 pb-0 font-serif text-[17px] text-ink placeholder:text-pencil/70 focus:border-ink focus:outline-none"
      />

      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-[13px] tabular-nums text-pencil">
          {body.length.toLocaleString()} / {MAX.toLocaleString()}자
        </span>
        <button
          type="submit"
          disabled={body.trim().length === 0}
          className="h-11 rounded-full bg-ink px-6 text-[15px] text-page disabled:opacity-40 active:translate-y-px"
        >
          일기 남기기
        </button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-6 text-[14px] text-pencil">
        {notice}
      </p>
    </form>
  );
}
