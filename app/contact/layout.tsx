import { createLegalMetadata } from "@/lib/legal/seo";

export const metadata = createLegalMetadata({
  title: "Contact",
  description:
    "Contact TTPro for support, billing questions, privacy requests, and general inquiries about our table tennis platform.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
