import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://www.plabfootball.com/api/v2/regions/", {
      headers: { accept: "application/json", "user-agent": "PLAB-Check/1.0" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "지역 정보를 불러오지 못했습니다." }, { status: 502 });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "PLAB 지역 서버에 연결하지 못했습니다." }, { status: 502 });
  }
}
