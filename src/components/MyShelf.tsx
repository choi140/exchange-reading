"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { getLastSeen } from "@/lib/prefs";
import { PEN, type PenColor } from "./PenChip";

// 3-6 홈 "내 책": 내가 들어간 방 목록 (PRD #4.3) + 7-5/9-7 새 밑줄·답글 수
type MyRoom = {
  pen_color: PenColor;
  room: {
    id: string;
    mode: "solo" | "together";
    created_at: string;
    book: { title: string; author: string } | null;
  } | null;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rooms: MyRoom[]; fresh: Record<string, number>; asked: Set<string> };

export function MyShelf() {
  const session = useAnonymousSession();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (session.status !== "ready") return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("room_members")
        .select("pen_color, room:rooms(id, mode, created_at, book:books(title, author))")
        .eq("user_id", session.userId)
        .order("joined_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setState({ status: "error", message: error.message });
        return;
      }
      const rooms = (data ?? []) as unknown as MyRoom[];
      // 7-5 함께 읽기 방마다 내가 마지막으로 본 뒤 남이 쓴 메모·답글 수
      const togetherIds = rooms.filter((r) => r.room?.mode === "together").map((r) => r.room!.id);
      const fresh: Record<string, number> = {};
      const asked = new Set<string>(); // 12-1 내 답을 기다리는 다음 책 제안
      if (togetherIds.length) {
        // 9-7 새 밑줄·답글 수 (문단 메모는 더 이상 쓰지 않는다)
        const [hl, rp, nx] = await Promise.all([
          supabase.from("highlights").select("room_id, created_at").in("room_id", togetherIds).neq("user_id", session.userId),
          supabase.from("highlight_replies").select("room_id, created_at").in("room_id", togetherIds).neq("user_id", session.userId),
          supabase.from("room_next").select("room_id, agreed").in("room_id", togetherIds).is("next_room_id", null),
        ]);
        for (const n of nx.error ? [] : (nx.data ?? [])) {
          const pen = rooms.find((r) => r.room?.id === n.room_id)?.pen_color;
          if (pen && !(n.agreed as string[]).includes(pen)) asked.add(n.room_id as string);
        }
        for (const n of [...(hl.error ? [] : (hl.data ?? [])), ...(rp.error ? [] : (rp.data ?? []))]) {
          const seen = getLastSeen(n.room_id as string);
          if (seen && (n.created_at as string) > seen) fresh[n.room_id as string] = (fresh[n.room_id as string] ?? 0) + 1;
        }
      }
      if (!cancelled) setState({ status: "ready", rooms, fresh, asked });
    })();
    return () => {
      cancelled = true;
    };
  }, [session.status, session.userId]);

  if (session.status === "error") return null;
  if (state.status === "loading") {
    return <div aria-label="내 책을 불러오는 중" className="mt-3 h-16 border-y border-rule bg-rule/20" />;
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="mt-3 border-y border-rule py-6 text-[15px] text-pen-orange">
        내 책을 불러오지 못했어요. 새로고침해 주세요. ({state.message})
      </p>
    );
  }
  const rooms = state.rooms.filter((r) => r.room);
  if (rooms.length === 0) {
    return (
      <p className="mt-3 border-y border-rule py-6 text-[15px] leading-relaxed text-pencil">
        아직 읽고 있는 책이 없어요. 책장에서 한 권 골라 읽기를 시작해 보세요.
      </p>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-rule rounded-2xl bg-page px-4 sm:px-5">
      {rooms.map(({ room, pen_color }) => (
        <li key={room!.id}>
          <Link href={`/room/${room!.id}`} className="flex items-baseline justify-between gap-4 py-4">
            <span>
              <span className="block font-display text-[18px] text-ink">{room!.book?.title}</span>
              <span className="mt-0.5 block text-[14px] text-pencil">
                {room!.mode === "solo" ? "혼자 읽기" : "함께 읽기"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              {state.asked.has(room!.id) && <span className="rounded-full border border-ink px-3 py-1 text-[13px] text-ink">다음 책 제안</span>}
              {state.fresh[room!.id] > 0 && (
                <span className="rounded-full bg-ink px-3 py-1 text-[13px] text-page">새 밑줄 {state.fresh[room!.id]}</span>
              )}
              <span className={`font-serif text-[15px] ${PEN[pen_color].className}`}>{PEN[pen_color].label}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
