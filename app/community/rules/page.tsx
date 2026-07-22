import type { Metadata } from "next";
import SiteInfoPage from "../../site-info-page";

export const metadata: Metadata = { title: "커뮤니티 운영정책 | PLAB Check", description: "PLAB 풋살 커뮤니티의 게시글과 댓글 운영 기준입니다." };

export default function CommunityRulesPage() {
  return <SiteInfoPage eyebrow="COMMUNITY RULES" title="커뮤니티 운영정책" description="서로 안전하게 풋살 인연을 만들 수 있도록 운영합니다.">
    <h2>허용되는 글</h2>
    <p>같이 찰 사람 찾기, 팀원·용병 모집, 매치 후기, 구장·매니저 정보, PLAB 사용 질문과 풋살 관련 자유로운 이야기를 작성할 수 있습니다.</p>
    <h2>비매너 유저 제보</h2>
    <p>비매너 제보는 매치 번호·일시·상황 등 확인 가능한 사실 중심으로 작성해주세요. 실명, 전화번호, 계정 정보, 사진 등 개인 식별 정보와 감정적인 단정·추측은 금지합니다. 운영자는 분쟁의 판정자가 아니며 필요하면 게시글을 비공개 또는 삭제할 수 있습니다.</p>
    <h2>삭제 기준</h2>
    <p>불법·사기·혐오·협박·성적인 내용, 개인정보 노출, 반복 광고, 허위 신고, 도배, 외부 서비스 약관을 위반하는 내용은 삭제될 수 있습니다. 신고와 문의가 들어오면 운영 검토 후 조치합니다.</p>
    <h2>작성자 관리</h2>
    <p>게시글과 댓글 작성 시 입력한 비밀번호로 본인이 삭제할 수 있습니다. 비밀번호를 잊어버린 경우 운영자가 원문을 확인해 복구할 수 없습니다.</p>
  </SiteInfoPage>;
}
