import type { Metadata } from "next";
import { BRAND_NAME, SITE_URL } from "@/lib/landing/site";

type LegalPageMeta = {
  title: string;
  description: string;
  path: string;
};

export function createLegalMetadata({ title, description, path }: LegalPageMeta): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = `${title} | ${BRAND_NAME}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: BRAND_NAME,
      type: "website",
    },
  };
}
