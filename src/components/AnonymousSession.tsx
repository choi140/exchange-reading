"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

// 2-8 세션이 없으면 자동으로 익명 로그인 (PRD #4.4)
// 로그인 화면 없이, 처음 접속한 순간 Supabase가 화면 뒤에서 익명 계정을 만든다.

type SessionState =
  | { status: "loading"; userId: null; error: null }
  | { status: "ready"; userId: string; error: null }
  | { status: "error"; userId: null; error: string };

const SessionContext = createContext<SessionState>({
  status: "loading",
  userId: null,
  error: null,
});

export function useAnonymousSession() {
  return useContext(SessionContext);
}

export function AnonymousSession({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    userId: null,
    error: null,
  });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let cancelled = false;

    async function ensureSession() {
      if (!supabase) {
        return {
          status: "error",
          userId: null,
          error: "Supabase 연결 정보(환경변수)가 없어요.",
        } as const;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        return { status: "ready", userId: data.session.user.id, error: null } as const;
      }
      const { data: signedIn, error } = await supabase.auth.signInAnonymously();
      if (error || !signedIn.user) {
        return {
          status: "error",
          userId: null,
          error: `익명 계정을 만들지 못했어요. (${error?.message ?? "알 수 없는 오류"})`,
        } as const;
      }
      return { status: "ready", userId: signedIn.user.id, error: null } as const;
    }

    ensureSession().then((next) => {
      if (!cancelled) setState(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SessionContext.Provider value={state}>
      {children}
      {state.status === "error" && (
        <p
          role="alert"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-pen-orange/40 bg-page px-5 py-3 text-center text-[14px] text-pen-orange"
        >
          {state.error} 새로고침해도 계속되면 잠시 뒤 다시 와 주세요.
        </p>
      )}
    </SessionContext.Provider>
  );
}
