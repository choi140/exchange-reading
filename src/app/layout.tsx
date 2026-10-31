import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnonymousSession } from "@/components/AnonymousSession";

export const metadata: Metadata = {
  title: "낯선 밑줄",
  description: "모르는 사람과 책 한 권, 일기장 한 권을 천천히 주고받는 곳",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#eef0ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <AnonymousSession>{children}</AnonymousSession>
      </body>
    </html>
  );
}
