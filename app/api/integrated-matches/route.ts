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
    const matches: Array<{ id: number; [key: string]: unknown }> = [];
    let pageUrl: string | null = apiUrl.toString();
    let firstPayload: Record<string, unknown> = {};
    let pageCount = 0;

    while (pageUrl && pageCount < 20) {
      const response = await fetch(pageUrl, {
        headers: { accept: "application/json", "user-agent": "PLAB-Check/1.0" },
        cache: "no-store",
      });
      if (!response.ok) return NextResponse.json({ error: "매치 정보를 불러오지 못했습니다." }, { status: 502 });
      const payload = await response.json() as Record<string, unknown>;
      if (!pageCount) firstPayload = payload;
      if (Array.isArray(payload.results)) matches.push(...payload.results as Array<{ id: number; [key: string]: unknown }>);
      pageUrl = typeof payload.next === "string" && payload.next ? payload.next : null;
      pageCount += 1;
    }

    const results: Array<{ [key: string]: unknown }> = [];
    for (let index = 0; index < matches.length; index += 10) {
      const batch = matches.slice(index, index + 10);
      const decorated = await Promise.all(batch.map(async (match) => {
        try {
          const detailResponse = await fetch(`https://www.plabfootball.com/api/v2/matches/${match.id}/`, {
            headers: { accept: "application/json", "user-agent": "PLAB-Check/1.0" },
            cache: "no-store",
          });
          if (!detailResponse.ok) return { ...match, female_member_count: 0 };
          const detail = await detailResponse.json();
          const activeFemaleMembers = Array.isArray(detail.applys)
            ? detail.applys.filter((apply: { user_sex?: number; status?: string }) => apply.user_sex === -1 && apply.status !== "CANCEL")
            : [];
          return { ...match, sex: detail.sex, female_member_count: activeFemaleMembers.length };
        } catch {
          return { ...match, female_member_count: 0 };
        }
      }));
      results.push(...decorated);
    }

    return NextResponse.json({ ...firstPayload, count: results.length, next: null, previous: null, results });
  } catch {
    return NextResponse.json({ error: "PLAB 매치 서버에 연결하지 못했습니다." }, { status: 502 });
  }
}
