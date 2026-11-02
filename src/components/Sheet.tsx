"use client";

import { useEffect, useRef } from "react";

// 아래에서 올라오는 선택창(모달). 1-9 선택창을 여러 곳에서 쓰려고 분리.
// 화면을 넘어가면 Next.js가 이 화면을 숨겨 두기만 하므로, 숨겨질 때 반드시 닫는다 (3단계 버그 수정 내용 유지).
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    return () => {
      if (d.open) d.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto mb-0 w-full max-w-[640px] bg-transparent p-0 backdrop:bg-ink/40 sm:mb-auto"
    >
      <div className="max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-page px-6 pb-8 pt-6 sm:rounded-2xl">
        <h2 className="font-display text-[21px] text-ink">{title}</h2>
        {children}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-11 w-full rounded-full text-[14px] text-pencil underline underline-offset-4"
        >
          닫기
        </button>
      </div>
    </dialog>
  );
}

export function ChoiceButton({
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
      className="w-full rounded-lg border border-rule bg-paper/60 px-4 py-4 text-left hover:border-ink disabled:opacity-60 active:translate-y-px"
    >
      <span className="block font-display text-[16px] text-ink">{title}</span>
      <span className="mt-1 block text-[13px] leading-relaxed text-pencil">{desc}</span>
    </button>
  );
}
