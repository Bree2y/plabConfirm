import { sql } from "drizzle-orm";
import { COMMUNITY_CATEGORIES, COMMUNITY_REGIONS } from "../../community-data";

export { COMMUNITY_CATEGORIES, COMMUNITY_REGIONS };

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]["id"];
export type CommunityRegion = (typeof COMMUNITY_REGIONS)[number]["id"];

const REGION_REQUIRED_CATEGORIES = new Set(["players", "recruit", "review", "manners", "manager"]);

export function isCommunityCategory(value: string): value is CommunityCategory {
  return COMMUNITY_CATEGORIES.some((category) => category.id === value);
}

export function isCommunityRegion(value: string): value is CommunityRegion {
  return COMMUNITY_REGIONS.some((region) => region.id === value);
}

export function requiresCommunityRegion(category: CommunityCategory) {
  return REGION_REQUIRED_CATEGORIES.has(category);
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
