"use client";

import { useSyncExternalStore } from "react";
// 7-1 / 7-4 읽기 설정: 이 브라우저에 기억한다 (익명 계정도 브라우저 단위라 같은 범위)
export type ReaderView = "scroll" | "page";
export type TextSize = "s" | "m" | "l";
export type Prefs = { view: ReaderView; size: TextSize; night: boolean };

import { PREFS_KEY as KEY } from "./theme-boot";

const DEFAULT: Prefs = { view: "scroll", size: "m", night: false };
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
    cache = { ...DEFAULT, ...(raw ? JSON.parse(raw) : {}) };
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

export const TEXT_SIZE_PX: Record<TextSize, number> = { s: 16, m: 18, l: 21 };

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
