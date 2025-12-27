import MarketingFooter from "./components/MarketingFooter";
import Hero from "./components/Hero";
import CoreValueProps from "./components/CoreValueProps";
import Features from "./components/Features";
import RoleBasedHowItWorks from "./components/RoleBasedHowItWorks";
import Trust from "./Trust";
import FinalCTA from "./FinalCTA";

export default function MarketingPage() {
  return (
    <div className="marketing" style={{ backgroundColor: "#353535" }}>
      <Hero />
      <CoreValueProps />
      <Features />
      <RoleBasedHowItWorks />
      <Trust />
      <FinalCTA />
      <MarketingFooter />
    </div>
  );
}
