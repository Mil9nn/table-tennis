import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { CTA_LINKS } from "@/lib/landing/site";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./motion";
import { HeroVisual } from "./HeroVisual";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--lp-glow-hero),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[var(--lp-grid-opacity)]"
        style={{
          backgroundImage:
            "linear-gradient(var(--lp-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid-line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <FadeIn>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-surface)] px-3 py-1 text-xs font-medium text-[var(--lp-text-muted)]">
                <span className="size-1.5 rounded-full bg-[var(--lp-live)]" aria-hidden="true" />
                Table Tennis Competition OS
              </p>
            </FadeIn>

            <FadeIn delay={0.05}>
              <h1
                id="hero-heading"
                className="font-[family-name:var(--font-syne)] text-[2.25rem] font-bold leading-[1.08] tracking-tight text-[var(--lp-text)] sm:text-5xl lg:text-[3.25rem]"
              >
                Run every table tennis match, team event, and tournament —{" "}
                <span className="bg-gradient-to-r from-[var(--lp-accent)] to-[var(--lp-accent-end)] bg-clip-text text-transparent">
                  live.
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--lp-text-muted)] sm:text-lg">
                Create singles, doubles, team matches, and tournaments with live scoring,
                automated brackets, player stats, leaderboards, and real-time
                synchronization. The table tennis tournament software built for
                serious competition.
              </p>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-[var(--lp-accent)] px-7 text-base font-semibold text-[var(--lp-on-accent)] hover:bg-[var(--lp-accent-hover)]"
                >
                  <Link href={CTA_LINKS.startScoring}>
                    Start Scoring
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full border-[var(--lp-border)] bg-transparent px-7 text-base text-[var(--lp-text)] hover:bg-[var(--lp-hover)]"
                >
                  <Link href={CTA_LINKS.runTournament}>
                    <Play className="size-4" aria-hidden="true" />
                    Run a Tournament
                  </Link>
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 text-xs text-[var(--lp-text-muted)]">
                Free to start · No credit card · Live sync on every device
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.1} direction="left">
            <HeroVisual />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
