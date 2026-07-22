import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const date = searchParams.get("date");
  const region = searchParams.get("region");
  if (!date || !region) return NextResponse.json({ error: "날짜와 지역을 선택해주세요." }, { status: 400 });

  const apiUrl = new URL("https://www.plabfootball.com/api/v2/integrated-matches/");
  apiUrl.searchParams.set("ordering", "schedule");
  apiUrl.searchParams.set("sch", date);
  apiUrl.searchParams.set("page_size", "50");
  apiUrl.searchParams.set("region", region);

  try {
    const response = await fetch(apiUrl, {
      headers: { accept: "application/json", "user-agent": "PLAB-Check/1.0" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "매치 정보를 불러오지 못했습니다." }, { status: 502 });

    const payload = await response.json();
    const matches = Array.isArray(payload.results) ? payload.results : [];
    const results = await Promise.all(matches.map(async (match: { id: number }) => {
      try {
        const detailResponse = await fetch(`https://www.plabfootball.com/api/v2/matches/${match.id}/`, {
          headers: { accept: "application/json", "user-agent": "PLAB-Check/1.0" },
          cache: "no-store",
        });
        if (!detailResponse.ok) return null;
        const detail = await detailResponse.json();
        const activeFemaleMembers = Array.isArray(detail.applys)
          ? detail.applys.filter((apply: { user_sex?: number; status?: string }) => apply.user_sex === -1 && apply.status !== "CANCEL")
          : [];
        return {
          ...match,
          sex: detail.sex,
          female_member_count: activeFemaleMembers.length,
        };
      } catch {
        return { ...match, female_member_count: 0 };
      }
    }));

    return NextResponse.json({ ...payload, results });
  } catch {
    return NextResponse.json({ error: "PLAB 매치 서버에 연결하지 못했습니다." }, { status: 502 });
  }
}
