import type { MetadataRoute } from "next";
import { getDb } from "../db";
import { communityPosts } from "../db/schema";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://plab-checker.funfun0218.chatgpt.site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/community`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/community/rules`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.2 },
  ];
  try {
    const db = getDb();
    const posts = await db.select({ id: communityPosts.id, updatedAt: communityPosts.updatedAt }).from(communityPosts);
    return [...staticPages, ...posts.map((post) => ({ url: `${siteUrl}/community/${post.id}`, lastModified: post.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 }))];
  } catch {
    return staticPages;
  }
}
