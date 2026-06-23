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
  title: "Terms of Service",
  description:
    "Terms and conditions for using TTPro, including account rules, subscriptions, acceptable use, and liability.",
  path: "/terms-of-service",
});

const LAST_UPDATED = "June 20, 2026";

const sections = [
  {
    title: "Agreement to Terms",
    blocks: [
      {
        title: "Acceptance",
        text: "By accessing or using TTPro, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of the terms, you may not access the service.",
      },
      {
        title: "Eligibility",
        text: "You must be at least 13 years old to use TTPro. If you are under 18, you represent that you have your parent's or guardian's permission to use the service.",
      },
      {
        title: "Account Registration",
        text: "To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.",
      },
      {
        title: "About TTPro",
        text: `${OPERATOR_NOTE} Reach us at ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  {
    title: "User Conduct",
    blocks: [
      {
        title: "Acceptable Use",
        text: "You agree to use TTPro only for lawful purposes and in accordance with these Terms. You agree not to use the service in any way that could damage, disable, overburden, or impair the service.",
      },
      {
        title: "Prohibited Activities",
        text: "You may not: attempt to gain unauthorized access to other user accounts; interfere with other users' enjoyment of the service; submit false or misleading information; use the service for any commercial purpose without our consent.",
      },
      {
        title: "Fair Play",
        text: "When using match scoring and tournament features, you agree to report accurate scores and statistics. Manipulation of scores or statistics to gain unfair advantages on leaderboards is prohibited.",
      },
      {
        title: "Community Standards",
        text: "You agree not to post, upload, or share content that is offensive, harassing, threatening, or otherwise objectionable. We reserve the right to remove such content and suspend accounts that violate these standards.",
      },
    ],
  },
  {
    title: "Intellectual Property",
    blocks: [
      {
        title: "Our Content",
        text: "The TTPro platform, including its design, features, content, and code, is owned by us and protected by copyright, trademark, and other intellectual property laws.",
      },
      {
        title: "Your Content",
        text: "You retain ownership of content you create through the service, such as match data and team information. By using our service, you grant us a license to use, store, and display this content as necessary to provide the service.",
      },
      {
        title: "Feedback",
        text: "If you provide us with feedback, suggestions, or ideas, you grant us the right to use such feedback without restriction or compensation to you.",
      },
    ],
  },
  {
    title: "Subscriptions & Payments",
    blocks: [
      {
        title: "Free & Paid Features",
        text: "TTPro offers both free and premium subscription plans. Some features are only available to premium subscribers.",
      },
      {
        title: "Billing",
        text: "If you purchase a subscription, you agree to pay all applicable fees. Subscriptions automatically renew unless cancelled before the renewal date.",
      },
      {
        title: "Cancellation",
        text: "You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period.",
      },
      {
        title: "Refunds",
        text: "All purchases are subject to our Refund Policy. Subscriptions are generally non-refundable once processed. Review the policy before purchasing.",
      },
    ],
  },
  {
    title: "Disclaimers",
    blocks: [
      {
        title: "Service Availability",
        text: "We strive to keep TTPro available and functioning properly, but we do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.",
      },
      {
        title: "No Warranty",
        text: "TTPro is provided 'as is' and 'as available' without warranties of any kind, either express or implied. We do not warrant that the service will meet your specific requirements or expectations.",
      },
      {
        title: "Accuracy",
        text: "While we strive for accuracy, we do not guarantee that match statistics, rankings, or other data displayed on the platform are error-free.",
      },
    ],
  },
  {
    title: "Limitation of Liability",
    blocks: [
      {
        title: "Exclusion of Damages",
        text: "To the maximum extent permitted by law, TTPro shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.",
      },
      {
        title: "Cap on Liability",
        text: "Our total liability to you for any claims arising from or related to the service shall not exceed the amount you paid us, if any, for accessing the service in the 12 months preceding the claim.",
      },
    ],
  },
  {
    title: "Changes to Terms",
    blocks: [
      {
        title: "Modifications",
        text: "We reserve the right to modify these Terms at any time. We will provide notice of significant changes through the platform or via email.",
      },
      {
        title: "Continued Use",
        text: "Your continued use of TTPro after any changes to the Terms constitutes your acceptance of the new Terms.",
      },
    ],
  },
  {
    title: "Termination",
    blocks: [
      {
        title: "Account Termination",
        text: "You may terminate your account at any time by contacting us or using account settings. We reserve the right to suspend or terminate your account for violations of these Terms.",
      },
      {
        title: "Effect of Termination",
        text: "Upon termination, your right to use the service will immediately cease. Provisions of these Terms that should survive termination will remain in effect.",
      },
    ],
  },
  {
    title: "Governing Law",
    blocks: [
      {
        title: "Jurisdiction",
        text: "These Terms are governed by the laws of India, without regard to conflict-of-law principles. Any disputes arising from these Terms or your use of TTPro shall be subject to the exclusive jurisdiction of courts in India, unless applicable consumer protection laws in your country require otherwise.",
      },
    ],
  },
] as const;

export default function TermsOfServicePage() {
  return (
    <ContentPageLayout
      title="Terms of Service"
      description="Please read these terms carefully before using TTPro."
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

      <ContentSection title="Questions about these terms?">
        <ContentBlock>
          <p>
            Contact us at{" "}
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

      <ContentSection title="Related policies">
        <ContentBlock>
          <p>
            Subscriptions and payments are also covered by our{" "}
            <Link
              href="/refund-policy"
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
            >
              Refund Policy
            </Link>
            ,{" "}
            <Link
              href="/shipping-policy"
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
            >
              Shipping & Delivery Policy
            </Link>
            , and{" "}
            <Link
              href="/privacy-policy"
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </ContentBlock>
      </ContentSection>

      <ContentFooterNote>
        These Terms of Service constitute the entire agreement between you and TTPro regarding
        your use of the service. If any provision is found to be unenforceable, the remaining
        provisions will remain in effect.
      </ContentFooterNote>
    </ContentPageLayout>
  );
}
