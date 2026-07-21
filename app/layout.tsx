import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLAB Check — 신청자 현황",
  description: "PLAB 매치 링크로 신청자 현황과 경기 정보를 확인하세요.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
