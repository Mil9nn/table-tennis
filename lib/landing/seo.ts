import type { Metadata } from "next";
import { BRAND_NAME, SITE_URL, TAGLINE } from "./site";

const PRIMARY_KEYWORDS = [
  "table tennis scoring app",
  "table tennis tournament software",
  "table tennis live scoring",
  "ping pong score tracker",
  "table tennis tournament manager",
  "table tennis team match software",
  "TTPro",
] as const;

const SECONDARY_KEYWORDS = [
  "Swaythling Cup scoring app",
  "SDS table tennis scoring",
  "round robin table tennis software",
  "knockout bracket generator table tennis",
  "table tennis leaderboard app",
  "live table tennis match tracker",
] as const;

export const SEO_KEYWORDS = [...PRIMARY_KEYWORDS, ...SECONDARY_KEYWORDS];

export const SEO_TITLE =
  "TTPro — Table Tennis Scoring, Tournament & Team Match Software";

export const SEO_DESCRIPTION =
  "Run every table tennis match, team event, and tournament live. TTPro delivers live scoring, automated brackets, Swaythling Cup & SDS team formats, player stats, and real-time sync for clubs and organizers.";

export const OG_IMAGE = `${SITE_URL}/imgs/logo.png`;

export function createLandingMetadata(): Metadata {
  return {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    keywords: SEO_KEYWORDS,
    authors: [{ name: BRAND_NAME }],
    creator: BRAND_NAME,
    publisher: BRAND_NAME,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: SITE_URL,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: SEO_TITLE,
      description: SEO_DESCRIPTION,
      url: SITE_URL,
      siteName: BRAND_NAME,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: OG_IMAGE,
          width: 512,
          height: 512,
          alt: `${BRAND_NAME} — ${TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_TITLE,
      description: SEO_DESCRIPTION,
      images: [OG_IMAGE],
      creator: "@ttpro",
    },
    category: "Sports",
  };
}
