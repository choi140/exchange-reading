"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// 7-1 페이지로 넘겨 읽기
// - 화면 높이에 맞게 항목(0번 = 책 머리, 1번부터 = 문단)을 쪽으로 나눈다. 문단을 쪼개지 않는다(메모가 문단에 붙어 있어서).
// - 한 문단이 한 쪽보다 길면 그 문단이 한 쪽을 혼자 쓰고, 쪽 안에서 스크롤된다.
// - 넘기기: 좌우로 밀기(스와이프), 아래 ‹ › 버튼, 키보드 ← →
// - 글자 크기·화면 크기가 바뀌면 다시 나누되, 보던 문단은 유지한다.

const PAD_Y = 24; // 쪽 위아래 여백 (py-6)

export function Paged({
  itemCount,
  renderItem,
  renderList,
  measureKey,
  anchorItem,
  onAnchorChange,
}: {
  itemCount: number;
  // measuring=true면 메모 창 없이 접힌 모양으로 그린다 (쪽 나누기용)
  renderItem: (i: number, measuring: boolean) => React.ReactNode;
  // 문단 항목들을 감싸는 목록(붉은 여백선)
  renderList: (children: React.ReactNode) => React.ReactNode;
  measureKey: string;
  anchorItem: number;
  onAnchorChange: (item: number) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][] | null>(null);
  const [dir, setDir] = useState<"next" | "prev" | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const touch = useRef<{ x: number; y: number } | null>(null);

  // 쪽 영역 크기 관찰
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 글꼴이 늦게 들어오면 높이가 달라지므로 다시 잰다
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady(true));
  }, []);

  useLayoutEffect(() => {
    const box = measureRef.current;
    if (!box || size.h === 0) return;
    const items = Array.from(box.querySelectorAll<HTMLElement>("[data-item]"));
    const budget = size.h - PAD_Y * 2 - 8;
    const next: number[][] = [];
    let cur: number[] = [];
    let used = 0;
    for (const el of items) {
      const i = Number(el.dataset.item);
      const h = el.getBoundingClientRect().height;
      if (cur.length > 0 && used + h > budget) {
        next.push(cur);
        cur = [];
        used = 0;
      }
      cur.push(i);
      used += h;
    }
    if (cur.length) next.push(cur);
    setPages(next);
  }, [size.w, size.h, measureKey, fontsReady, itemCount]);

  const pageIndex = useMemo(() => {
    if (!pages) return 0;
    const found = pages.findIndex((p) => p.includes(anchorItem));
    return found === -1 ? 0 : found;
  }, [pages, anchorItem]);

  const go = useCallback(
    (delta: 1 | -1) => {
      if (!pages) return;
      const target = pageIndex + delta;
      if (target < 0 || target >= pages.length) return;
      setDir(delta === 1 ? "next" : "prev");
      onAnchorChange(pages[target][0]);
      areaRef.current?.scrollTo({ top: 0 });
    },
    [pages, pageIndex, onAnchorChange],
  );

  // 키보드 ← → (글을 쓰는 중이면 무시)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const current = pages?.[pageIndex] ?? [];
  const hasHeader = current.includes(0);
  const paragraphItems = current.filter((i) => i !== 0);
  const total = pages?.length ?? 0;

  return (
    <>
      <div
        ref={areaRef}
        data-page-area
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-page"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          // 문장을 고르는 중(밑줄 긋기)이면 넘기지 않는다
          if (window.getSelection()?.toString()) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* 쪽 나누기용으로 보이지 않게 그려 높이를 잰다 */}
        <div ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0">
          <div data-item={0}>{renderItem(0, true)}</div>
          {renderList(
            Array.from({ length: itemCount - 1 }, (_, k) => (
              <div key={k + 1} data-item={k + 1}>
                {renderItem(k + 1, true)}
              </div>
            )),
          )}
        </div>

        {pages && (
          <div
            key={pageIndex}
            className={`py-6 ${dir === "next" ? "page-next" : dir === "prev" ? "page-prev" : ""}`}
            aria-live="polite"
          >
            {hasHeader && renderItem(0, false)}
            {paragraphItems.length > 0 &&
              renderList(paragraphItems.map((i) => <div key={i}>{renderItem(i, false)}</div>))}
          </div>
        )}
      </div>

      {/* 쪽 넘김 막대 */}
      <div className="shrink-0 border-t border-rule bg-paper">
        <div
          className="h-0.5 bg-ink/70 transition-[width] duration-200"
          style={{ width: total ? `${((pageIndex + 1) / total) * 100}%` : "0%" }}
        />
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={pageIndex === 0}
            className="h-11 min-w-20 rounded-full px-4 text-[15px] text-ink disabled:text-rule"
          >
            ‹ 이전
          </button>
          <span className="text-[14px] tabular-nums text-pencil">
            {total ? `${pageIndex + 1} / ${total}쪽` : ""}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={pageIndex >= total - 1}
            className="h-11 min-w-20 rounded-full px-4 text-[15px] text-ink disabled:text-rule"
          >
            다음 ›
          </button>
        </div>
      </div>
    </>
  );
}
