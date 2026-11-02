"use client";

import { useState } from "react";
import { CodeJoinForm } from "./CodeJoinForm";
import { Sheet } from "./Sheet";

// 7-2 홈에서 바로 참여 코드 입력 (책 방이든 교환일기든)
export function HomeCodeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-full border border-ink px-4 text-[15px] text-ink active:translate-y-px"
      >
        참여 코드로 들어가기
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="참여 코드로 들어가기">
        <p className="mt-2 text-[14px] leading-relaxed text-pencil">
          친구가 만든 함께 읽기 방이나 교환일기에 들어가요.
        </p>
        <div className="mt-4">
          <CodeJoinForm onDone={() => setOpen(false)} />
        </div>
      </Sheet>
    </>
  );
}
