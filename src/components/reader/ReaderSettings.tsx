"use client";

import { useState } from "react";
import { setPrefs, usePrefs, type ReaderView, type TextSize } from "@/lib/prefs";
import { Sheet } from "../Sheet";

// 7-1 읽기 방식 · 7-4 글자 크기 · 밤 모드
export function ReaderSettingsButton() {
  const [open, setOpen] = useState(false);
  const prefs = usePrefs();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-full border border-rule px-3 text-[14px] text-ink"
        aria-label="읽기 설정"
      >
        보기 설정
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="읽기 설정">
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6">
          <Segment<ReaderView>
            label="읽는 방식"
            value={prefs.view}
            onChange={(view) => setPrefs({ view })}
            options={[
              { value: "scroll", label: "스크롤", hint: "위아래로 쭉 내려 읽기" },
              { value: "page", label: "페이지", hint: "좌우로 밀어 한 쪽씩 넘기기" },
            ]}
          />
          <Segment<TextSize>
            label="글자 크기"
            value={prefs.size}
            onChange={(size) => setPrefs({ size })}
            options={[
              { value: "s", label: "작게" },
              { value: "m", label: "보통" },
              { value: "l", label: "크게" },
            ]}
          />
          <Segment<"day" | "night">
            label="화면"
            value={prefs.night ? "night" : "day"}
            onChange={(v) => setPrefs({ night: v === "night" })}
            options={[
              { value: "day", label: "낮" },
              { value: "night", label: "밤", hint: "어두운 바탕" },
            ]}
          />
        </div>
      </Sheet>
    </>
  );
}

function Segment<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-[14px] text-pencil">{label}</legend>
      <div className="mt-2 flex gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`min-h-12 flex-1 rounded-lg border px-3 py-2 text-left ${
                on ? "border-ink bg-ink text-page" : "border-rule bg-paper/60 text-ink"
              }`}
            >
              <span className="block text-[15px]">{o.label}</span>
              {o.hint && <span className={`block text-[12px] ${on ? "text-page/80" : "text-pencil"}`}>{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// 홈 등에서 쓰는 밤 모드 켜고 끄기
export function NightToggle() {
  const prefs = usePrefs();
  return (
    <button
      type="button"
      aria-pressed={prefs.night}
      onClick={() => setPrefs({ night: !prefs.night })}
      className="h-10 rounded-full border border-rule px-4 text-[15px] text-ink"
    >
      {prefs.night ? "낮 모드로" : "밤 모드로"}
    </button>
  );
}
