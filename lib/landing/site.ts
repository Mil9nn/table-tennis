export const BRAND_NAME = "TTPro";
export const TAGLINE = "The all-in-one operating system for table tennis competitions.";
export const LOGO_SRC = "/imgs/logo.png";
export const SUPPORT_EMAIL = "app.ttpro@gmail.com";

/** Public-facing operator description — no personal names or physical address. */
export const OPERATOR_NOTE =
  "TTPro is independently developed and operated. We don't maintain a public office—support, billing, and legal inquiries are handled by email only.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ttpro.app";

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#team-formats", label: "Team formats" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-who", label: "Who it's for" },
  { href: "#compare", label: "Compare" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#faq", label: "FAQ" },
] as const;

export const CTA_LINKS = {
  startScoring: "/auth/register",
  runTournament: "/auth/register?intent=tournament",
  startNow: "/auth/register",
} as const;

export const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/account-deletion", label: "Account Deletion" },
  { href: "/refund-policy", label: "Refunds & Cancellations" },
  { href: "/shipping-policy", label: "Shipping & Delivery" },
  { href: "/contact", label: "Contact" },
] as const;

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61585491868674",
  instagram: "https://www.instagram.com/app.ttpro/",
} as const;
