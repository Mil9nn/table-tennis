import { BRAND_NAME, SITE_URL, SUPPORT_EMAIL, TAGLINE } from "./site";
import { SEO_DESCRIPTION } from "./seo";

export const FAQ_ITEMS = [
  {
    question: "What is the best table tennis scoring app?",
    answer:
      "TTPro is built for competitive table tennis—not casual point counting. It combines live singles and doubles scoring, team match formats like Swaythling Cup and SDS, tournament brackets, player profiles, and global leaderboards in one synchronized platform.",
  },
  {
    question: "How do I manage a table tennis tournament?",
    answer:
      "Create a tournament in TTPro, add players or import your roster, choose round-robin, knockout, or hybrid format, and let the engine generate brackets and schedules automatically. Score matches live on court—standings and progression update in real time.",
  },
  {
    question: "What is Swaythling Cup format?",
    answer:
      "Swaythling Cup is a classic team format with five singles rubbers. Each player may play once or twice across the five matches. TTPro tracks lineup order, rubber results, and team totals automatically—no spreadsheets required.",
  },
  {
    question: "How does round-robin work in table tennis?",
    answer:
      "In round-robin, every player or team plays every other participant once (or twice in double round-robin). TTPro generates the full schedule, tracks wins and point differential, and produces standings that feed directly into knockout stages when using hybrid formats.",
  },
  {
    question: "Can I score doubles matches live?",
    answer:
      "Yes. TTPro supports live doubles scoring with server rotation tracking, point-by-point updates, and instant sync across devices. Multiple scorers can collaborate on the same match without conflicts.",
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
    name: `${BRAND_NAME} — Table Tennis Competition OS`,
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
