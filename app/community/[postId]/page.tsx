import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import CommunityCommentForm from "../../community-comment-form";
import { COMMUNITY_CATEGORIES, COMMUNITY_REGIONS } from "../../community-data";
import { getDb } from "../../../db";
import { communityComments, communityPosts } from "../../../db/schema";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://plab-checker.funfun0218.chatgpt.site";

type Params = { params: Promise<{ postId: string }> };

async function getPost(postId: number) {
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
  if (!post) return null;
  const comments = await db.select({ id: communityComments.id, content: communityComments.content, nickname: communityComments.nickname, createdAt: communityComments.createdAt })
    .from(communityComments).where(eq(communityComments.postId, postId)).orderBy(desc(communityComments.id));
  return { post, comments };
}

function categoryLabel(id: string) {
  return COMMUNITY_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

function regionLabel(id: string) {
  return COMMUNITY_REGIONS.find((region) => region.id === id)?.name ?? "전국";
}

function formatDate(value: string) {
  const date = new Date(value.includes("Z") || value.includes("+") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(date);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    const postId = Number((await params).postId);
    const result = await getPost(postId);
    if (!result) return { title: "게시글을 찾을 수 없습니다 | PLAB Check" };
    return {
      title: `${result.post.title} | PLAB 풋살 커뮤니티`,
      description: result.post.content.slice(0, 150),
      alternates: { canonical: `${siteUrl}/community/${result.post.id}` },
    };
  } catch {
    return { title: "PLAB 풋살 커뮤니티" };
  }
}

export default async function CommunityPostPage({ params }: Params) {
  const postId = Number((await params).postId);
  if (!Number.isInteger(postId)) notFound();
  let result: Awaited<ReturnType<typeof getPost>>;
  try {
    result = await getPost(postId);
  } catch {
    notFound();
  }
  if (!result) notFound();

  return (
    <main className="shell community-route-shell">
      <nav className="topbar community-route-topbar">
        <Link className="brand" href="/">PLAB CHECK</Link>
        <Link className="community-back-link" href="/community">커뮤니티 목록으로 →</Link>
      </nav>
      <article className="community-route-article">
        <div className="community-detail-head"><div><span className="community-category-label">{categoryLabel(result.post.category)}</span><span className="community-region-label">{regionLabel(result.post.region)}</span><h1>{result.post.title}</h1><p>{result.post.nickname} · {formatDate(result.post.createdAt)}</p></div></div>
        <div className="community-post-body">{result.post.content}</div>
        <div className="comments-head"><h2>댓글 <span>{result.comments.length}</span></h2></div>
        <div className="comment-list">{result.comments.length ? result.comments.map((comment) => <div className="comment-item" key={comment.id}><div><strong>{comment.nickname}</strong><span>{formatDate(comment.createdAt)}</span></div><p>{comment.content}</p></div>) : <p className="comment-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>}</div>
        <CommunityCommentForm postId={result.post.id} />
      </article>
    </main>
  );
}
