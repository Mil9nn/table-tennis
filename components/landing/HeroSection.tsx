import { DownloadButton } from "./DownloadButton";
import { FadeIn } from "./motion";
import { TAGLINE } from "@/lib/landing/site";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-14 lg:pt-32 lg:pb-16"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--lp-glow-hero),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6 lg:px-8">
        <FadeIn>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-surface)] px-3 py-1 text-xs font-medium text-[var(--lp-text-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--lp-live)]" aria-hidden="true" />
            {TAGLINE}
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <h1
            id="hero-heading"
            className="font-[family-name:var(--font-syne)] text-[clamp(1.75rem,4vw+1rem,3.25rem)] font-bold leading-[1.08] tracking-tight text-balance text-[var(--lp-text)]"
          >
            Every match and tournament —{" "}
            <span className="bg-gradient-to-r from-[var(--lp-accent)] to-[var(--lp-accent-end)] bg-clip-text text-transparent">
              live.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--lp-text-muted)] sm:text-lg">
            Live scoring, automated brackets, and real-time sync for singles,
            doubles, team events, and tournaments.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-8 flex justify-center">
            <DownloadButton size="lg" />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-6 text-xs text-[var(--lp-text-muted)]">
            Available on Android · Free to download · Live sync on every device
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
