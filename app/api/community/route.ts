import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { communityPosts } from "../../../db/schema";
import {
  COMMUNITY_CATEGORIES,
  cleanText,
  commentCountSql,
  hashPassword,
  isCommunityCategory,
  isCommunityRegion,
  jsonError,
  validateIdentity,
  requiresCommunityRegion,
} from "./_lib";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const category = params.get("category") ?? "all";
    const region = params.get("region") ?? "all";
    const limit = Math.min(Math.max(Number(params.get("limit") ?? 30) || 30, 1), 50);
    const db = getDb();
    const conditions = [];
    if (isCommunityCategory(category)) conditions.push(eq(communityPosts.category, category));
    if (isCommunityRegion(region) && region !== "all") conditions.push(eq(communityPosts.region, region));
    let query = db
      .select({
        id: communityPosts.id,
        category: communityPosts.category,
        region: communityPosts.region,
        title: communityPosts.title,
        content: communityPosts.content,
        nickname: communityPosts.nickname,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        commentCount: commentCountSql,
      })
      .from(communityPosts);
    if (conditions.length) query = query.where(and(...conditions));
    const posts = await query.orderBy(desc(communityPosts.createdAt), desc(communityPosts.id)).limit(limit);
    return Response.json({ categories: COMMUNITY_CATEGORIES, posts });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const category = cleanText(body.category, 30);
    const region = cleanText(body.region ?? "all", 10);
    const title = cleanText(body.title, 80);
    const content = cleanText(body.content, 5000);
    const nickname = cleanText(body.nickname, 20);
    const password = typeof body.password === "string" ? body.password : "";
    if (!isCommunityCategory(category)) return jsonError("카테고리를 선택해주세요.");
    if (!isCommunityRegion(region)) return jsonError("지역을 선택해주세요.");
    if (requiresCommunityRegion(category) && region === "all") return jsonError("이 카테고리는 지역을 선택해야 합니다.");
    if (title.length < 2) return jsonError("제목은 2자 이상 입력해주세요.");
    if (content.length < 2) return jsonError("내용은 2자 이상 입력해주세요.");
    const identityError = validateIdentity(nickname, password);
    if (identityError) return jsonError(identityError);
    const { hash: passwordHash, salt: passwordSalt } = await hashPassword(password);
    const db = getDb();
    const [post] = await db.insert(communityPosts).values({ category, region, title, content, nickname, passwordHash, passwordSalt }).returning({ id: communityPosts.id });
    return Response.json({ id: post.id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 500 });
  }
}

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  if (message.includes("no such table")) return "커뮤니티 저장소가 아직 준비되지 않았습니다. 사이트 배포 후 잠시 뒤 다시 시도해주세요.";
  return `커뮤니티 정보를 불러오지 못했습니다. (${message})`;
}
