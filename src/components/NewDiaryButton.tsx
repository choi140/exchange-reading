"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";

// 1-9 "새 일기장" 버튼과 "혼자 쓰기"·"교환일기" 선택창
// 3-7 혼자 쓰기 → create_solo_diary로 일기장을 만들고 이동 (교환일기는 5단계)
export function NewDiaryButton() {
  const router = useRouter();
  const session = useAnonymousSession();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createSolo() {
    const supabase = getBrowserSupabase();
    if (!supabase || session.status !== "ready") {
      setPicked("익명 계정을 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      return;
    }
    setBusy(true);
    setPicked("일기장을 만드는 중…");
    const { data, error } = await supabase.rpc("create_solo_diary");
    if (error || !data) {
      setBusy(false);
      setPicked(`일기장을 만들지 못했어요. 다시 눌러 주세요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    router.push(`/diary/${data}`);
  }

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPicked(null);
          setOpen(true);
        }}
        className="h-10 rounded-full border border-ink px-4 text-[15px] text-ink active:translate-y-px"
      >
        새 일기장
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto mb-0 w-full max-w-[640px] bg-transparent p-0 backdrop:bg-ink/40 sm:mb-auto"
      >
        <div className="rounded-t-2xl bg-page px-6 pb-8 pt-6 sm:rounded-2xl">
          <h2 className="font-serif text-[22px] text-ink">
            어떤 일기장을 만들까요?
          </h2>
          <div className="mt-5 grid gap-3">
            <ChoiceButton
              title="혼자 쓰기"
              desc="나만 보는 일기장이에요. 언제든 쓸 수 있어요."
              disabled={busy}
              onClick={createSolo}
            />
            <ChoiceButton
              title="교환일기"
              desc="낯선 짝과 한 편씩 번갈아 써요. 짝이 없으면 올 때까지 기다려요."
              disabled={busy}
              onClick={() => setPicked("교환일기는 곧 시작할 수 있어요.")}
            />
          </div>
          <p aria-live="polite" className="mt-4 min-h-6 text-[14px] text-pencil">
            {picked}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 h-11 w-full rounded-full text-[15px] text-pencil underline underline-offset-4"
          >
            닫기
          </button>
        </div>
      </dialog>
    </>
  );
}

function ChoiceButton({
  title,
  desc,
  onClick,
  disabled,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-rule bg-paper/60 px-4 py-4 text-left hover:border-ink disabled:opacity-60 active:translate-y-px"
    >
      <span className="block font-serif text-[18px] text-ink">{title}</span>
      <span className="mt-1 block text-[14px] leading-relaxed text-pencil">
        {desc}
      </span>
    </button>
  );
}
