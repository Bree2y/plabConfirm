import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { communityComments, communityPosts } from "../../../../db/schema";
import { jsonError, verifyPassword } from "../_lib";

export async function GET(_request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const postId = Number((await context.params).postId);
    if (!Number.isInteger(postId)) return jsonError("게시글 번호가 올바르지 않습니다.", 400);
    const db = getDb();
    const [post] = await db.select({
      id: communityPosts.id,
      category: communityPosts.category,
      region: communityPosts.region,
      title: communityPosts.title,
      content: communityPosts.content,
      nickname: communityPosts.nickname,
      createdAt: communityPosts.createdAt,
    }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
    if (!post) return jsonError("게시글을 찾을 수 없습니다.", 404);
    const comments = await db.select({
      id: communityComments.id,
      content: communityComments.content,
      nickname: communityComments.nickname,
      createdAt: communityComments.createdAt,
    }).from(communityComments).where(eq(communityComments.postId, postId)).orderBy(communityComments.id);
    return Response.json({ post, comments });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const postId = Number((await context.params).postId);
    const body = await request.json() as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    const db = getDb();
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
    if (!post || !(await verifyPassword(password, post.passwordHash, post.passwordSalt))) return jsonError("비밀번호가 맞지 않거나 게시글이 없습니다.", 403);
    await db.batch([
      db.delete(communityComments).where(eq(communityComments.postId, postId)),
      db.delete(communityPosts).where(eq(communityPosts.id, postId)),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 500 });
  }
}

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  if (message.includes("no such table")) return "커뮤니티 저장소가 아직 준비되지 않았습니다. 사이트 배포 후 잠시 뒤 다시 시도해주세요.";
  return `커뮤니티 정보를 불러오지 못했습니다. (${message})`;
}
