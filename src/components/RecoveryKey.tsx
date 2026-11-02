"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setRecoveryKey, useRecoveryKey } from "@/lib/prefs";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";

// 10-1 로그인 없이 쓰는 복구 수단: 나만의 열쇠와 복구 링크
// 열쇠를 만들어 두면 다른 브라우저·기기에서 열쇠를 넣었을 때 내 방·일기장·글이 그대로 옮겨온다.

const dateFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" });

export function RecoveryKey() {
  const session = useAnonymousSession();
  const [made, setMade] = useState<string | null | undefined>(undefined); // 만든 날짜
  const saved = useRecoveryKey(); // 이 브라우저에 기억해 둔 열쇠
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    if (session.status !== "ready") return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase.rpc("my_recovery_key").then(({ data, error }) => {
      if (error) setError(`열쇠 정보를 불러오지 못했어요. (${error.message})`);
      setMade((data as string | null) ?? null);
      // 이 계정에 열쇠가 없으면 기억해 둔 것은 더 이상 쓸 수 없는 열쇠다
      if (!error && !data) setRecoveryKey(null);
    });
  }, [session.status]);

  async function create() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("create_recovery_key");
    setBusy(false);
    if (error || !data) {
      setError(`열쇠를 만들지 못했어요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    setRecoveryKey(data as string);
    setMade(new Date().toISOString());
    setConfirmNew(false);
  }

  const link = saved && typeof window !== "undefined" ? `${window.location.origin}/key#${saved}` : "";
  const renew = confirmNew ? (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => setConfirmNew(false)} className="h-11 px-3 text-[14px] text-pencil">
        취소
      </button>
      <button type="button" onClick={create} disabled={busy} className="h-11 rounded-full bg-ink px-5 text-[15px] text-page disabled:opacity-50">
        {busy ? "만드는 중…" : "예전 열쇠 버리고 새로 만들기"}
      </button>
    </div>
  ) : (
    <button type="button" onClick={() => setConfirmNew(true)} className="mt-3 h-11 rounded-full border border-ink px-5 text-[15px] text-ink">
      새 열쇠 만들기
    </button>
  );

  return (
    <div>
      {saved ? (
        <div className="rounded-lg border border-ink px-5 py-5">
          <p className="text-[14px] text-pencil">나만의 열쇠</p>
          <p className="mt-1 break-all font-display text-[28px] tracking-[0.12em] text-ink">{saved}</p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink">
            이 브라우저에서는 언제든 다시 볼 수 있어요. 브라우저를 바꾸거나 방문 기록을 지우면 사라지니, 메모 앱에 적어 두거나 아래 복구 링크를 나에게 보내 두세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton text={saved} label="열쇠 복사" />
            <CopyButton text={link} label="복구 링크 복사" />
          </div>
          <p className="mt-3 break-all text-[13px] text-pencil">{link}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-pen-orange">
            열쇠나 링크를 가진 사람은 내 책과 일기를 가져갈 수 있어요. 다른 사람에게 보여 주지 마세요.
          </p>
          <div className="mt-4 border-t border-rule pt-1">{renew}</div>
        </div>
      ) : made === undefined ? (
        <div className="h-24 rounded-lg bg-rule/25" aria-label="열쇠 정보를 불러오는 중" />
      ) : made ? (
        <div className="border-y border-rule py-5">
          <p className="text-[15px] text-ink">{dateFormat.format(new Date(made))}에 만든 열쇠가 있어요.</p>
          <p className="mt-1 text-[14px] leading-relaxed text-pencil">
            이 브라우저에는 기억해 둔 열쇠가 없어요. 열쇠를 잃어버렸다면 새로 만들 수 있어요. 새로 만들면 예전 열쇠와 링크는 더 이상 쓸 수 없어요.
          </p>
          {renew}
        </div>
      ) : (
        <div className="border-y border-rule py-5">
          <p className="text-[15px] leading-relaxed text-ink">
            아직 열쇠가 없어요. 로그인이 없어서, 브라우저를 바꾸거나 방문 기록을 지우면 내 책·일기장·짝과의 교환일기에 다시 들어갈 수 없어요.
            열쇠를 하나 만들어 두면 다른 브라우저에서도 그대로 이어 쓸 수 있어요.
          </p>
          <button type="button" onClick={create} disabled={busy || session.status !== "ready"} className="mt-4 h-11 rounded-full bg-ink px-6 text-[15px] text-page disabled:opacity-50">
            {busy ? "만드는 중…" : "열쇠 만들기"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[14px] text-pen-orange">
          {error}
        </p>
      )}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="h-10 rounded-full border border-ink px-4 text-[14px] text-ink"
    >
      {copied ? "복사했어요" : label}
    </button>
  );
}

// 다른 브라우저에서 열쇠로 되찾기 (복구 링크 #열쇠 로 들어오면 자동으로 채운다)
export function ClaimKey() {
  const router = useRouter();
  const session = useAnonymousSession();
  const [key, setKey] = useState("");
  const [fromLink, setFromLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const clean = key.toUpperCase().replace(/[^A-Z0-9]/g, "");

  useEffect(() => {
    function readHash() {
      const h = window.location.hash.replace(/^#/, "");
      if (!h) return;
      // 주소창에 열쇠가 남지 않게 지운다
      history.replaceState(null, "", window.location.pathname);
      setKey(decodeURIComponent(h));
      setFromLink(true);
    }
    // 주소의 #열쇠는 브라우저에서만 읽을 수 있어 화면이 뜬 뒤 읽는다 (이미 열린 화면에서 링크를 눌러도)
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase || session.status !== "ready") {
      setError("익명 계정을 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("claim_recovery_key", { p_key: clean });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // 되찾은 열쇠는 이 브라우저에서 계속 쓰이니 여기서도 보이게 기억한다
    setRecoveryKey(`${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`);
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-lg border border-ink px-5 py-5">
        <p className="font-display text-[20px] text-ink">되찾았어요</p>
        <p className="mt-1 text-[15px] leading-relaxed text-pencil">내 책과 일기장을 이 브라우저로 옮겼어요. 이제 이 브라우저에서 이어 쓰면 돼요.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => router.push("/read")} className="h-11 rounded-full border border-ink px-5 text-[15px] text-ink">
            교환독서로
          </button>
          <button type="button" onClick={() => router.push("/diary")} className="h-11 rounded-full bg-ink px-5 text-[15px] text-page">
            교환일기로
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={claim} className={fromLink ? "rounded-lg border border-ink px-5 py-5" : ""}>
      {fromLink && <p className="mb-3 text-[15px] text-ink">복구 링크로 들어왔어요. 이 열쇠로 내 책과 일기장을 되찾을까요?</p>}
      <label htmlFor="recovery-key" className="block text-[14px] text-pencil">
        나만의 열쇠 (12자)
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="recovery-key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="예: K7M2-QX9P-4RTA"
          className="h-12 min-w-0 flex-1 rounded-lg border border-rule bg-page px-4 font-display text-[18px] uppercase tracking-[0.12em] text-ink placeholder:text-[15px] placeholder:tracking-normal placeholder:text-pencil/70 focus:border-ink focus:outline-none"
        />
        <button type="submit" disabled={busy || clean.length !== 12} className="h-12 shrink-0 rounded-full bg-ink px-5 text-[15px] text-page disabled:opacity-40">
          {busy ? "되찾는 중…" : "되찾기"}
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
