import type { Metadata } from "next";
import SiteInfoPage from "../site-info-page";

export const metadata: Metadata = { title: "문의 | PLAB Check", description: "PLAB Check 서비스 문의 및 개선 제안 창구입니다." };

export default function ContactPage() {
  return <SiteInfoPage eyebrow="CONTACT" title="문의와 제안" description="오류 신고, 개인정보 삭제 요청, 기능 제안을 남겨주세요.">
    <h2>GitHub Issues</h2>
    <p>서비스 오류나 개선 의견은 <a href="https://github.com/Bree2y/plabConfirm/issues" target="_blank" rel="noreferrer">PLAB Check GitHub Issues</a>에 남겨주세요. 공개 게시판에 남기기 어려운 개인정보 관련 요청은 글 내용에 개인정보를 적지 말고, 삭제가 필요한 게시글 번호만 알려주세요.</p>
    <h2>문의할 때 포함하면 좋은 내용</h2>
    <ul><li>문제가 발생한 화면과 매치 번호</li><li>사용한 날짜·지역</li><li>휴대폰 또는 PC 여부</li><li>오류가 나타난 시간과 화면 문구</li></ul>
  </SiteInfoPage>;
}
