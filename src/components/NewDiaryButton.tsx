"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";

// 1-9 "새 일기장" 버튼과 "혼자 쓰기"·"교환일기" 선택창
// 3-7 혼자 쓰기 → create_solo_diary로 일기장을 만들고 이동
// 5-2 교환일기 → find_diary_partner로 짝이 있으면 그 일기장, 없으면 기다리는 일기장으로 이동
export function NewDiaryButton() {
  const router = useRouter();
  const session = useAnonymousSession();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createDiary(mode: "solo" | "exchange") {
    const supabase = getBrowserSupabase();
    if (!supabase || session.status !== "ready") {
      setPicked("익명 계정을 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      return;
    }
    setBusy(true);
    setPicked(mode === "solo" ? "일기장을 만드는 중…" : "짝을 찾는 중…");
    const { data, error } = await supabase.rpc(
      mode === "solo" ? "create_solo_diary" : "find_diary_partner",
    );
    if (error || !data) {
      setBusy(false);
      setPicked(`일기장을 만들지 못했어요. 다시 눌러 주세요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    dialogRef.current?.close();
    setOpen(false);
    setBusy(false);
    setPicked(null);
    router.push(`/diary/${data}`);
  }

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    // 다른 화면으로 넘어가면 Next.js가 이 화면을 지우지 않고 숨겨 두기 때문에,
    // 모달이 열린 채로 남으면 다음 화면 전체가 눌리지 않는다. 숨겨질 때 반드시 닫는다.
    return () => {
      if (d.open) d.close();
    };
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
              onClick={() => createDiary("solo")}
            />
            <ChoiceButton
              title="교환일기"
              desc="낯선 짝과 한 편씩 번갈아 써요. 짝이 없으면 올 때까지 기다려요."
              disabled={busy}
              onClick={() => createDiary("exchange")}
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
