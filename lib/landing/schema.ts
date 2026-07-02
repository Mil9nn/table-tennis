import { BRAND_NAME, SITE_URL, SUPPORT_EMAIL, TAGLINE } from "./site";
import { SEO_DESCRIPTION } from "./seo";

export const FAQ_ITEMS = [
  {
    question: "What makes TTPro different from other scoring apps?",
    answer:
      "TTPro goes beyond point counting — live singles and doubles scoring, team formats like Swaythling Cup and SDS, tournament brackets, and player stats, all synced in real time.",
  },
  {
    question: "How do I run a tournament?",
    answer:
      "Create a tournament, add players, pick round-robin, knockout, or hybrid, and TTPro generates brackets and schedules. Score live on court — standings update instantly.",
  },
  {
    question: "Does it support team matches?",
    answer:
      "Yes. TTPro handles Swaythling Cup, SDS, and custom team formats with lineup tracking, rubber results, and team totals — no spreadsheets needed.",
  },
] as const;

export function buildSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web, Android, iOS",
    description: SEO_DESCRIPTION,
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available with premium plans for clubs and organizers",
    },
    featureList: [
      "Live match scoring for singles and doubles",
      "Team match formats including Swaythling Cup and SDS",
      "Tournament engine with round-robin, knockout, and hybrid formats",
      "Player profiles with stats and match history",
      "Global leaderboards and rankings",
      "Real-time synchronization across devices",
    ],
    screenshot: `${SITE_URL}/imgs/logo.png`,
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/imgs/logo.png`,
    description: TAGLINE,
    email: SUPPORT_EMAIL,
    sameAs: [],
  };
}

export function buildFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildSportsEventSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "Table Tennis Tournament Management",
    description:
      "TTPro powers live table tennis tournaments with real-time scoring, automated brackets, and standings for clubs, leagues, and competitive events worldwide.",
    sport: "Table Tennis",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: SITE_URL,
    },
    location: {
      "@type": "VirtualLocation",
      url: SITE_URL,
    },
  };
}

export function buildWebPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${BRAND_NAME} — ${TAGLINE}`,
    description: SEO_DESCRIPTION,
    url: SITE_URL,
    isPartOf: {
      "@type": "WebSite",
      name: BRAND_NAME,
      url: SITE_URL,
    },
    about: {
      "@type": "Thing",
      name: "Table tennis tournament and live scoring software",
    },
  };
}

export function getAllSchemas() {
  return [
    buildSoftwareApplicationSchema(),
    buildOrganizationSchema(),
    buildFAQSchema(),
    buildSportsEventSchema(),
    buildWebPageSchema(),
  ];
}
