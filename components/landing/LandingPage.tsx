import { LandingFooter, LandingHeader } from "./LandingChrome";
import { ComparisonSection } from "./ComparisonSection";
import { FAQSection } from "./FAQSection";
import { FeaturesSection } from "./FeaturesSection";
import { FinalCTASection } from "./FinalCTASection";
import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { JsonLd } from "./JsonLd";
import { RoadmapSection } from "./RoadmapSection";
import { TrustBar } from "./TrustBar";
import { WhoItsForSection } from "./WhoItsForSection";

export function LandingPage() {
  return (
    <>
      <JsonLd />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--lp-accent)] focus:px-4 focus:py-2 focus:text-[var(--lp-on-accent)] focus:outline-none"
      >
        Skip to main content
      </a>
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <TrustBar />
        <FeaturesSection />
        <HowItWorksSection />
        <WhoItsForSection />
        <ComparisonSection />
        <RoadmapSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </>
  );
}
