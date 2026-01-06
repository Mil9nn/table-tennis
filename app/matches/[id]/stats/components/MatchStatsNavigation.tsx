import { SectionNavigation } from "@/components/match-stats/SectionNavigation";
import { Section } from "@/components/match-stats/SectionNavigation";

interface Props {
  sections: Section[];
  activeSection: string;
  onNavigate: (id: string) => void;
}

export function MatchStatsNavigation(props: Props) {
  return <SectionNavigation {...props} />;
}
