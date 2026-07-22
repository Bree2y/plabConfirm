import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLAB Check — 매치와 풋살 커뮤니티",
  description: "PLAB 매치 신청자 현황과 지역별 매치 정보, 풋살 커뮤니티를 확인하세요.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
