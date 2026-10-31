"use client";

import { useState, useSyncExternalStore } from "react";
import { questionFor } from "@/data/questions";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Entry } from "./DiaryView";

const MAX = 1000;
const noop = () => () => {};

// 1-12 쓰기 창 + 1-13 오늘의 질문 + 3-8 diary_entries에 저장 (1,000자, 그날의 질문도 같이)
export function DiaryWriter({
  diaryId,
  onSaved,
}: {
  diaryId: string;
  onSaved: (entry: Entry) => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // 날짜는 접속한 순간 기준으로 고른다 (빌드 시점 날짜로 굳지 않게)
  const question = useSyncExternalStore(noop, () => questionFor(), () => "");

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
        <p className="text-[14px] text-pencil">오늘의 질문</p>
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
        className="notebook-lines mt-5 block w-full resize-y rounded-sm border border-rule px-4 pt-0 pb-0 font-serif text-[17px] text-ink placeholder:text-pencil/70 focus:border-ink focus:outline-none"
      />

      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-[13px] tabular-nums text-pencil">
          {body.length.toLocaleString()} / {MAX.toLocaleString()}자
        </span>
        <button
          type="submit"
          disabled={saving || body.trim().length === 0}
          className="h-11 rounded-full bg-ink px-6 text-[15px] text-page disabled:opacity-40 active:translate-y-px"
        >
          {saving ? "남기는 중…" : "일기 남기기"}
        </button>
      </div>
      <p aria-live="polite" className={`mt-2 min-h-6 text-[14px] ${error ? "text-pen-orange" : "text-pencil"}`}>
        {error ?? (saved ? "일기를 남겼어요. 아래 지난 일기에 들어갔어요." : "")}
      </p>
    </form>
  );
}
