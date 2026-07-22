"use client";

import { FormEvent, useState } from "react";

export default function CommunityCommentForm({ postId }: { postId: number }) {
  const [form, setForm] = useState({ content: "", nickname: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/community/${postId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "댓글을 등록하지 못했습니다.");
      setForm({ content: "", nickname: "", password: "" });
      setMessage("댓글을 등록했습니다.");
      window.setTimeout(() => window.location.reload(), 350);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "댓글을 등록하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="comment-form community-route-comment-form" onSubmit={submit}>
      <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} maxLength={2000} placeholder="댓글을 남겨보세요." required />
      <div><input value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} maxLength={20} placeholder="닉네임" required /><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} maxLength={100} placeholder="비밀번호" required /><button type="submit" disabled={loading}>{loading ? "등록 중" : "댓글 등록"}</button></div>
      {message && <p className="community-notice">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
    </form>
  );
}
