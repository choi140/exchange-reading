"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAnonymousSession } from "./AnonymousSession";
import { CodeJoinForm } from "./CodeJoinForm";
import { ChoiceButton, Sheet } from "./Sheet";

type DiaryRpc = "create_solo_diary" | "find_diary_partner" | "create_private_diary";

// 1-9 "새 일기장" 선택창
// 3-7 혼자 쓰기 → create_solo_diary
// 5-2 / 7-2 교환일기 → 낯선 사람과(find_diary_partner) · 코드로 만들기(create_private_diary) · 코드로 들어가기
export function NewDiaryButton() {
  const router = useRouter();
  const session = useAnonymousSession();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"mode" | "exchange">("mode");
  const [busy, setBusy] = useState<DiaryRpc | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function createDiary(rpc: DiaryRpc) {
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
    setOpen(false);
    setBusy(null);
    router.push(`/diary/${data}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setNotice(null);
          setStep("mode");
          setOpen(true);
        }}
        className="h-10 rounded-full border border-ink px-4 text-[15px] text-ink active:translate-y-px"
      >
        새 일기장
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={step === "mode" ? "어떤 일기장을 만들까요?" : "누구와 교환일기를 쓸까요?"}
      >
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3">
          {step === "mode" ? (
            <>
              <ChoiceButton
                title={busy === "create_solo_diary" ? "일기장을 만드는 중…" : "혼자 쓰기"}
                desc="나만 보는 일기장이에요. 언제든 쓸 수 있어요."
                disabled={busy !== null}
                onClick={() => createDiary("create_solo_diary")}
              />
              <ChoiceButton
                title="교환일기"
                desc="짝과 한 편씩 번갈아 써요. 낯선 사람과도, 아는 사람과도 쓸 수 있어요."
                disabled={busy !== null}
                onClick={() => {
                  setNotice(null);
                  setStep("exchange");
                }}
              />
            </>
          ) : (
            <>
              <ChoiceButton
                title={busy === "find_diary_partner" ? "짝을 찾는 중…" : "낯선 사람과 쓰기"}
                desc="교환일기를 기다리는 사람이 있으면 바로 짝이 돼요. 없으면 올 때까지 기다려요."
                disabled={busy !== null}
                onClick={() => createDiary("find_diary_partner")}
              />
              <ChoiceButton
                title={busy === "create_private_diary" ? "일기장을 만드는 중…" : "코드로 일기장 만들기"}
                desc="아는 사람과 써요. 6자리 참여 코드가 생기면 친구에게 보내 주세요."
                disabled={busy !== null}
                onClick={() => createDiary("create_private_diary")}
              />
              <div className="rounded-lg border border-rule bg-paper/60 px-4 py-4">
                <CodeJoinForm onDone={() => setOpen(false)} />
              </div>
              <button
                type="button"
                onClick={() => setStep("mode")}
                className="h-10 text-left text-[14px] text-pencil underline underline-offset-4"
              >
                처음으로
              </button>
            </>
          )}
          <p aria-live="polite" className="min-h-5 text-[14px] text-pen-orange">
            {notice}
          </p>
        </div>
      </Sheet>
    </>
  );
}
