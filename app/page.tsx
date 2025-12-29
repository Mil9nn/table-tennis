import MarketingFooter from "./marketing/components/MarketingFooter";
import Hero from "./marketing/components/Hero";
import CoreValueProps from "./marketing/components/CoreValueProps";
import Features from "./marketing/components/Features";
import FinalCTA from "./marketing/FinalCTA";

export default function HomePage() {
  return (
    <div className="marketing" style={{ backgroundColor: "#353535" }}>
      <Hero />
      <CoreValueProps />
      <Features />
      <FinalCTA />
      <MarketingFooter />
    </div>
  );
}
