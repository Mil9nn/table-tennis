import MarketingFooter from "./components/MarketingFooter";
import Hero from "./components/Hero";
import CoreValueProps from "./components/CoreValueProps";
import Features from "./components/Features";
import FinalCTA from "./FinalCTA";

export default function MarketingPage() {
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
