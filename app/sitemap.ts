import type { MetadataRoute } from "next";
import { LEGAL_LINKS, SITE_URL } from "@/lib/landing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...LEGAL_LINKS.map((link) => ({
      url: `${SITE_URL}${link.href}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    {
      url: `${SITE_URL}/subscription`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
