"use client";

import { useState } from "react";
import { setPrefs, TEXT_PX_MAX, TEXT_PX_MIN, TEXT_PX_PRESETS, usePrefs, type ReaderView } from "@/lib/prefs";
import { Sheet } from "../Sheet";

// 7-1 읽기 방식 · 7-4/13-3 글자 크기 · 밤 모드
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
          <TextPxField value={prefs.textPx} />
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

// 13-3 글자 크기를 픽셀로: 직접 입력하거나 ± 또는 자주 쓰는 크기로
function TextPxField({ value }: { value: number }) {
  const [draft, setDraft] = useState<string | null>(null); // 입력하는 중의 값 (지우는 중에 칸이 되돌아가지 않게)
  const inRange = (n: number) => n >= TEXT_PX_MIN && n <= TEXT_PX_MAX;
  const clamp = (n: number) => Math.min(TEXT_PX_MAX, Math.max(TEXT_PX_MIN, Math.round(n)));
  const stepClass = "h-12 w-12 shrink-0 rounded-lg border border-rule bg-paper/60 text-[20px] text-ink disabled:opacity-40";
  return (
    <fieldset>
      <legend className="text-[14px] text-pencil">
        글자 크기 ({TEXT_PX_MIN}~{TEXT_PX_MAX}px)
      </legend>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" aria-label="글자 1px 작게" onClick={() => setPrefs({ textPx: clamp(value - 1) })} disabled={value <= TEXT_PX_MIN} className={stepClass}>
          −
        </button>
        <label className="flex h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-rule bg-page px-3 focus-within:border-ink">
          <span className="sr-only">글자 크기 픽셀</span>
          <input
            type="number"
            inputMode="numeric"
            min={TEXT_PX_MIN}
            max={TEXT_PX_MAX}
            value={draft ?? value}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = Number(e.target.value);
              if (e.target.value && inRange(n)) setPrefs({ textPx: Math.round(n) });
            }}
            onBlur={() => {
              const n = Number(draft);
              if (draft && Number.isFinite(n)) setPrefs({ textPx: clamp(n) });
              setDraft(null);
            }}
            className="w-14 bg-transparent text-right text-[17px] tabular-nums text-ink focus:outline-none"
          />
          <span className="text-[15px] text-pencil">px</span>
        </label>
        <button type="button" aria-label="글자 1px 크게" onClick={() => setPrefs({ textPx: clamp(value + 1) })} disabled={value >= TEXT_PX_MAX} className={stepClass}>
          +
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        {TEXT_PX_PRESETS.map((p) => (
          <button
            key={p.px}
            type="button"
            aria-pressed={p.px === value}
            onClick={() => setPrefs({ textPx: p.px })}
            className={`h-10 flex-1 rounded-lg border text-[14px] ${p.px === value ? "border-ink bg-ink text-page" : "border-rule bg-paper/60 text-ink"}`}
          >
            {p.label} {p.px}
          </button>
        ))}
      </div>
    </fieldset>
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
