"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { PEN, type PenColor } from "./PenChip";

// 3-6 홈 "내 책": 내가 들어간 방 목록 (PRD #4.3)
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
  | { status: "ready"; rooms: MyRoom[] };

export function MyShelf() {
  const session = useAnonymousSession();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (session.status !== "ready") return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("room_members")
      .select("pen_color, room:rooms(id, mode, created_at, book:books(title, author))")
      .eq("user_id", session.userId)
      .order("joined_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setState({ status: "error", message: error.message });
        else setState({ status: "ready", rooms: (data ?? []) as unknown as MyRoom[] });
      });
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
    <ul className="mt-3 border-t border-rule">
      {rooms.map(({ room, pen_color }) => (
        <li key={room!.id} className="border-b border-rule">
          <Link href={`/room/${room!.id}`} className="flex items-baseline justify-between gap-4 py-4">
            <span>
              <span className="block font-serif text-[18px] text-ink">{room!.book?.title}</span>
              <span className="mt-0.5 block text-[14px] text-pencil">
                {room!.mode === "solo" ? "혼자 읽기" : "함께 읽기"}
              </span>
            </span>
            <span className={`shrink-0 font-hand text-[20px] ${PEN[pen_color].className}`}>
              {PEN[pen_color].label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
