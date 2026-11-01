"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { CodeJoinForm } from "./CodeJoinForm";
import { ChoiceButton } from "./Sheet";

type DiaryRpc = "create_solo_diary" | "find_diary_partner" | "create_private_diary";

// 8-4 새 일기장 시작하기: 혼자 / 낯선 사람과 / 아는 사람과(코드) / 코드로 들어가기를 한 화면에 바로 보이게
// (3-7 혼자 쓰기, 5-2 교환일기, 7-2 코드 — 1-9 선택창에 2단계로 숨어 있던 것을 펼침)
export function DiaryStarter() {
  const router = useRouter();
  const session = useAnonymousSession();
  const [busy, setBusy] = useState<DiaryRpc | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function start(rpc: DiaryRpc) {
    const supabase = getBrowserSupabase();
    if (!supabase || session.status !== "ready") {
      setNotice("익명 계정을 준비하는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      return;
    }
    setBusy(rpc);
    setNotice(null);
    const { data, error } = await supabase.rpc(rpc);
    if (error || !data) {
      setBusy(null);
      setNotice(`일기장을 만들지 못했어요. 다시 눌러 주세요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    router.push(`/diary/${data}`);
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] border-t border-rule">
      <ChoiceButton
        title={busy === "create_solo_diary" ? "만드는 중…" : "혼자 쓰기"}
        desc="나만 보는 일기장. 언제든 쓸 수 있어요."
        disabled={busy !== null}
        onClick={() => start("create_solo_diary")}
      />
      <ChoiceButton
        title={busy === "find_diary_partner" ? "짝을 찾는 중…" : "낯선 사람과 교환일기"}
        desc="교환일기를 기다리는 사람과 바로 짝이 돼요. 없으면 올 때까지 기다려요."
        disabled={busy !== null}
        onClick={() => start("find_diary_partner")}
      />
      <ChoiceButton
        title={busy === "create_private_diary" ? "만드는 중…" : "아는 사람과 교환일기"}
        desc="6자리 참여 코드가 생겨요. 친구에게 보내면 그 친구가 짝이 돼요."
        disabled={busy !== null}
        onClick={() => start("create_private_diary")}
      />
      <div className="border-b border-rule py-4">
        <CodeJoinForm />
      </div>
      {notice && (
        <p role="alert" className="pt-3 text-[14px] text-pen-orange">
          {notice}
        </p>
      )}
    </div>
  );
}
