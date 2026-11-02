"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";

// 7-2 참여 코드로 들어가기: 함께 읽기 방이든 교환일기장이든 코드 하나로 들어간다
export function CodeJoinForm({ onDone, pill = false }: { onDone?: () => void; pill?: boolean }) {
  const router = useRouter();
  const session = useAnonymousSession();
  const fieldId = useId();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase || session.status !== "ready") {
      setError("익명 계정을 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("join_by_code", { p_code: clean });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) {
      setBusy(false);
      setError(error?.message ?? "없는 코드예요. 코드를 다시 확인해 주세요");
      return;
    }
    onDone?.();
    router.push(row.kind === "room" ? `/room/${row.id}` : `/diary/${row.id}`);
  }

  // 17-2 처음 화면: 입력칸과 동그란 버튼이 한 덩어리인 모양
  if (pill) {
    return (
      <form onSubmit={join}>
        <div className="flex h-14 items-center rounded-full border border-ink bg-page pl-5 pr-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-pen-blue">
          <label htmlFor={fieldId} className="sr-only">
            친구에게 받은 6자리 참여 코드
          </label>
          <input
            id={fieldId}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={12}
            placeholder="참여 코드 6자리"
            className="min-w-0 flex-1 bg-transparent text-[16px] uppercase text-ink placeholder:normal-case placeholder:text-pencil focus:outline-none"
          />
          <button
            type="submit"
            aria-label="참여 코드로 들어가기"
            disabled={busy || clean.length !== 6}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-page disabled:opacity-40"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-[14px] text-pen-orange">
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={join}>
      <label htmlFor={fieldId} className="block text-[14px] text-pencil">
        친구에게 받은 6자리 참여 코드
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id={fieldId}
          data-invite-code
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={12}
          placeholder="예: K7M2QX"
          className="h-12 min-w-0 flex-1 rounded-lg border border-rule bg-page px-4 font-display text-[20px] uppercase tracking-[0.2em] text-ink placeholder:text-[15px] placeholder:tracking-normal placeholder:text-pencil/70 focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || clean.length !== 6}
          className="h-12 shrink-0 rounded-full bg-ink px-5 text-[15px] text-page disabled:opacity-40"
        >
          {busy ? "들어가는 중…" : "들어가기"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[14px] text-pen-orange">
          {error}
        </p>
      )}
    </form>
  );
}

// 방·일기장 위에 보여 주는 참여 코드와 복사 버튼
export function InviteCode({ code, note }: { code: string; note: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 rounded-lg border border-dashed border-pencil/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p>
          <span className="block text-[13px] text-pencil">참여 코드</span>
          <span className="font-display text-[24px] tracking-[0.2em] text-ink">{code}</span>
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
          className="h-10 shrink-0 rounded-full border border-ink px-4 text-[14px] text-ink"
        >
          {copied ? "복사했어요" : "코드 복사"}
        </button>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-pencil">{note}</p>
    </div>
  );
}
