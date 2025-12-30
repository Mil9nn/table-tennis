"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2, BarChart3, Target, Map, Sparkles } from "lucide-react";
import { useMatchStore } from "@/hooks/useMatchStore";
import { isIndividualMatch, isTeamMatch } from "@/types/match.type";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isUserParticipantInMatch } from "@/lib/matchHelpers";

// New Components
import {
  MatchSummary,
} from "@/components/match-stats/MatchSummary";
import {
  SectionNavigation,
  Section,
} from "@/components/match-stats/SectionNavigation";
import { StatsSectionContainer } from "@/components/match-stats/StatsSectionContainer";
import { InsightCard } from "@/components/match-stats/InsightCard";
import { AchievementBadges } from "@/components/match-stats/AchievementBadges";
import { MatchTimeline } from "@/components/match-stats/MatchTimeline";
import { PerformanceCommentary } from "@/components/match-stats/PerformanceCommentary";

// Existing Components
import { ServeReceiveChart } from "@/components/match-stats/ServeReceiveChart";
import { ServeTypeChart } from "@/components/match-stats/ServeTypeChart";
import { ShotTypeChart } from "@/components/match-stats/ShotTypeChart";
import { GameProgressionChart } from "@/components/match-stats/GameProgressionChart";
import { GameByGameBreakdown } from "@/components/match-stats/GameByGameBreakdown";
import { PlayerShotAnalysis } from "@/components/match-stats/PlayerShotAnalysis";
import { WagonWheelSection } from "@/components/match-stats/WagonWheelSection";

// Lazy loaded heavy components
const MatchWeaknessesSection = dynamic(
  () =>
    import("@/components/weaknesses-analysis/MatchWeaknessesSection").then(
      (mod) => ({ default: mod.MatchWeaknessesSection })
    ),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    ),
  }
);

import {
  computeStats,
  computePlayerStats,
  computeServeStats,
  computeServeTypeStats,
  detectAchievements,
  generatePerformanceInsights,
  generatePerformanceCommentary,
  calculateTotalWinningShots,
} from "@/lib/match-stats-utils";
import { formatStrokeName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share } from "@mui/icons-material";
import { toast } from "sonner";


const SECTIONS: Section[] = [
  { id: "overview", label: "Overview", icon: <Sparkles className="h-4 w-4" /> },
  {
    id: "performance",
    label: "Performance",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: "details",
    label: "Game Details",
    icon: <Target className="h-4 w-4" />,
  },
  { id: "maps", label: "Shot Maps", icon: <Map className="h-4 w-4" /> },
];

