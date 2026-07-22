import { NextResponse } from "next/server";
import { recordMatchLookup } from "../stats/route";

const ALLOWED_HOSTS = new Set(["abr.ge", "www.abr.ge", "plabfootball.com", "www.plabfootball.com"]);

function getMatchId(value: string, resolvedUrl: string) {
  const candidates = [value, resolvedUrl];
  for (const candidate of candidates) {
    const match = candidate.match(/(?:\/match\/|[?&](?:match_?id|id)=)(\d+)/i);
    if (match) return match[1];
  }
  return null;
}

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("url")?.trim();
  if (!input) return NextResponse.json({ error: "PLAB 매치 링크를 입력해주세요." }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return NextResponse.json({ error: "올바른 http(s) 링크를 입력해주세요." }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
    return NextResponse.json({ error: "abr.ge 또는 plabfootball.com 링크만 사용할 수 있습니다." }, { status: 400 });
  }

  try {
    let resolvedUrl = input;
    if (parsed.hostname.toLowerCase().endsWith("abr.ge")) {
      const redirectResponse = await fetch(input, { redirect: "follow", headers: { "user-agent": "PLAB-Check/1.0" }, cache: "no-store" });
      resolvedUrl = redirectResponse.url || input;
    }

    const matchId = getMatchId(input, resolvedUrl);
    if (!matchId) return NextResponse.json({ error: "링크에서 PLAB 매치 번호를 찾지 못했습니다." }, { status: 422 });

    const apiResponse = await fetch(`https://www.plabfootball.com/api/v2/matches/${matchId}/`, {
      headers: { accept: "application/json", "user-agent": "PLAB-Check/1.0" },
      cache: "no-store",
    });
    if (!apiResponse.ok) return NextResponse.json({ error: `PLAB API가 매치 정보를 반환하지 않았습니다. (${apiResponse.status})` }, { status: 502 });

    const match = await apiResponse.json();
    if (!match || typeof match !== "object") return NextResponse.json({ error: "PLAB API 응답 형식이 올바르지 않습니다." }, { status: 502 });
    const applys = Array.isArray(match.applys) ? match.applys : [];
    await recordMatchLookup();
    return NextResponse.json({ match, applys, sourceUrl: resolvedUrl });
  } catch {
    return NextResponse.json({ error: "PLAB 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
