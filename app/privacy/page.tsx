import type { Metadata } from "next";
import SiteInfoPage from "../site-info-page";

export const metadata: Metadata = { title: "개인정보처리방침 | PLAB Check", description: "PLAB Check의 개인정보 처리 및 보관 기준입니다." };

export default function PrivacyPage() {
  return <SiteInfoPage eyebrow="PRIVACY" title="개인정보처리방침" description="PLAB Check는 서비스 운영에 필요한 최소한의 정보만 처리합니다.">
    <h2>1. 처리하는 정보</h2>
    <p>매치 조회 시 입력한 링크와 PLAB에서 공개적으로 제공하는 매치 정보를 화면에 표시합니다. 커뮤니티를 이용하면 닉네임, 게시글·댓글 내용, 선택 지역·카테고리, 작성 시각이 저장됩니다.</p>
    <h2>2. 비밀번호 보호</h2>
    <p>게시글과 댓글의 비밀번호는 원문으로 저장하지 않고 일방향 해시와 salt 형태로 저장합니다. 운영자도 원래 비밀번호를 확인할 수 없습니다.</p>
    <h2>3. 이용 목적과 보관</h2>
    <p>저장 정보는 게시글·댓글 제공, 작성자 본인의 삭제 확인, 서비스 보안과 운영을 위해 사용합니다. 삭제된 게시글과 댓글은 서비스 화면에서 제거되며, 법령이나 보안상 필요한 로그는 호스팅 제공자의 정책에 따라 보관될 수 있습니다.</p>
    <h2>4. 외부 서비스</h2>
    <p>매치 정보는 PLAB Football API 응답을 통해 제공됩니다. 향후 Google AdSense나 분석 도구를 연결하면 쿠키·광고 식별자 처리 내용을 이 방침에 추가하고 필요한 동의 절차를 적용합니다.</p>
    <h2>5. 문의</h2>
    <p>개인정보 관련 문의는 <a href="https://github.com/Bree2y/plabConfirm/issues" target="_blank" rel="noreferrer">GitHub Issues</a>로 남겨주세요.</p>
  </SiteInfoPage>;
}
