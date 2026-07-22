import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://plab-checker.funfun0218.chatgpt.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/community/"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
