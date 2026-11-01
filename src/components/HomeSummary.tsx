"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";

// 8-1 처음 화면의 두 갈래에 붙는 짧은 요약 (읽는 책 수, 일기장 수와 내 차례)
type Summary = { rooms: number; diaries: number; myTurn: number } | null;

export function useHomeSummary(): Summary {
  const session = useAnonymousSession();
  const [summary, setSummary] = useState<Summary>(null);
  useEffect(() => {
    if (session.status !== "ready") return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    Promise.all([
      supabase.from("room_members").select("room_id", { count: "exact", head: true }).eq("user_id", session.userId),
      supabase.rpc("my_diaries"),
    ]).then(([rooms, diaries]) => {
      if (cancelled) return;
      const list = (diaries.data ?? []) as { my_turn: boolean }[];
      setSummary({ rooms: rooms.count ?? 0, diaries: list.length, myTurn: list.filter((d) => d.my_turn).length });
    });
    return () => {
      cancelled = true;
    };
  }, [session.status, session.userId]);
  return summary;
}
