import type { Metadata } from "next";
import SiteInfoPage from "../site-info-page";

export const metadata: Metadata = { title: "이용약관 | PLAB Check", description: "PLAB Check 서비스 이용약관입니다." };

export default function TermsPage() {
  return <SiteInfoPage eyebrow="TERMS OF USE" title="이용약관" description="서비스를 안전하게 이용하기 위한 기본 약속입니다.">
    <h2>1. 서비스 내용</h2>
    <p>PLAB Check는 사용자가 제공한 매치 링크를 바탕으로 PLAB Football의 공개 매치 정보와 신청자 현황을 보기 쉽게 제공하는 보조 서비스입니다. PLAB Football의 공식 서비스가 아닙니다.</p>
    <h2>2. 이용자 책임</h2>
    <p>이용자는 자신이 권리를 가진 링크와 공개 정보만 사용해야 하며, 타인의 개인정보·연락처·실명 등을 커뮤니티에 게시하면 안 됩니다. 게시글과 댓글의 내용에 대한 책임은 작성자에게 있습니다.</p>
    <h2>3. 금지 행위</h2>
    <p>도배, 광고성 스팸, 욕설·혐오·협박, 근거 없는 비방, 개인정보 노출, 서비스 공격, 자동화된 과도한 요청은 금지됩니다. 운영자는 이를 위반한 콘텐츠를 사전 통지 없이 숨기거나 삭제할 수 있습니다.</p>
    <h2>4. 서비스 변경</h2>
    <p>외부 API, 호스팅, 네트워크 상태에 따라 일부 기능이 지연되거나 중단될 수 있습니다. 매치 정보의 최종 확인과 신청은 PLAB Football에서 직접 진행해야 합니다.</p>
    <h2>5. 약관 변경</h2>
    <p>서비스 운영에 필요한 경우 이 약관을 변경할 수 있으며, 변경 내용은 이 페이지에 게시합니다.</p>
  </SiteInfoPage>;
}
