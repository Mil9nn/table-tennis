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
  title: "Cancellation & Refund Policy",
  description:
    "TTPro subscription cancellation and refund policy for digital services purchased through the platform.",
  path: "/refund-policy",
});

const LAST_UPDATED = "June 20, 2026";

export default function RefundPolicyPage() {
  return (
    <ContentPageLayout
      title="Cancellation & Refund Policy"
      description="Our refund and cancellation policy for TTPro subscriptions and payments."
      lastUpdated={LAST_UPDATED}
    >
      <ContentCallout>
        <p className="font-medium text-neutral-900">No refunds</p>
        <p className="mt-2">
          All purchases on TTPro are final and non-refundable. Once a subscription or payment is
          processed, no refunds will be issued under any circumstances.
        </p>
      </ContentCallout>

      <ContentSection title="Why we don't offer refunds">
        <ContentBlock>
          <p>
            TTPro provides immediate access to premium digital features upon purchase. Since our
            services are delivered instantly and can be used immediately after payment, we maintain
            a strict no-refund policy.
          </p>
        </ContentBlock>
        <ContentBlock>
          <p>
            We encourage all users to thoroughly explore our free features before upgrading to a
            premium subscription.
          </p>
        </ContentBlock>
      </ContentSection>

      <ContentSection title="Before you purchase">
        <ContentList
          items={[
            <>Try our free features to understand how the platform works.</>,
            <>Review subscription details and what each plan includes.</>,
            <>
              Read our{" "}
              <Link
                href="/terms-of-service"
                className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
              >
                Terms of Service
              </Link>
              .
            </>,
            <>
              Contact{" "}
              <Link
                href="/contact"
                className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
              >
                support
              </Link>{" "}
              if you have questions.
            </>,
          ]}
        />
      </ContentSection>

      <ContentSection title="Subscription cancellation">
        <ContentBlock title="How to cancel">
          <p>
            Cancel anytime through your account settings: Profile → Subscription → Cancel
            Subscription. You can also contact our support team for assistance.
          </p>
        </ContentBlock>
        <ContentBlock title="When cancellation takes effect">
          <p>
            Cancellation takes effect at the end of your current billing period. You keep premium
            access until then. No refunds or prorated credits are issued for the remaining period.
          </p>
        </ContentBlock>
        <ContentBlock title="After cancellation">
          <p>
            Your account reverts to the free plan. Match history and data are preserved, but premium
            features such as advanced analytics and unlimited tournaments are no longer available.
          </p>
        </ContentBlock>
      </ContentSection>

      <ContentSection title="Limited exceptions">
        <ContentBlock>
          <p>
            In rare cases, we may consider exceptions at our sole discretion: duplicate charges due
            to technical errors, unauthorized transactions (with valid proof), or extended complete
            service unavailability. These are evaluated case by case and are not guaranteed.
          </p>
        </ContentBlock>
      </ContentSection>

      <ContentSection title="Questions?">
        <ContentBlock>
          <p>
            Email{" "}
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
        By making a purchase on TTPro, you acknowledge that you have read and agree to this
        no-refund policy.
      </ContentFooterNote>
    </ContentPageLayout>
  );
}
