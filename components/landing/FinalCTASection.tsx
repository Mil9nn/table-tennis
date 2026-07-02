import { DownloadButton } from "./DownloadButton";
import { FadeIn } from "./motion";

export function FinalCTASection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative overflow-hidden py-16 sm:py-20"
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
            Ready to score live?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-[var(--lp-text-muted)] sm:text-lg">
            Download TTPro free on Android and run your next match or tournament.
          </p>
          <div className="mt-6 flex justify-center">
            <DownloadButton size="lg" className="px-10" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
