"use client";

import { useCallback, useEffect, useRef } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

// 12-2 나의 독서 달력: 앞으로 넘어간 문단 수를 모아 두었다가 가끔씩 저장한다.
const FLUSH_MS = 30_000;
const MAX_STEP = 30; // 한 번에 이보다 많이 건너뛰면 읽은 것으로 치지 않는다 (맨 끝으로 가기 등)

export function useReadingLog(roomId: string) {
  const furthest = useRef<number | null>(null);
  const pending = useRef(0);

  const flush = useCallback(() => {
    const count = pending.current;
    if (count === 0) return;
    pending.current = 0;
    // 기록은 덤이라 실패해도 읽기를 방해하지 않는다 (14_v9.sql을 실행하기 전의 DB 포함)
    getBrowserSupabase()
      ?.rpc("add_reading", { p_room: roomId, p_count: count })
      .then(() => {});
  }, [roomId]);

  useEffect(() => {
    const timer = setInterval(flush, FLUSH_MS);
    window.addEventListener("pagehide", flush);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  const start = useCallback((p: number) => {
    furthest.current = p;
  }, []);

  const move = useCallback((p: number) => {
    const from = furthest.current;
    if (from === null || p <= from) return;
    if (p - from <= MAX_STEP) pending.current += p - from;
    furthest.current = p;
  }, []);

  return { start, move };
}
