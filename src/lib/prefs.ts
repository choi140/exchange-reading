"use client";

import { useSyncExternalStore } from "react";
// 7-1 / 7-4 읽기 설정: 이 브라우저에 기억한다 (익명 계정도 브라우저 단위라 같은 범위)
export type ReaderView = "scroll" | "page";
export type PageSpread = "auto" | "one" | "two"; // 14-1 페이지 모드에서 한 화면에 볼 쪽 수
export type ShelfView = "list" | "three" | "four"; // 14-3/15-1 책장 배치
export type Prefs = {
  view: ReaderView;
  textPx: number;
  night: boolean;
  pages: PageSpread;
  shelf: ShelfView;
  ttsRate: number; // 16-1 듣기 속도
  ttsVoice: string | null; // 16-1 고른 목소리 (없으면 기기의 첫 한국어 목소리)
};

import { PREFS_KEY as KEY } from "./theme-boot";

// 13-3 글자 크기는 픽셀로. 예전에 고른 작게·보통·크게는 같은 크기로 이어 쓴다
export const TEXT_PX_MIN = 12;
export const TEXT_PX_MAX = 40;
export const TEXT_PX_PRESETS = [
  { px: 16, label: "작게" },
  { px: 18, label: "보통" },
  { px: 21, label: "크게" },
];
const OLD_SIZE_PX: Record<string, number> = { s: 16, m: 18, l: 21 };

const DEFAULT: Prefs = { view: "scroll", textPx: 18, night: false, pages: "auto", shelf: "list", ttsRate: 1, ttsVoice: null };
const listeners = new Set<() => void>();
let cache: Prefs | null = null;
let cacheRaw: string | null = null;

function read(): Prefs {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (cache && raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const saved = raw ? JSON.parse(raw) : {};
    cache = {
      ...DEFAULT,
      ...saved,
      textPx: saved.textPx ?? OLD_SIZE_PX[saved.size] ?? DEFAULT.textPx,
      // 15-1에서 없앤 배치(2열, 표지 크게)를 골라 뒀다면 목록으로
      shelf: saved.shelf === "three" || saved.shelf === "four" ? saved.shelf : DEFAULT.shelf,
    };
  } catch {
    cache = DEFAULT;
  }
  return cache!;
}

export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장이 막힌 브라우저(사생활 모드 등)에서는 이번 화면에서만 적용
    cache = next;
    cacheRaw = "__memory__";
  }
  applyTheme(next.night);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

export function applyTheme(night: boolean) {
  document.documentElement.dataset.theme = night ? "night" : "day";
}

// 7-4 이어 읽기: 방마다 마지막으로 읽던 문단 번호
export function getReadingPosition(roomId: string): number | null {
  try {
    const v = localStorage.getItem(`nb:pos:${roomId}`);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}
export function setReadingPosition(roomId: string, paragraphIndex: number) {
  try {
    localStorage.setItem(`nb:pos:${roomId}`, String(paragraphIndex));
  } catch {}
}

// 7-5 새 메모 표시: 방마다 마지막으로 본 시각
export function getLastSeen(roomId: string): string | null {
  try {
    return localStorage.getItem(`nb:seen:${roomId}`);
  } catch {
    return null;
  }
}
export function setLastSeen(roomId: string, iso: string) {
  try {
    localStorage.setItem(`nb:seen:${roomId}`, iso);
  } catch {}
}

// 11-1 나만의 열쇠: DB에는 해시만 있어 다시 꺼낼 수 없으니, 원문은 이 브라우저에 기억한다
const RECOVERY_KEY = "nb:key";
const keyListeners = new Set<() => void>();
let keyInMemory: string | null = null;

function readRecoveryKey(): string | null {
  try {
    return localStorage.getItem(RECOVERY_KEY);
  } catch {
    return keyInMemory;
  }
}

export function setRecoveryKey(key: string | null) {
  keyInMemory = key;
  try {
    if (key) localStorage.setItem(RECOVERY_KEY, key);
    else localStorage.removeItem(RECOVERY_KEY);
  } catch {
    // 저장이 막힌 브라우저에서는 이번 화면에서만 기억
  }
  keyListeners.forEach((l) => l());
}

function subscribeRecoveryKey(l: () => void) {
  keyListeners.add(l);
  return () => {
    keyListeners.delete(l);
  };
}

export function useRecoveryKey(): string | null {
  return useSyncExternalStore(subscribeRecoveryKey, readRecoveryKey, () => null);
}
