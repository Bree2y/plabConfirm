import { NextResponse } from "next/server";

type MatchRecord = { id: number; schedule?: string | null; [key: string]: unknown };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const userId = Number(params.get("userId"));
  const region = params.get("region");
  const startDate = params.get("startDate");
  if (!Number.isInteger(userId) || userId <= 0 || !region) return NextResponse.json({ error: "신청자와 지역 정보가 필요합니다." }, { status: 400 });
  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return NextResponse.json({ error: "조회 시작일이 올바르지 않습니다." }, { status: 400 });

  try {
    const dates = Array.from({ length: 7 }, (_, index) => addDays(startDate ?? todayInSeoul(), index));
    const pages = await Promise.all(dates.map((date) => fetchDateMatches(date, region)));
    const candidates = Array.from(new Map(pages.flat().map((match) => [match.id, match])).values());
    const results: MatchRecord[] = [];
    for (let index = 0; index < candidates.length; index += 10) {
      const batch = candidates.slice(index, index + 10);
      const matches = await Promise.all(batch.map(async (match) => {
        try {
          const response = await fetch(`https://www.plabfootball.com/api/v2/matches/${match.id}/`, {
            headers: { accept: "application/json", "user-agent": "PLAB-Check/1.0" },
            cache: "no-store",
          });
          if (!response.ok) return null;
          const detail = await response.json() as { applys?: Array<{ user_id?: number; user?: number; status?: string }> };
          const isApplicant = Array.isArray(detail.applys) && detail.applys.some((apply) => (apply.user_id ?? apply.user) === userId && apply.status !== "CANCEL");
          return isApplicant ? match : null;
        } catch {
          return null;
        }
      }));
      results.push(...matches.filter((match): match is MatchRecord => Boolean(match)));
    }
    results.sort((left, right) => String(left.schedule ?? "").localeCompare(String(right.schedule ?? "")));
    return NextResponse.json({ startDate: dates[0], endDate: dates[dates.length - 1], results });
  } catch {
    return NextResponse.json({ error: "다른 매치 정보를 불러오지 못했습니다." }, { status: 502 });
  }
}

async function fetchDateMatches(date: string, region: string) {
  const firstUrl = new URL("https://www.plabfootball.com/api/v2/integrated-matches/");
  firstUrl.searchParams.set("ordering", "schedule");
  firstUrl.searchParams.set("sch", date);
  firstUrl.searchParams.set("page_size", "50");
  firstUrl.searchParams.set("region", region);
  const matches: MatchRecord[] = [];
  let pageUrl: string | null = firstUrl.toString();
  let pageCount = 0;
  while (pageUrl && pageCount < 20) {
    const response = await fetch(pageUrl, { headers: { accept: "application/json", "user-agent": "PLAB-Check/1.0" }, cache: "no-store" });
    if (!response.ok) throw new Error("match list unavailable");
    const payload = await response.json() as { results?: MatchRecord[]; next?: string | null };
    if (Array.isArray(payload.results)) matches.push(...payload.results);
    pageUrl = typeof payload.next === "string" && payload.next ? payload.next : null;
    pageCount += 1;
  }
  return matches;
}

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(value: string, amount: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
}
