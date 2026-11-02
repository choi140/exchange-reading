"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PageSpread } from "@/lib/prefs";

// 9-6 책처럼 넘기는 페이지 (7-1을 다시 만듦)
// - 글을 CSS 다단(column)으로 흘려 화면 한 장 크기의 쪽으로 나눈다. 문단이 쪽을 넘어가면 다음 쪽으로 이어진다(빈자리 없음).
// - 넘기기: 좌우로 밀기, 화면 왼쪽·오른쪽 가장자리 누르기, 아래 ‹ › 버튼, 키보드 ← →
// - 글자 크기·화면 크기가 바뀌면 다시 나누고, 보던 문단이 있는 쪽으로 돌아간다.
// 13-4 넓은 화면(태블릿 가로, PC)에서는 펼친 책처럼 두 쪽을 함께 보여 준다. page는 화면 한 장(펼침면) 번호다.
// 14-1 보기 설정에서 자동·한 쪽·두 쪽을 고른다. 두 쪽을 골라도 휴대폰처럼 좁으면 한 쪽으로 본다.

const PAD_Y = 28;
const SPREAD_MIN_WIDTH: Record<PageSpread, number> = { auto: 900, two: 700, one: Infinity };

export function BookPager({
  children,
  layoutKey,
  pages,
  anchor,
  jump,
  onAnchorChange,
}: {
  children: React.ReactNode;
  layoutKey: string;
  pages: PageSpread;
  // 지금 보는 문단 (-1 = 책 머리)
  anchor: number;
  // 바깥에서 특정 문단으로 보낼 때 n을 바꾼다 (새 밑줄로 가기, 처음부터 읽기)
  jump: { p: number; n: number };
  onAnchorChange: (p: number) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const turnRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [page, setPage] = useState(0);
  const [columns, setColumns] = useState(1); // 전체 쪽 수
  const [fontsReady, setFontsReady] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  // 다시 나눌 때 돌아갈 문단 (렌더 중이 아니라 effect에서 갱신)
  const anchorRef = useRef(anchor);
  useEffect(() => {
    anchorRef.current = anchor;
  }, [anchor]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady(true));
  }, []);

  const padX = size.w < 640 ? 20 : 32;
  const perView = size.w >= SPREAD_MIN_WIDTH[pages] ? 2 : 1;
  const total = Math.ceil(columns / perView); // 넘길 수 있는 화면 수

  const pageOfEl = useCallback(
    (el: Element | null) => {
      const flow = flowRef.current;
      if (!el || !flow || size.w === 0) return 0;
      const r = el.getClientRects()[0];
      if (!r) return 0;
      return Math.max(0, Math.floor((r.left - flow.getBoundingClientRect().left + 1) / size.w));
    },
    [size.w],
  );
  const pageOfParagraph = useCallback(
    (p: number) => (p < 0 ? 0 : pageOfEl(flowRef.current?.querySelector(`[data-p="${p}"]`) ?? null)),
    [pageOfEl],
  );
  const firstParagraphOn = useCallback(
    (pg: number) => {
      const flow = flowRef.current;
      if (!flow || pg === 0) return pg === 0 ? -1 : 0;
      const left = flow.getBoundingClientRect().left;
      for (const el of flow.querySelectorAll<HTMLElement>("[data-p]")) {
        for (const r of el.getClientRects()) {
          if (Math.floor((r.left - left + 1) / size.w) === pg) return Number(el.dataset.p);
        }
      }
      return -1;
    },
    [size.w],
  );

  // 쪽 수 다시 세기 + 보던 문단으로
  useLayoutEffect(() => {
    const flow = flowRef.current;
    if (!flow || size.w === 0) return;
    const left = flow.getBoundingClientRect().left;
    let maxRight = 0;
    for (const el of flow.querySelectorAll("[data-p], [data-flow-block]")) {
      for (const r of el.getClientRects()) maxRight = Math.max(maxRight, r.right - left);
    }
    // 그려진 글의 위치를 재고 나서 쪽 수·쪽을 정한다 (DOM 측정 뒤 동기화)
    setColumns(Math.max(1, Math.ceil((maxRight + padX) / (size.w / perView))));
    setPage(pageOfParagraph(anchorRef.current));
  }, [size.w, size.h, layoutKey, fontsReady, padX, perView, pageOfParagraph]);

  // 바깥에서 보낸 이동
  useLayoutEffect(() => {
    if (jump.n === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(pageOfParagraph(jump.p));
  }, [jump, pageOfParagraph]);

  const go = useCallback(
    (delta: 1 | -1) => {
      const target = page + delta;
      if (target < 0 || target >= total) return;
      setPage(target);
      // 넘긴 방향에서 살짝 들어오는 움직임 (움직임 줄이기 설정이면 생략)
      if (turnRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        turnRef.current.animate(
          [
            { opacity: 0.2, transform: `translateX(${delta * 24}px)` },
            { opacity: 1, transform: "none" },
          ],
          { duration: 180, easing: "ease-out" },
        );
      }
      onAnchorChange(firstParagraphOn(target));
    },
    [page, total, onAnchorChange, firstParagraphOn],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <>
      <div
        ref={areaRef}
        data-page-area
        className="relative min-h-0 flex-1 overflow-hidden bg-page"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start || window.getSelection()?.toString()) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
        onClick={(e) => {
          // 화면 가장자리를 누르면 넘긴다 (밑줄·버튼·글쓰기 칸은 제외)
          const target = e.target as HTMLElement;
          if (target.closest("[data-hl], button, a, textarea, input, select, label, form")) return;
          if (window.getSelection()?.toString()) return;
          const rect = areaRef.current!.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          if (x < 0.22) go(-1);
          else if (x > 0.78) go(1);
        }}
      >
        {perView === 2 && <div aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-rule" />}
        <div ref={turnRef} className="absolute inset-0">
        <div
          ref={flowRef}
          style={{
            position: "absolute",
            top: PAD_Y,
            left: padX,
            width: Math.max(0, size.w - padX * 2),
            height: Math.max(0, size.h - PAD_Y * 2),
            // 쪽 너비 + 간격이 화면 너비(두 쪽이면 절반)와 같아서, 화면 너비만큼 옮기면 정확히 다음 장이 된다
            columnCount: perView,
            columnGap: padX * 2,
            columnFill: "auto",
            transform: `translateX(${-page * size.w}px)`,
          }}
        >
          {children}
        </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-rule bg-paper">
        <div className="h-0.5 bg-ink/70 transition-[width] duration-200" style={{ width: `${((page + 1) / total) * 100}%` }} />
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <button type="button" onClick={() => go(-1)} disabled={page === 0} className="h-11 min-w-20 rounded-full px-4 text-[15px] text-ink disabled:text-rule">
            ‹ 이전
          </button>
          <span className="text-[14px] tabular-nums text-pencil">
            {perView === 2 && page * 2 + 2 <= columns ? `${page * 2 + 1}–${page * 2 + 2}` : page * perView + 1} / {columns}쪽
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={page >= total - 1}
            className="h-11 min-w-20 rounded-full px-4 text-[15px] text-ink disabled:text-rule"
          >
            다음 ›
          </button>
        </div>
      </div>
    </>
  );
}
