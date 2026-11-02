"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Entry } from "./DiaryEntries";

const MAX = 1000;

// 1-12 쓰기 창 + 1-13 오늘의 질문 + 3-8 diary_entries에 저장 (1,000자, 그 질문도 같이)
// 7-3 / 9-3 질문은 일기장 화면(DiaryView)이 정해서 넘겨준다
export function DiaryWriter({
  diaryId,
  question,
  questionLabel,
  onSaved,
}: {
  diaryId: string;
  question: string;
  questionLabel: string;
  onSaved: (entry: Entry) => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const { data, error } = await supabase
      .from("diary_entries")
      .insert({ diary_id: diaryId, prompt: question, body: text })
      .select("id, user_id, prompt, body, created_at")
      .single();
    setSaving(false);
    if (error || !data) {
      setError(`일기를 남기지 못했어요. 다시 눌러 주세요. (${error?.message ?? "응답 없음"})`);
      return;
    }
    onSaved(data as Entry);
    setBody("");
    setSaved(true);
  }

  return (
    <form onSubmit={save}>
      <div className="border-l-2 border-pen-blue pl-4">
        <p className="text-[13px] text-pencil">{questionLabel}</p>
        <p className="mt-1 font-hand text-[26px] leading-snug text-pen-blue">
          {question || " "}
        </p>
      </div>

      <label htmlFor="diary-body" className="sr-only">
        오늘의 일기
      </label>
      <textarea
        id="diary-body"
        value={body}
        maxLength={MAX}
        onChange={(e) => {
          setBody(e.target.value);
          setSaved(false);
        }}
        rows={8}
        placeholder="질문에 답해도 좋고, 오늘 있었던 일을 적어도 좋아요."
        className="notebook-lines mt-5 block w-full resize-y rounded-sm border border-rule px-4 pt-0 pb-0 font-serif text-[15px] text-ink placeholder:text-pencil/70 focus:border-ink focus:outline-none"
      />

      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-[12px] tabular-nums text-pencil">
          {body.length.toLocaleString()} / {MAX.toLocaleString()}자
        </span>
        <button
          type="submit"
          disabled={saving || body.trim().length === 0}
          className="h-11 rounded-full bg-ink px-6 text-[14px] text-page disabled:opacity-40 active:translate-y-px"
        >
          {saving ? "남기는 중…" : "일기 남기기"}
        </button>
      </div>
      <p aria-live="polite" className={`mt-2 min-h-6 text-[13px] ${error ? "text-pen-orange" : "text-pencil"}`}>
        {error ?? (saved ? "일기를 남겼어요. 다음 질문으로 넘어갔어요." : "")}
      </p>
    </form>
  );
}
