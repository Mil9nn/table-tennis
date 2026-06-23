import Link from "next/link";
import {
  ContentBlock,
  ContentFooterNote,
  ContentPageLayout,
  ContentSection,
} from "../ContentPageLayout";
import { createLegalMetadata } from "@/lib/legal/seo";
import { SUPPORT_EMAIL } from "@/lib/landing/site";

export const metadata = createLegalMetadata({
  title: "Account Deletion",
  description:
    "How to delete your TTPro account and what happens to your data when you request account deletion.",
  path: "/account-deletion",
});

const LAST_UPDATED = "June 23, 2026";

const sections = [
  {
    title: "Delete Your Account in the App",
    blocks: [
      {
        title: "Steps",
        text: "Open the TTPro app, go to Profile, tap Delete account, type DELETE to confirm, and enter your password if you signed up with email. Your account and personal data will be removed.",
      },
      {
        title: "Sign-in Required",
        text: "You must be logged in to delete your account from the app. If you cannot access the app, email us from the address linked to your account and we will process your request.",
      },
    ],
  },
  {
    title: "What Gets Deleted",
    blocks: [
      {
        title: "Personal Information",
        text: "Your name, email, username, profile photo, phone number, location, bio, and other profile details are permanently removed from our systems.",
      },
      {
        title: "Account Data",
        text: "Your login credentials, verification tokens, subscription records tied to your account, and player statistics are deleted.",
      },
      {
        title: "Team & Tournament Membership",
        text: "You are removed from teams and tournaments you joined. Teams you captained without other members are deleted; otherwise captaincy transfers to another member.",
      },
    ],
  },
  {
    title: "What May Be Retained",
    blocks: [
      {
        title: "Match History",
        text: "Match scores and tournament results may remain in anonymized form so other players' histories stay intact. These records no longer identify you personally.",
      },
      {
        title: "Billing Records",
        text: "Payment and invoice records may be kept for up to 30 days (or longer where required by law) for tax, fraud prevention, and dispute resolution.",
      },
      {
        title: "Legal Compliance",
        text: "We may retain minimal information when required by applicable law or to resolve disputes.",
      },
    ],
  },
  {
    title: "Active Subscriptions",
    blocks: [
      {
        title: "Cancellation",
        text: "Deleting your account cancels any active TTPro Pro subscription. You will not be charged again after deletion.",
      },
    ],
  },
  {
    title: "Request Deletion by Email",
    blocks: [
      {
        title: "Cannot Access the App?",
        text: `Email ${SUPPORT_EMAIL} from the address associated with your TTPro account. Include your username and a request to delete your account. We will verify your identity and complete the deletion within 30 days.`,
      },
    ],
  },
];

export default function AccountDeletionPage() {
  return (
    <ContentPageLayout
      title="Account Deletion"
      description="How to delete your TTPro account and what happens to your data."
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

      <ContentFooterNote>
        Questions about account deletion?{" "}
        <Link
          href="/contact"
          className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
        >
          Contact us
        </Link>{" "}
        or email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Account%20Deletion%20Request`}
          className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </ContentFooterNote>
    </ContentPageLayout>
  );
}