export default function MatchStatsPage() {
  const params = useParams();
   const router = useRouter();
   const matchId = params.id as string;
   const { match, fetchingMatch, fetchMatch } = useMatchStore();
   const { user } = useAuthStore();

  // Section tracking
  const [activeSection, setActiveSection] = useState("overview");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Intersection Observer for active section tracking
  useEffect(() => {
    const observerOptions = {
      rootMargin: "-110px 0px -66%", // Account for sticky headers height
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [match]);

  // Fetch match data
  useEffect(() => {
    if (!matchId) return;
    const searchParams = new URLSearchParams(window.location.search);
    const category =
      (searchParams.get("category") as "individual" | "team") || "individual";
    fetchMatch(matchId, category);
  }, [matchId, fetchMatch]);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const offset = 110; // Account for sticky headers (top actions ~49px + navigation ~61px)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Process Individual Match Data (moved before conditional returns)
  const individualMatchData = useMemo(() => {
    if (!match || !isIndividualMatch(match)) return null;

    const isSingles = match.matchType === "singles";
    const isDoubles =
      match.matchType === "doubles";

    const side1Name = isSingles
      ? match.participants?.[0]?.fullName ||
        match.participants?.[0]?.username ||
        "Player 1"
      : isDoubles
      ? "Side 1"
      : "Player 1";

    const side2Name = isSingles
      ? match.participants?.[1]?.fullName ||
        match.participants?.[1]?.username ||
        "Player 2"
      : isDoubles
      ? "Side 2"
      : "Player 2";

    const allGames = match.games || [];
    const shots = allGames.flatMap((g) => g.shots || []);
    const allParticipants = match.participants || [];

    const { shotTypes } = computeStats(shots);
    const playerStats = computePlayerStats(shots);
    const serveStats = computeServeStats(allGames, match.matchCategory);
    const serveTypeStats = computeServeTypeStats(allGames);

    const serveData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = allParticipants.find((p) => p._id.toString() === playerId);
      return {
        player: player?.fullName || player?.username || "Unknown",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });

    const serveTypeData = Object.entries(serveTypeStats)
      .map(([playerId, s]) => {
        const player = allParticipants.find(
          (p) => p._id.toString() === playerId
        );
        const playerName = player?.fullName || player?.username || "Unknown";
        return {
          player: playerName,
          type: "Serve" as const,
          side_spin: s.serve.side_spin || 0,
          top_spin: s.serve.top_spin || 0,
          back_spin: s.serve.back_spin || 0,
          mix_spin: s.serve.mix_spin || 0,
          no_spin: s.serve.no_spin || 0,
        };
      })
      .filter((d) => d.side_spin + d.top_spin + d.back_spin + d.mix_spin + d.no_spin > 0);

    const strokeData = Object.entries(shotTypes).map(([type, value]) => ({
      name: formatStrokeName(type),
      value,
    }));

    const playerPieData = Object.entries(playerStats).map(
      ([playerId, pStats]) => ({
        playerId,
        playerName: pStats.name,
        data: Object.entries(pStats.strokes).map(([stroke, count]) => ({
          name: formatStrokeName(stroke),
          value: count,
        })),
      })
    );

    const gameProgressionData = allGames.map((game, idx) => ({
      game: `G${idx + 1}`,
      [side1Name]: game.side1Score,
      [side2Name]: game.side2Score,
    }));

    const achievements = detectAchievements(
      allGames,
      match.finalScore,
      match.winnerSide || undefined
    );
    const insights = generatePerformanceInsights(
      shotTypes,
      serveStats,
      shots.length,
      [side1Name, side2Name]
    );
    const commentary = generatePerformanceCommentary(
      shotTypes,
      serveStats,
      allGames,
      shots.length
    );
    const totalWinningShots = calculateTotalWinningShots(allGames);

    return {
      side1Name,
      side2Name,
      allGames,
      shots,
      allParticipants,
      stats: {
        shotTypes,
        serveData,
        serveTypeData,
        strokeData,
        playerPieData,
        gameProgressionData,
        achievements,
        insights,
        commentary,
        totalWinningShots,
      },
    };
  }, [match]);

  // Process Team Match Data (moved before conditional returns)
  const teamMatchData = useMemo(() => {
    if (!match || !isTeamMatch(match)) return null;

    const team1Name = match.team1?.name || "Team 1";
    const team2Name = match.team2?.name || "Team 2";

    const allSubMatchGames =
      match.subMatches?.flatMap((sm) => sm.games || []) || [];
    const allShots = allSubMatchGames.flatMap((g) => g.shots || []);

    const team1Players = match.team1?.players?.map((p) => p.user) || [];
    const team2Players = match.team2?.players?.map((p) => p.user) || [];
    const allParticipants = [...team1Players, ...team2Players];

    const { shotTypes } = computeStats(allShots);
    const playerStats = computePlayerStats(allShots);
    const serveStats = computeServeStats(allSubMatchGames, match.matchCategory);
    const serveTypeStats = computeServeTypeStats(allSubMatchGames);

    const serveData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = allParticipants.find(
        (p) => p._id?.toString() === playerId
      );
      return {
        player: player?.fullName || player?.username || "Unknown",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });

    const serveTypeData = Object.entries(serveTypeStats)
      .map(([playerId, s]) => {
        const player = allParticipants.find(
          (p) => p._id?.toString() === playerId
        );
        const playerName = player?.fullName || player?.username || "Unknown";
        return {
          player: playerName,
          type: "Serve" as const,
          side_spin: s.serve.side_spin || 0,
          top_spin: s.serve.top_spin || 0,
          back_spin: s.serve.back_spin || 0,
          mix_spin: s.serve.mix_spin || 0,
          no_spin: s.serve.no_spin || 0,
        };
      })
      .filter((d) => d.side_spin + d.top_spin + d.back_spin + d.mix_spin + d.no_spin > 0);

    const strokeData = Object.entries(shotTypes).map(([type, value]) => ({
      name: formatStrokeName(type),
      value,
    }));

    const playerPieData = Object.entries(playerStats).map(
      ([playerId, pStats]) => ({
        playerId,
        playerName: pStats.name,
        data: Object.entries(pStats.strokes).map(([stroke, count]) => ({
          name: formatStrokeName(stroke),
          value: count,
        })),
      })
    );

    const subMatchProgressionData =
      match.subMatches?.map((sm, idx) => ({
        game: `M${idx + 1}`,
        [team1Name]: sm.finalScore?.team1Sets || 0,
        [team2Name]: sm.finalScore?.team2Sets || 0,
      })) || [];

    const achievements = detectAchievements(
      allSubMatchGames,
      match.finalScore,
      undefined
    );
    const insights = generatePerformanceInsights(
      shotTypes,
      serveStats,
      allShots.length,
      [team1Name, team2Name]
    );
    const commentary = generatePerformanceCommentary(
      shotTypes,
      serveStats,
      allSubMatchGames,
      allShots.length
    );
    const totalWinningShots = calculateTotalWinningShots(allSubMatchGames);

    return {
      team1Name,
      team2Name,
      allSubMatchGames,
      allShots,
      allParticipants,
      stats: {
        shotTypes,
        serveData,
        serveTypeData,
        strokeData,
        playerPieData,
        subMatchProgressionData,
        achievements,
        insights,
        commentary,
        totalWinningShots,
      },
    };
  }, [match]);

  // Loading state
  if (fetchingMatch) {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center gap-2">
        <Loader2 className="animate-spin size-4" />
        <span className="text-sm">Loading stats...</span>
      </div>
    );
  }

  // Not found state
  if (!match) {
    return (
      <div className="container mx-auto py-8 text-center">Match not found</div>
    );
  }




  const handleShare = async () => {
    const matchCategory = match.matchCategory;
    const side1Name = individualMatchData?.side1Name || teamMatchData?.team1Name || 'Team 1';
    const side2Name = individualMatchData?.side2Name || teamMatchData?.team2Name || 'Team 2';

    const shareUrl = `${window.location.origin}/matches/${match._id}/stats?category=${matchCategory}`;

    if (navigator.share) {
      await navigator.share({
        title: `Match Stats - ${side1Name} vs ${side2Name}`,
        url: shareUrl,
      });
      toast.success("Match shared!");
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  // Render for Individual Match
  if (individualMatchData) {
    const { side1Name, side2Name, allGames, shots, allParticipants, stats } =
      individualMatchData;

    return (
      <div className="min-h-screen bg-white">
        {/* Top Actions */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-2 bg-white border-b border-[#d9d9d9]">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-[#353535] hover:bg-[#f8f8f8] gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="inline">Back</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="bg-white border-[#d9d9d9] text-[#353535] hover:bg-[#f8f8f8] gap-2"
          >
            <Share fontSize="small" />
            <span>Share</span>
          </Button>
        </div>

        {/* Section Navigation */}
        <SectionNavigation
          sections={SECTIONS}
          activeSection={activeSection}
          onNavigate={scrollToSection}
        />

        {/* Main Content */}
        <main className="pb-20">
          {/* Persistent Summary */}
          <MatchSummary
            match={match}
            matchCategory={match.matchCategory}
            side1Name={side1Name}
            side2Name={side2Name}
            side1Sets={'side1Sets' in match.finalScore ? match.finalScore.side1Sets : 0}
            side2Sets={'side2Sets' in match.finalScore ? match.finalScore.side2Sets : 0}
          />
          {/* SECTION 1: MATCH OVERVIEW */}
          <StatsSectionContainer
            id="overview"
            title="Match Overview"
            description="Key insights and highlights from the match"
            ref={(el) => {
              sectionRefs.current.overview = el;
            }}
          >
            {/* Achievement Badges */}
            {stats.achievements.length > 0 && (
              <AchievementBadges achievements={stats.achievements} />
            )}

            {/* Key Insights Grid */}
            {stats.insights.length > 0 && (
              <div className="grid md:grid-cols-2">
                {stats.insights.map((insight, idx) => (
                  <InsightCard
                    key={idx}
                    type={insight.type}
                    icon={<BarChart3 className="h-5 w-5" />}
                    headline={insight.headline}
                    description={insight.description}
                    metric={insight.metric}
                    delay={idx * 0.1}
                  />
                ))}
              </div>
            )}

            {/* Match Timeline */}
            <MatchTimeline
              games={allGames as any}
              side1Name={side1Name}
              side2Name={side2Name}
              winnerSide={'winnerSide' in match ? match.winnerSide || undefined : undefined}
            />
          </StatsSectionContainer>

          {/* SECTION 2: PERFORMANCE BREAKDOWN */}
          <StatsSectionContainer
            id="performance"
            title="Performance Analysis"
            description="Detailed breakdown of shots, serves, and gameplay"
            icon={<BarChart3 className="h-6 w-6" />}
            ref={(el) => {
              sectionRefs.current.performance = el;
            }}
          >
            {/* Written Commentary */}
            {stats.commentary.length > 0 && (
              <PerformanceCommentary commentary={stats.commentary} />
            )}

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ServeReceiveChart data={stats.serveData} />
              {stats.serveTypeData && stats.serveTypeData.length > 0 && <ServeTypeChart data={stats.serveTypeData} />}
              <ShotTypeChart data={stats.strokeData} />
            </div>

            {/* Game Progression */}
            {allGames.length > 1 && (
              <GameProgressionChart
                data={stats.gameProgressionData}
                side1Name={side1Name}
                side2Name={side2Name}
              />
            )}
          </StatsSectionContainer>

          {/* SECTION 3: GAME DETAILS */}
          <StatsSectionContainer
            title=""
            id="details"
            ref={(el) => {
              sectionRefs.current.details = el;
            }}
          >
            <GameByGameBreakdown
              games={allGames}
              side1Name={side1Name}
              side2Name={side2Name}
              participants={allParticipants}
              finalScore={'side1Sets' in match.finalScore ? match.finalScore : undefined}
            />

            {/* Per-Player Analysis */}
            <div className="mt-8">
              <PlayerShotAnalysis playerPieData={stats.playerPieData} />
            </div>
          </StatsSectionContainer>

          {/* SECTION 4: SHOT MAPS & WEAKNESSES */}
          <StatsSectionContainer
            id="maps"
            title="Shot Maps & Weakness Analysis"
            description="Visualize shot placement and identify areas for improvement"
            icon={<Map className="h-6 w-6" />}
            ref={(el) => {
              sectionRefs.current.maps = el;
            }}
          >
            {/* Wagon Wheels */}
            <WagonWheelSection
              participants={allParticipants}
              allShots={shots}
              games={allGames}
              hideByGame={allGames.length <= 1}
            />

            {/* Weaknesses Section */}
            <div className="mt-8">
              <MatchWeaknessesSection 
                matchId={matchId} 
                category="individual" 
                match={match}
                userId={user?._id || null}
              />
            </div>
          </StatsSectionContainer>
        </main>
      </div>
    );
  }

  // Render for Team Match
  if (teamMatchData) {
    const {
      team1Name,
      team2Name,
      allSubMatchGames,
      allShots,
      allParticipants,
      stats,
    } = teamMatchData;

    return (
      <div className="min-h-screen bg-white">
        {/* Top Actions */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-2 bg-white border-b border-[#d9d9d9]">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-[#353535] hover:bg-[#f8f8f8] gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="inline">Back</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="bg-white border-[#d9d9d9] text-[#353535] hover:bg-[#f8f8f8] gap-2"
          >
            <Share fontSize="small" />
            <span>Share</span>
          </Button>
        </div>

        {/* Section Navigation */}
        <SectionNavigation
          sections={SECTIONS}
          activeSection={activeSection}
          onNavigate={scrollToSection}
        />

        {/* Main Content */}
        <main className="pb-20">
          {/* Persistent Summary */}
          <MatchSummary
            match={match}
            matchCategory={match.matchCategory}
            side1Name={team1Name}
            side2Name={team2Name}
            side1Sets={'team1Matches' in match.finalScore ? match.finalScore.team1Matches : 0}
            side2Sets={'team2Matches' in match.finalScore ? match.finalScore.team2Matches : 0}
          />
          {/* SECTION 1: MATCH OVERVIEW */}
          <StatsSectionContainer
            id="overview"
            title="Match Overview"
            description="Key insights and highlights from the match"
            ref={(el) => {
              sectionRefs.current.overview = el;
            }}
          >
            {/* Achievement Badges */}
            {stats.achievements.length > 0 && (
              <AchievementBadges achievements={stats.achievements} />
            )}

            {/* Key Insights Grid */}
            {stats.insights.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {stats.insights.map((insight, idx) => (
                  <InsightCard
                    key={idx}
                    type={insight.type}
                    icon={<BarChart3 className="h-5 w-5" />}
                    headline={insight.headline}
                    description={insight.description}
                    metric={insight.metric}
                    delay={idx * 0.1}
                  />
                ))}
              </div>
            )}

            {/* Match Timeline */}
            <MatchTimeline
              games={allSubMatchGames as any}
              side1Name={team1Name}
              side2Name={team2Name}
              winnerSide={undefined}
            />
          </StatsSectionContainer>

          {/* SECTION 2: PERFORMANCE BREAKDOWN */}
          <StatsSectionContainer
            id="performance"
            title="Performance Analysis"
            description="Detailed breakdown of shots, serves, and gameplay"
            icon={<BarChart3 className="h-6 w-6" />}
            ref={(el) => {
              sectionRefs.current.performance = el;
            }}
          >
            {/* Written Commentary */}
            {stats.commentary.length > 0 && (
              <PerformanceCommentary commentary={stats.commentary} />
            )}

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ServeReceiveChart data={stats.serveData} />
              {stats.serveTypeData && stats.serveTypeData.length > 0 && <ServeTypeChart data={stats.serveTypeData} />}
              <ShotTypeChart data={stats.strokeData} />
            </div>

            {/* SubMatch Progression */}
            {isTeamMatch(match) && (match.subMatches?.length || 0) > 1 && (
              <GameProgressionChart
                data={stats.subMatchProgressionData}
                side1Name={team1Name}
                side2Name={team2Name}
              />
            )}
          </StatsSectionContainer>

          {/* SECTION 3: GAME DETAILS */}
          <StatsSectionContainer
            id="details"
            title="SubMatch Breakdown"
            description="Detailed analysis of each submatch"
            icon={<Target className="h-6 w-6" />}
            ref={(el) => {
              sectionRefs.current.details = el;
            }}
          >
            {isTeamMatch(match) && match.subMatches?.map((subMatch, smIdx) => {
              const smGames = subMatch.games || [];
              const player1 = Array.isArray(subMatch.playerTeam1)
                ? subMatch.playerTeam1
                    .map((p: any) => p?.fullName || p?.username)
                    .join(" & ")
                : (subMatch.playerTeam1 as any)?.fullName ||
                  (subMatch.playerTeam1 as any)?.username ||
                  "TBD";
              const player2 = Array.isArray(subMatch.playerTeam2)
                ? subMatch.playerTeam2
                    .map((p: any) => p?.fullName || p?.username)
                    .join(" & ")
                : (subMatch.playerTeam2 as any)?.fullName ||
                  (subMatch.playerTeam2 as any)?.username ||
                  "TBD";

              return (
                <div
                  key={smIdx}
                  className="border border-[#d9d9d9] p-6 space-y-4 bg-white"
                >
                  <div className="flex flex-col justify-between">
                    <h3 className="flex items-center gap-4 font-semibold text-base text-[#353535]">
                      <span>
                        Match {subMatch.matchNumber}: {player1} vs {player2}
                      </span>
                      <span className="text-[#d9d9d9]">
                        {subMatch.finalScore?.team1Sets || 0} -{" "}
                        {subMatch.finalScore?.team2Sets || 0}
                      </span>
                    </h3>
                    <span className="text-sm text-[#d9d9d9]">
                      {subMatch.winnerSide && (
                        <span className="ml-2 text-[#3c6e71]">
                          (
                          {subMatch.winnerSide === "team1"
                            ? team1Name
                            : team2Name}{" "}
                          won)
                        </span>
                      )}
                    </span>
                  </div>
                  <GameByGameBreakdown
                    games={smGames}
                    side1Name={player1}
                    side2Name={player2}
                    participants={[
                      ...(Array.isArray(subMatch.playerTeam1)
                        ? subMatch.playerTeam1
                        : [subMatch.playerTeam1]),
                      ...(Array.isArray(subMatch.playerTeam2)
                        ? subMatch.playerTeam2
                        : [subMatch.playerTeam2]),
                    ].filter(
                      (p): p is import("@/types/match.type").Participant =>
                        p != null && typeof p === "object" && "username" in p
                    )}
                    finalScore={
                      subMatch.finalScore
                        ? {
                            side1Sets: subMatch.finalScore.team1Sets ?? 0,
                            side2Sets: subMatch.finalScore.team2Sets ?? 0,
                          }
                        : undefined
                    }
                  />
                </div>
              );
            })}

            {/* Per-Player Analysis */}
            <div className="mt-8">
              <PlayerShotAnalysis playerPieData={stats.playerPieData} />
            </div>
          </StatsSectionContainer>

          {/* SECTION 4: SHOT MAPS & WEAKNESSES */}
          <StatsSectionContainer
            id="maps"
            title="Shot Maps & Weakness Analysis"
            description="Visualize shot placement and identify areas for improvement"
            icon={<Map className="h-6 w-6" />}
            ref={(el) => {
              sectionRefs.current.maps = el;
            }}
          >
            {/* Wagon Wheels */}
            <WagonWheelSection
              participants={allParticipants}
              allShots={allShots}
              games={allSubMatchGames}
              hideByGame={allSubMatchGames.length <= 1}
            />

            {/* Weaknesses Section */}
            <div className="mt-8">
              <MatchWeaknessesSection 
                matchId={matchId} 
                category="team" 
                match={match}
                userId={user?._id || null}
              />
            </div>
          </StatsSectionContainer>
        </main>
      </div>
    );
  }

  return null;
}
