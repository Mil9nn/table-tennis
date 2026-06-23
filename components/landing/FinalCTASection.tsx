import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CTA_LINKS } from "@/lib/landing/site";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./motion";

export function FinalCTASection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative overflow-hidden py-24 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,var(--lp-glow-cta),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-6">
        <FadeIn>
          <h2
            id="final-cta-heading"
            className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-[var(--lp-text)] sm:text-4xl lg:text-5xl"
          >
            The future of table tennis competition starts here.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-[var(--lp-text-muted)] sm:text-lg">
            Join players, coaches, and organizers who run every match on TTPro—the
            all-in-one table tennis tournament software and live scoring platform.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[var(--lp-accent)] px-10 text-base font-semibold text-[var(--lp-on-accent)] hover:bg-[var(--lp-accent-hover)]"
            >
              <Link href={CTA_LINKS.startNow}>
                Start Now
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
