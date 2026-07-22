import Link from "next/link";

export default function SiteInfoPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="shell info-page-shell">
      <nav className="topbar">
        <Link className="brand" href="/">PLAB CHECK</Link>
        <Link className="community-back-link" href="/">홈으로 돌아가기 →</Link>
      </nav>
      <article className="info-page">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="info-page-description">{description}</p>
        <div className="info-page-body">{children}</div>
      </article>
      <footer>PLAB CHECK <span>개인용 매치 현황 도구</span></footer>
    </main>
  );
}
