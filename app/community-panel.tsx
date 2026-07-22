"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Category = { id: string; label: string; description: string };
type Post = { id: number; category: string; title: string; content: string; nickname: string; createdAt: string; commentCount: number };
type Comment = { id: number; content: string; nickname: string; createdAt: string };
type PostDetail = Omit<Post, "commentCount"> & { comments: Comment[] };

const categories: Category[] = [
  { id: "players", label: "같이 풋살할 사람", description: "지역·시간이 맞는 사람을 찾아요" },
  { id: "recruit", label: "팀원·용병 모집", description: "팀원, 용병, 대체 인원을 구해요" },
  { id: "review", label: "매치 후기·정보", description: "매치와 구장 경험을 공유해요" },
  { id: "manners", label: "비매너 유저 제보", description: "사실 중심으로 운영에 도움을 줘요" },
  { id: "manager", label: "매니저·구장 정보", description: "매니저와 구장 정보를 나눠요" },
  { id: "question", label: "질문·건의", description: "PLAB 사용법과 개선 의견" },
  { id: "free", label: "자유게시판", description: "풋살 이야기를 자유롭게 나눠요" },
];

const categoryMap = new Map(categories.map((category) => [category.id, category]));

function formatDate(value: string) {
  const date = new Date(value.includes("Z") || value.includes("+") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(date);
}

export default function CommunityPanel() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [mode, setMode] = useState<"list" | "write">("list");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [postForm, setPostForm] = useState({ category: "players", title: "", content: "", nickname: "", password: "" });
  const [commentForm, setCommentForm] = useState({ content: "", nickname: "", password: "" });

  const activeCategory = useMemo(() => categoryMap.get(selectedCategory), [selectedCategory]);

  const loadPosts = useCallback(async (category = selectedCategory) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/community?category=${encodeURIComponent(category)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "게시글을 불러오지 못했습니다.");
      setPosts(data.posts ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "게시글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPosts(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPosts]);

  async function openPost(postId: number) {
    setDetailLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/community/${postId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "게시글을 불러오지 못했습니다.");
      setSelectedPost({ ...data.post, commentCount: data.comments?.length ?? 0, comments: data.comments ?? [] });
      setMode("list");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "게시글을 불러오지 못했습니다.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/community", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(postForm) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "게시글을 등록하지 못했습니다.");
      setPostForm({ category: postForm.category, title: "", content: "", nickname: "", password: "" });
      setNotice("게시글을 등록했습니다.");
      await loadPosts(selectedCategory);
      if (data.id) await openPost(data.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "게시글을 등록하지 못했습니다.");
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPost) return;
    setNotice("");
    setError("");
    try {
      const response = await fetch(`/api/community/${selectedPost.id}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(commentForm) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "댓글을 등록하지 못했습니다.");
      setCommentForm({ content: "", nickname: "", password: "" });
      setNotice("댓글을 등록했습니다.");
      await openPost(selectedPost.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "댓글을 등록하지 못했습니다.");
    }
  }

  async function deleteComment(commentId: number) {
    if (!selectedPost) return;
    const password = window.prompt("댓글 비밀번호를 입력해주세요.");
    if (!password) return;
    const response = await fetch(`/api/community/${selectedPost.id}/comments`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ commentId, password }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "댓글을 삭제하지 못했습니다."); return; }
    setNotice("댓글을 삭제했습니다.");
    await openPost(selectedPost.id);
  }

  function changeCategory(category: string) {
    setSelectedCategory(category);
    setSelectedPost(null);
    setMode("list");
  }

  return (
    <section className="community-shell" aria-live="polite">
      <div className="community-toolbar">
        <div>
          <p className="eyebrow">COMMUNITY BOARD</p>
          <h2>{activeCategory?.label ?? "풋살 커뮤니티"}</h2>
          <p>{activeCategory?.description ?? "같이 찰 사람을 찾고 풋살 이야기를 나눠보세요."}</p>
        </div>
        <button type="button" className="community-write-button" onClick={() => { setMode("write"); setSelectedPost(null); }}>글쓰기 <span>＋</span></button>
      </div>

      <div className="community-layout">
        <aside className="community-categories">
          <strong>카테고리</strong>
          <button type="button" className={selectedCategory === "all" ? "active" : ""} onClick={() => changeCategory("all")}>전체 게시글</button>
          {categories.map((category) => <button type="button" key={category.id} className={selectedCategory === category.id ? "active" : ""} onClick={() => changeCategory(category.id)}>{category.label}</button>)}
          <div className="community-guideline"><span>i</span><p>닉네임과 비밀번호만으로 참여할 수 있어요. 전화번호·실명 등 개인정보는 글에 남기지 마세요.</p></div>
        </aside>

        <div className="community-content">
          {notice && <p className="community-notice">{notice}</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
          {mode === "write" ? (
            <form className="community-form" onSubmit={submitPost}>
              <div className="community-form-head"><div><p className="eyebrow">NEW POST</p><h3>새 글 작성</h3></div><button type="button" className="text-button" onClick={() => setMode("list")}>목록으로</button></div>
              <label>카테고리<select value={postForm.category} onChange={(event) => setPostForm({ ...postForm, category: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
              <label>제목<input value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} maxLength={80} placeholder="어떤 이야기를 나누고 싶나요?" required /></label>
              <label>내용<textarea value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} maxLength={5000} placeholder="모집 지역, 시간, 매치 정보 등을 자세히 적어주세요." required /></label>
              <div className="community-identity-fields"><label>닉네임<input value={postForm.nickname} onChange={(event) => setPostForm({ ...postForm, nickname: event.target.value })} maxLength={20} placeholder="2~20자" required /></label><label>비밀번호<input type="password" value={postForm.password} onChange={(event) => setPostForm({ ...postForm, password: event.target.value })} maxLength={100} placeholder="4자 이상" required /></label></div>
              <p className="form-help">비밀번호는 글 작성 확인에만 사용되며 원문으로 저장하지 않습니다.</p>
              <button className="primary-community-button" type="submit">게시글 등록 <span>→</span></button>
            </form>
          ) : selectedPost ? (
            <article className="community-detail">
              <button type="button" className="text-button" onClick={() => setSelectedPost(null)}>← 목록으로</button>
              <div className="community-detail-head"><div><span className="community-category-label">{categoryMap.get(selectedPost.category)?.label ?? selectedPost.category}</span><h3>{selectedPost.title}</h3><p>{selectedPost.nickname} · {formatDate(selectedPost.createdAt)}</p></div><button type="button" className="text-button danger" onClick={async () => { const password = window.prompt("게시글 비밀번호를 입력해주세요."); if (!password) return; const response = await fetch(`/api/community/${selectedPost.id}`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) }); if (response.ok) { setSelectedPost(null); await loadPosts(); setNotice("게시글을 삭제했습니다."); } else { const data = await response.json(); setError(data.error ?? "삭제하지 못했습니다."); } }}>삭제</button></div>
              <div className="community-post-body">{selectedPost.content}</div>
              <div className="comments-head"><h4>댓글 <span>{selectedPost.comments.length}</span></h4></div>
              <div className="comment-list">{selectedPost.comments.length ? selectedPost.comments.map((comment) => <div className="comment-item" key={comment.id}><div><strong>{comment.nickname}</strong><span>{formatDate(comment.createdAt)}</span><button type="button" onClick={() => deleteComment(comment.id)}>삭제</button></div><p>{comment.content}</p></div>) : <p className="comment-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>}</div>
              <form className="comment-form" onSubmit={submitComment}><textarea value={commentForm.content} onChange={(event) => setCommentForm({ ...commentForm, content: event.target.value })} maxLength={2000} placeholder="댓글을 남겨보세요." required /><div><input value={commentForm.nickname} onChange={(event) => setCommentForm({ ...commentForm, nickname: event.target.value })} maxLength={20} placeholder="닉네임" required /><input type="password" value={commentForm.password} onChange={(event) => setCommentForm({ ...commentForm, password: event.target.value })} maxLength={100} placeholder="비밀번호" required /><button type="submit">댓글 등록</button></div></form>
            </article>
          ) : (
            <>
              <div className="community-list-head"><strong>{selectedCategory === "all" ? "전체 게시글" : activeCategory?.label}</strong><span>{loading ? "불러오는 중..." : `${posts.length}개`}</span></div>
              {detailLoading || loading ? <div className="community-empty"><span className="spinner dark" /> 게시글을 불러오는 중입니다...</div> : posts.length ? <div className="community-post-list">{posts.map((post) => <button type="button" className="community-post-card" key={post.id} onClick={() => openPost(post.id)}><div className="community-post-card-top"><span className="community-category-label">{categoryMap.get(post.category)?.label ?? post.category}</span><span>{formatDate(post.createdAt)}</span></div><h3>{post.title}</h3><p>{post.content}</p><div><span>{post.nickname}</span><span>댓글 {post.commentCount}</span></div></button>)}</div> : <div className="community-empty"><strong>아직 게시글이 없습니다.</strong><span>첫 글을 작성해 풋살 이야기를 시작해보세요.</span><button type="button" onClick={() => setMode("write")}>첫 글 작성하기</button></div>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
