import Link from "next/link";
import {
  ContentBlock,
  ContentCallout,
  ContentFooterNote,
  ContentList,
  ContentPageLayout,
  ContentSection,
} from "../ContentPageLayout";
import { createLegalMetadata } from "@/lib/legal/seo";
import { SUPPORT_EMAIL } from "@/lib/landing/site";

export const metadata = createLegalMetadata({
  title: "Shipping & Delivery Policy",
  description:
    "How TTPro delivers premium digital features instantly after purchase. No physical shipping.",
  path: "/shipping-policy",
});

const LAST_UPDATED = "June 20, 2026";

const INCLUDED_FEATURES = [
  "Access to premium match scoring features",
  "Advanced statistics and analytics",
  "Tournament management tools",
  "Priority customer support",
  "Leaderboard and ranking features",
  "Team management capabilities",
] as const;

export default function ShippingPolicyPage() {
  return (
    <ContentPageLayout
      title="Shipping & Delivery Policy"
      description="How TTPro digital services are delivered after purchase."
      lastUpdated={LAST_UPDATED}
    >
      <ContentCallout>
        <p className="font-medium text-neutral-900">100% digital service</p>
        <p className="mt-2">
          TTPro is an online table tennis scoring, analytics, and tournament management platform. We
          do not sell or ship physical products.
        </p>
      </ContentCallout>

      <ContentSection title="Instant digital delivery">
        <ContentBlock title="How it works">
          <p>
            After successful payment, your subscription or premium features activate immediately.
            All services are delivered digitally through our platform—no physical shipping is
            involved.
          </p>
        </ContentBlock>
        <ContentBlock title="Access your services">
          <p>
            Log in to your TTPro account to use premium features right away. You will also receive
            a confirmation email with your purchase details.
          </p>
        </ContentBlock>
        <ContentBlock title="Delivery time">
          <p>
            Delivery is immediate upon successful payment. In rare cases of payment gateway delays,
            activation may take up to 15 minutes.
          </p>
        </ContentBlock>
      </ContentSection>

      <ContentSection title="Global availability">
        <ContentBlock title="Worldwide access">
          <p>
            TTPro is available globally wherever you have an internet connection, 24 hours a day, 7
            days a week.
          </p>
        </ContentBlock>
        <ContentBlock title="No shipping costs">
          <p>
            There are no shipping fees, customs duties, or delivery charges associated with your
            purchase.
          </p>
        </ContentBlock>
      </ContentSection>

      <ContentSection title="What's included in your purchase">
        <ContentList items={INCLUDED_FEATURES.map((feature) => <>{feature}</>)} />
      </ContentSection>

      <ContentSection title="Need assistance?">
        <ContentBlock>
          <p>
            If you have trouble accessing purchased services, email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            or visit our{" "}
            <Link
              href="/contact"
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
            >
              contact page
            </Link>
            .
          </p>
        </ContentBlock>
      </ContentSection>

      <ContentFooterNote>
        This policy applies to all digital services offered by TTPro. For refunds, see our{" "}
        <Link
          href="/refund-policy"
          className="underline underline-offset-2 hover:text-neutral-700"
        >
          Refund Policy
        </Link>
        .
      </ContentFooterNote>
    </ContentPageLayout>
  );
}
