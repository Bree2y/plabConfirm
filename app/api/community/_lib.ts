import { sql } from "drizzle-orm";

export const COMMUNITY_CATEGORIES = [
  { id: "players", label: "같이 풋살할 사람", description: "지역·시간이 맞는 사람을 찾아요" },
  { id: "recruit", label: "팀원·용병 모집", description: "팀원, 용병, 대체 인원을 구해요" },
  { id: "review", label: "매치 후기·정보", description: "매치와 구장 경험을 공유해요" },
  { id: "manners", label: "비매너 유저 제보", description: "사실 중심으로 운영에 도움을 줘요" },
  { id: "manager", label: "매니저·구장 정보", description: "매니저와 구장 정보를 나눠요" },
  { id: "question", label: "질문·건의", description: "PLAB 사용법과 개선 의견" },
  { id: "free", label: "자유게시판", description: "풋살 이야기를 자유롭게 나눠요" },
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]["id"];

export function isCommunityCategory(value: string): value is CommunityCategory {
  return COMMUNITY_CATEGORIES.some((category) => category.id === value);
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function validateIdentity(nickname: string, password: string) {
  if (nickname.length < 2 || nickname.length > 20) return "닉네임은 2~20자로 입력해주세요.";
  if (password.length < 4 || password.length > 100) return "비밀번호는 4자 이상 입력해주세요.";
  return null;
}

export async function hashPassword(password: string, salt?: Uint8Array) {
  const passwordSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: passwordSalt, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(passwordSalt) };
}

export async function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  const salt = hexToBytes(passwordSalt);
  if (!salt) return false;
  const result = await hashPassword(password, salt);
  return timingSafeEqual(result.hash, passwordHash);
}

export function normalizeDate(value: string | null | undefined) {
  return value ? new Date(value.replace(" ", "T") + (value.includes("Z") || value.includes("+") ? "" : "Z")).toISOString() : new Date().toISOString();
}

export const commentCountSql = sql<number>`(SELECT COUNT(*) FROM community_comments WHERE community_comments.post_id = community_posts.id)`;

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  if (!/^[0-9a-f]{32}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g)!, (byte) => Number.parseInt(byte, 16));
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}
