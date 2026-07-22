import { desc, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { usageStats } from "../../../db/schema";

export async function GET() {
  try {
    const db = getDb();
    const todayKey = `day:${todayInSeoul()}`;
    const rows = await db.select({ key: usageStats.key, count: usageStats.count }).from(usageStats)
      .where(sql`${usageStats.key} IN ('total', ${todayKey})`).orderBy(desc(usageStats.count));
    return Response.json({ today: rows.find((row) => row.key === todayKey)?.count ?? 0, total: rows.find((row) => row.key === "total")?.count ?? 0 });
  } catch {
    return Response.json({ today: 0, total: 0, available: false });
  }
}

export async function recordMatchLookup() {
  try {
    const db = getDb();
    const keys = ["total", `day:${todayInSeoul()}`];
    for (const key of keys) {
      await db.insert(usageStats).values({ key, count: 1 }).onConflictDoUpdate({
        target: usageStats.key,
        set: { count: sql`${usageStats.count} + 1`, updatedAt: sql`CURRENT_TIMESTAMP` },
      });
    }
  } catch {
    // Usage statistics must never prevent the match response.
  }
}

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
