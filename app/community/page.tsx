import type { Metadata } from "next";
import Link from "next/link";
import CommunityPanel from "../community-panel";

export const metadata: Metadata = {
  title: "풋살 커뮤니티 | PLAB Check",
  description: "같이 풋살할 사람을 찾고 매치 후기와 구장 정보를 나누는 PLAB 풋살 커뮤니티입니다.",
};

export default function CommunityPage() {
  return (
    <main className="shell community-route-shell">
      <nav className="topbar community-route-topbar">
        <Link className="brand" href="/">PLAB CHECK</Link>
        <Link className="community-back-link" href="/">매치 정보로 돌아가기 →</Link>
      </nav>
      <section className="community-route-hero">
        <p className="eyebrow">PLAB COMMUNITY</p>
        <h1>풋살 이야기를<br /><em>함께 나눠보세요.</em></h1>
        <p>같이 찰 사람을 찾고, 매치 후기와 구장 정보를 자유롭게 나눌 수 있어요.</p>
      </section>
      <CommunityPanel />
    </main>
  );
}
