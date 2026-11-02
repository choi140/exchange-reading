"use client";

import { useEffect, useRef, useState } from "react";
import { setPrefs, usePrefs } from "@/lib/prefs";

// 16-1 듣기: 브라우저에 들어 있는 음성(Web Speech API)으로 지금 읽는 문단부터 차례로 읽어 준다.
// - 긴 글을 한 번에 넘기면 브라우저가 중간에 끊을 수 있어 문장 단위로 나눠 읽는다.
// - 일시정지는 기기마다 잘 안 되어서, 멈출 때 지우고 이어 들을 때 그 문장부터 다시 읽는다.

const RATES = [0.8, 1, 1.2, 1.5];
const MAX_CHUNK = 160;

function splitSpeech(text: string): string[] {
  const chunks: string[] = [];
  for (const sentence of text.match(/[^.!?…]+[.!?…]*["”’']?\s*/g) ?? [text]) {
    let rest = sentence.trim();
    while (rest.length > MAX_CHUNK) {
      const cut = Math.max(rest.lastIndexOf(",", MAX_CHUNK), rest.lastIndexOf(" ", MAX_CHUNK));
      const at = cut > 0 ? cut + 1 : MAX_CHUNK;
      chunks.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) chunks.push(rest);
  }
  return chunks.length ? chunks : [text];
}

function readVoices() {
  if (!("speechSynthesis" in window)) return { supported: false, total: 0, korean: [] as SpeechSynthesisVoice[] };
  const all = window.speechSynthesis.getVoices();
  return { supported: true, total: all.length, korean: all.filter((v) => v.lang.toLowerCase().startsWith("ko")) };
}

export function ReadAloud({
  paragraphs,
  start,
  bottomOffset,
  onParagraph,
  onClose,
}: {
  paragraphs: string[];
  start: number;
  bottomOffset: number;
  onParagraph: (p: number) => void;
  onClose: () => void;
}) {
  const prefs = usePrefs();
  const [voices, setVoices] = useState(readVoices);
  const [para, setPara] = useState(Math.max(0, start));
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chunk = useRef(0); // 이 문단에서 읽는 중인 조각
  const notify = useRef(onParagraph);

  const voice = voices.korean.find((v) => v.voiceURI === prefs.ttsVoice) ?? voices.korean[0] ?? null;
  // 목소리 목록이 아직 비어 있으면 기기가 불러오는 중일 수 있어 일단 읽어 본다
  const unavailable = !voices.supported || (voices.total > 0 && voices.korean.length === 0);
  const rate = prefs.ttsRate;

  useEffect(() => {
    notify.current = onParagraph;
  }, [onParagraph]);

  useEffect(() => {
    if (!voices.supported) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(readVoices());
    synth.addEventListener("voiceschanged", load);
    return () => synth.removeEventListener("voiceschanged", load);
  }, [voices.supported]);

  useEffect(() => {
    notify.current(para);
  }, [para]);

  useEffect(() => {
    if (!playing || unavailable) return;
    const synth = window.speechSynthesis;
    const chunks = splitSpeech(paragraphs[para]);
    let alive = true;

    function speak(i: number) {
      chunk.current = i;
      const u = new SpeechSynthesisUtterance(chunks[i]);
      u.lang = "ko-KR";
      u.rate = rate;
      if (voice) u.voice = voice;
      u.onend = () => {
        if (!alive) return;
        if (i + 1 < chunks.length) {
          speak(i + 1);
          return;
        }
        chunk.current = 0;
        if (para + 1 < paragraphs.length) {
          setPara(para + 1);
        } else {
          setPlaying(false);
          setFinished(true);
        }
      };
      u.onerror = (e) => {
        if (!alive || e.error === "canceled" || e.error === "interrupted") return;
        setError("소리를 내지 못했어요. 기기의 음성 설정을 확인해 주세요.");
        setPlaying(false);
      };
      synth.speak(u);
    }

    // cancel 바로 뒤에 말하면 씹히는 브라우저가 있어 조금 기다린다
    const timer = setTimeout(() => speak(Math.min(chunk.current, chunks.length - 1)), 80);
    return () => {
      alive = false;
      clearTimeout(timer);
      synth.cancel();
    };
  }, [paragraphs, para, playing, rate, voice, unavailable]);

  function move(delta: number) {
    chunk.current = 0;
    setFinished(false);
    setError(null);
    setPara((p) => Math.min(paragraphs.length - 1, Math.max(0, p + delta)));
    setPlaying(true);
  }

  const nextRate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
  const stepClass = "h-11 w-11 shrink-0 rounded-full border border-rule text-[20px] text-ink disabled:opacity-40";

  return (
    <div
      role="region"
      aria-label="듣기"
      className="fixed inset-x-0 z-20 mx-auto w-[min(600px,calc(100%-1.5rem))] rounded-2xl border border-rule bg-page px-3 py-2 shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
      style={{ bottom: bottomOffset }}
    >
      {unavailable ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[14px] leading-relaxed text-ink">
            {voices.supported ? "이 기기에는 한국어 음성이 없어 들을 수 없어요." : "이 브라우저에서는 들을 수 없어요."}
          </p>
          <button type="button" onClick={onClose} className="h-11 shrink-0 px-2 text-[14px] text-pencil">
            닫기
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 px-1">
            <p aria-live="polite" className="text-[13px] tabular-nums text-pencil">
              {error ?? (finished ? "끝까지 읽었어요" : `${para + 1} / ${paragraphs.length}문단`)}
            </p>
            {voices.korean.length > 1 && (
              <select
                aria-label="목소리"
                value={voice?.voiceURI ?? ""}
                onChange={(e) => setPrefs({ ttsVoice: e.target.value })}
                className="h-8 min-w-0 max-w-[60%] rounded-lg border border-rule bg-page px-2 text-[13px] text-ink"
              >
                {voices.korean.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <button type="button" aria-label="앞 문단" onClick={() => move(-1)} disabled={para === 0} className={stepClass}>
              ‹
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setFinished(false);
                setPlaying((v) => !v);
              }}
              className="h-11 min-w-0 flex-1 rounded-full bg-ink px-3 text-[15px] text-page"
            >
              {playing ? "멈추기" : "이어 듣기"}
            </button>
            <button type="button" aria-label="다음 문단" onClick={() => move(1)} disabled={para >= paragraphs.length - 1} className={stepClass}>
              ›
            </button>
            <button
              type="button"
              aria-label={`읽는 속도 ${rate}배, 누르면 ${nextRate}배로`}
              onClick={() => setPrefs({ ttsRate: nextRate })}
              className="h-11 shrink-0 rounded-full border border-rule px-3 text-[14px] tabular-nums text-ink"
            >
              {rate}배
            </button>
            <button type="button" onClick={onClose} className="h-11 shrink-0 px-1 text-[14px] text-pencil">
              닫기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
