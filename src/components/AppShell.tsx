"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HomeCodeButton } from "./HomeCodeButton";
import { Logo } from "./Logo";
import { NightToggle } from "./reader/ReaderSettings";

// 8-2 사이드바: PC(768px 이상)에서는 왼쪽에 늘 보이고, 휴대폰에서는 ☰ 버튼으로 연다.
// 8-3 교환독서(/read)와 교환일기(/diary)를 서로 다른 화면으로 나눈다.

const NAV = [
  { href: "/", label: "처음", desc: "독서와 일기 고르기", match: (p: string) => p === "/" },
  { href: "/read", label: "교환독서", desc: "책을 돌려 읽고 메모 나누기", match: (p: string) => p.startsWith("/read") || p.startsWith("/room") },
  { href: "/diary", label: "교환일기", desc: "혼자 또는 짝과 번갈아 쓰기", match: (p: string) => p.startsWith("/diary") },
  { href: "/calendar", label: "나의 독서 달력", desc: "읽고 쓴 날이 조용히 쌓여요", match: (p: string) => p.startsWith("/calendar") },
  { href: "/key", label: "나만의 열쇠", desc: "다른 브라우저에서 이어 쓰기", match: (p: string) => p.startsWith("/key") },
];

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} className="inline-block px-1 pt-2">
        <Logo size="sm" />
      </Link>
      <nav aria-label="주 메뉴" className="mt-10">
        <ul className="border-t border-rule">
          {NAV.map((item) => {
            const on = item.match(pathname);
            return (
              <li key={item.href} className="border-b border-rule">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={`block border-l-2 py-3 pl-3 pr-2 ${on ? "border-ink" : "border-transparent hover:border-rule"}`}
                >
                  <span className={`block font-serif text-[18px] ${on ? "font-bold text-ink" : "text-ink"}`}>{item.label}</span>
                  <span className="mt-0.5 block text-[13px] text-pencil">{item.desc}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-8 grid gap-2">
        <HomeCodeButton />
        <NightToggle />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    return () => {
      if (d.open) d.close();
    };
  }, [open]);

  // 다른 화면으로 가면 서랍을 닫는다
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  return (
    <div className="min-h-dvh">
      {/* PC: 왼쪽 고정 사이드바 */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 overflow-y-auto border-r border-rule bg-paper px-5 py-8 md:block">
        <SideNav />
      </aside>

      {/* 휴대폰: 위쪽 막대 + 서랍 */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-rule bg-paper/95 px-3 py-2 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
            <path d="M4 7h16M4 12h16M4 17h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </svg>
        </button>
        {pathname !== "/" && (
          <Link href="/" className="pb-1">
            <Logo size="sm" />
          </Link>
        )}
      </div>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        className="m-0 h-dvh max-h-dvh w-[min(300px,85vw)] max-w-none bg-transparent p-0 backdrop:bg-ink/40"
      >
        <div className="h-full overflow-y-auto border-r border-rule bg-paper px-5 py-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mb-4 h-10 text-[14px] text-pencil underline underline-offset-4"
          >
            닫기
          </button>
          <SideNav onNavigate={() => setOpen(false)} />
        </div>
      </dialog>

      <div className="md:pl-60">{children}</div>
    </div>
  );
}
