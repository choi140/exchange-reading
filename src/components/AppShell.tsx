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
  { href: "/", label: "처음", icon: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z", match: (p: string) => p === "/" },
  { href: "/read", label: "교환독서", icon: "M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5zm0 0v14", match: (p: string) => p.startsWith("/read") || p.startsWith("/room") },
  { href: "/diary", label: "교환일기", icon: "M6 3h13v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 0v18m3-13h4m-4 4h4", match: (p: string) => p.startsWith("/diary") },
  { href: "/calendar", label: "나의 독서 달력", icon: "M4 6h16v14H4zm0 5h16M8 3v5m8-5v5", match: (p: string) => p.startsWith("/calendar") },
  { href: "/key", label: "나만의 열쇠", icon: "M14 10a4 4 0 1 1 0 .01M11 13l-7 7m3-3 3 3", match: (p: string) => p.startsWith("/key") },
];

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} className="inline-block px-3 pt-2">
        <Logo size="sm" />
      </Link>
      <nav aria-label="주 메뉴" className="mt-10">
        <ul className="grid gap-1">
          {NAV.map((item) => {
            const on = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-full px-3 text-[14px] ${on ? "font-bold text-accent" : "font-medium text-pencil hover:text-ink"}`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                    <path d={item.icon} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto grid gap-2 pt-8">
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
      <aside className="fixed inset-y-4 left-4 hidden w-60 overflow-y-auto rounded-2xl bg-page px-4 py-6 md:block">
        <SideNav />
      </aside>

      {/* 휴대폰: 위쪽 막대 + 서랍 */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink bg-paper px-3 py-2 md:hidden">
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
        <Link href="/" className="pb-1">
          <Logo size="sm" />
        </Link>
      </div>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        className="m-0 h-dvh max-h-dvh w-[min(300px,85vw)] max-w-none bg-transparent p-0 backdrop:bg-ink/40"
      >
        <div className="flex h-full flex-col overflow-y-auto bg-page px-4 py-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mb-4 h-10 self-start px-3 text-[13px] text-pencil underline underline-offset-4"
          >
            닫기
          </button>
          <div className="min-h-0 flex-1">
            <SideNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </dialog>

      <div className="md:pl-[17rem]">{children}</div>
    </div>
  );
}
