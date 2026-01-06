import dynamic from "next/dynamic";
import { WagonWheelSection } from "@/components/match-stats/WagonWheelSection";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";

const MatchWeaknessesSection = dynamic(
  () =>
    import("@/components/weaknesses-analysis/MatchWeaknessesSection").then(
      (m) => ({ default: m.MatchWeaknessesSection })
    ),
  {
    loading: () => (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="animate-spin size-5" />
      </div>
    ),
  }
);

interface Props {
  stats: any;
}

export function MapsSection({ stats }: Props) {
  const { games, shots, participants, match } = stats;
  const { user } = useAuthStore();

  return (
    <div className="space-y-12">
      <WagonWheelSection
        participants={participants}
        allShots={shots}
        games={games}
        hideByGame={games.length <= 1}
      />

      <MatchWeaknessesSection
        matchId={match._id}
        category={stats.type}
        match={match}
        userId={user?._id || null}
      />
    </div>
  );
}
