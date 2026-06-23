import Link from "next/link";
import {
  ContentBlock,
  ContentFooterNote,
  ContentPageLayout,
  ContentSection,
} from "../ContentPageLayout";
import { createLegalMetadata } from "@/lib/legal/seo";
import { OPERATOR_NOTE, SUPPORT_EMAIL } from "@/lib/landing/site";

export const metadata = createLegalMetadata({
  title: "Privacy Policy",
  description:
    "How TTPro collects, uses, stores, and protects your personal information when you use our table tennis scoring and tournament platform.",
  path: "/privacy-policy",
});

const LAST_UPDATED = "June 20, 2026";

const sections = [
  {
    title: "Who We Are",
    blocks: [
      {
        title: "Data Controller",
        text: `${OPERATOR_NOTE} Reach us at ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  {
    title: "Information We Collect",
    blocks: [
      {
        title: "Account Information",
        text: "When you create an account, we collect your email address, username, full name, and optional profile information such as your profile picture and playing preferences.",
      },
      {
        title: "Match & Performance Data",
        text: "We collect data about your table tennis matches including scores, shot statistics, match outcomes, and performance analytics. This data is used to provide insights and improve your game.",
      },
      {
        title: "Usage Information",
        text: "We automatically collect information about how you interact with our service, including pages visited, features used, and time spent on the platform.",
      },
      {
        title: "Device Information",
        text: "We may collect device identifiers, browser type, operating system, and IP address for security and service optimization purposes.",
      },
      {
        title: "Location Information",
        text: "If you choose to add a location to your profile or use location-based features, we store the location you provide. We do not track your real-time GPS location in the background.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    blocks: [
      {
        title: "Provide Our Services",
        text: "We use your information to operate and maintain TTPro, including match scoring, statistics tracking, tournament management, and leaderboard features.",
      },
      {
        title: "Improve & Personalize",
        text: "Your usage data helps us understand how to improve our platform and provide personalized recommendations based on your playing style and preferences.",
      },
      {
        title: "Communication",
        text: "We may send you service-related announcements, updates about new features, and promotional content (which you can opt out of at any time).",
      },
      {
        title: "Security & Fraud Prevention",
        text: "We use information to protect our users and platform from unauthorized access, abuse, and fraudulent activity.",
      },
    ],
  },
  {
    title: "Information Sharing",
    blocks: [
      {
        title: "Public Profile Data",
        text: "Your username, profile picture, and match statistics may be visible to other users through leaderboards, public matches, and tournament brackets as part of the service functionality.",
      },
      {
        title: "Service Providers",
        text: "We work with trusted third-party services for hosting, analytics, payment processing, and email delivery. These providers only access data necessary to perform their services.",
      },
      {
        title: "Third-Party Services We Use",
        text: "Our platform integrates with Razorpay (payment processing), Google Sign-In (optional authentication), ZeptoMail (transactional email), and Vercel (hosting and privacy-friendly analytics). Each provider processes data according to their own privacy policies.",
      },
      {
        title: "Legal Requirements",
        text: "We may disclose information when required by law, to protect our rights, or in response to valid legal requests from public authorities.",
      },
      {
        title: "No Sale of Data",
        text: "We do not sell your personal information to third parties for marketing or advertising purposes.",
      },
    ],
  },
  {
    title: "Data Security",
    blocks: [
      {
        title: "Encryption",
        text: "We use industry-standard encryption protocols (TLS/SSL) to protect data transmitted between your device and our servers.",
      },
      {
        title: "Secure Storage",
        text: "Your data is stored on secure servers with access controls, regular security audits, and monitoring for unauthorized access attempts.",
      },
      {
        title: "Password Protection",
        text: "Your account password is hashed using secure algorithms. We never store passwords in plain text.",
      },
    ],
  },
  {
    title: "Your Rights & Choices",
    blocks: [
      {
        title: "Access & Portability",
        text: "You can access your personal information through your profile settings. You may request a copy of your data in a portable format.",
      },
      {
        title: "Correction",
        text: "You can update or correct your account information at any time through your profile settings.",
      },
      {
        title: "Deletion",
        text: "You may request deletion of your account and associated data. Some data may be retained for legal compliance or legitimate business purposes.",
      },
      {
        title: "Marketing Opt-Out",
        text: "You can unsubscribe from promotional emails by clicking the unsubscribe link in any marketing message or updating your notification preferences.",
      },
      {
        title: "Account Deletion",
        text: "You may delete your account from profile settings in the app or on our account deletion page. See the Data Retention section for what happens after deletion.",
      },
    ],
  },
  {
    title: "Children's Privacy",
    blocks: [
      {
        title: "Minimum Age",
        text: "TTPro is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us data, contact us and we will delete it promptly.",
      },
    ],
  },
  {
    title: "Cookies & Tracking",
    blocks: [
      {
        title: "Essential Cookies",
        text: "We use cookies necessary for the platform to function, such as authentication tokens and session management.",
      },
      {
        title: "Analytics",
        text: "We use analytics tools to understand how users interact with our platform. This helps us improve user experience and identify issues.",
      },
      {
        title: "Your Choices",
        text: "Most browsers allow you to control cookies through their settings. Note that disabling certain cookies may affect platform functionality.",
      },
    ],
  },
  {
    title: "Data Retention",
    blocks: [
      {
        title: "Active Accounts",
        text: "We retain your data while your account is active to provide our services and maintain your match history and statistics.",
      },
      {
        title: "Deleted Accounts",
        text: "When you delete your account, we remove your personal information within 30 days, except where retention is required for legal compliance.",
      },
      {
        title: "Anonymized Data",
        text: "We may retain anonymized, aggregated data that cannot be used to identify you for research and service improvement purposes.",
      },
    ],
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <ContentPageLayout
      title="Privacy Policy"
      description="How TTPro collects, uses, and protects your personal information."
      lastUpdated={LAST_UPDATED}
    >
      {sections.map((section) => (
        <ContentSection key={section.title} title={section.title}>
          {section.blocks.map((block) => (
            <ContentBlock key={block.title} title={block.title}>
              <p>{block.text}</p>
            </ContentBlock>
          ))}
        </ContentSection>
      ))}

      <ContentSection title="Questions about privacy?">
        <ContentBlock>
          <p>
            If you have questions about this policy or how we handle your data, email us at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </ContentBlock>
      </ContentSection>

      <ContentFooterNote>
        By using TTPro, you agree to this Privacy Policy. We may update this policy periodically
        and will notify you of significant changes through the platform or via email. See also our{" "}
        <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-neutral-700">
          Terms of Service
        </Link>
        .
      </ContentFooterNote>
    </ContentPageLayout>
  );
}
