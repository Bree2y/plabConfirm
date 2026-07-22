import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { communityComments, communityPosts } from "../../../../../db/schema";
import { cleanText, hashPassword, jsonError, validateIdentity } from "../../_lib";

export async function GET(_request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const postId = Number((await context.params).postId);
    const db = getDb();
    const comments = await db.select({ id: communityComments.id, content: communityComments.content, nickname: communityComments.nickname, createdAt: communityComments.createdAt })
      .from(communityComments).where(eq(communityComments.postId, postId)).orderBy(asc(communityComments.id));
    return Response.json({ comments });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const postId = Number((await context.params).postId);
    const body = await request.json() as Record<string, unknown>;
    const content = cleanText(body.content, 2000);
    const nickname = cleanText(body.nickname, 20);
    const password = typeof body.password === "string" ? body.password : "";
    if (!Number.isInteger(postId)) return jsonError("게시글 번호가 올바르지 않습니다.");
    if (content.length < 2) return jsonError("댓글은 2자 이상 입력해주세요.");
    const identityError = validateIdentity(nickname, password);
    if (identityError) return jsonError(identityError);
    const db = getDb();
    const [post] = await db.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
    if (!post) return jsonError("게시글을 찾을 수 없습니다.", 404);
    const { hash: passwordHash, salt: passwordSalt } = await hashPassword(password);
    const [comment] = await db.insert(communityComments).values({ postId, content, nickname, passwordHash, passwordSalt }).returning({ id: communityComments.id });
    return Response.json({ id: comment.id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const postId = Number((await context.params).postId);
    const body = await request.json() as { commentId?: unknown; password?: unknown };
    const commentId = Number(body.commentId);
    const password = typeof body.password === "string" ? body.password : "";
    if (!Number.isInteger(postId) || !Number.isInteger(commentId)) return jsonError("댓글 번호가 올바르지 않습니다.");
    const db = getDb();
    const [comment] = await db.select().from(communityComments).where(eq(communityComments.id, commentId)).limit(1);
    if (!comment || comment.postId !== postId || !(await verifyPassword(password, comment.passwordHash, comment.passwordSalt))) return jsonError("비밀번호가 맞지 않거나 댓글이 없습니다.", 403);
    await db.delete(communityComments).where(eq(communityComments.id, commentId));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 500 });
  }
}

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  if (message.includes("no such table")) return "커뮤니티 저장소가 아직 준비되지 않았습니다. 사이트 배포 후 잠시 뒤 다시 시도해주세요.";
  return `댓글을 처리하지 못했습니다. (${message})`;
}
