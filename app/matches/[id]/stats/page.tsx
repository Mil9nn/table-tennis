"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMatchStore } from "@/hooks/useMatchStore";
import { isIndividualMatch, isTeamMatch } from "@/types/match.type";
import { MatchHeader } from "@/components/match-stats/MatchHeader";
import { MatchScoreSummary } from "@/components/match-stats/MatchScoreSummary";
import { ServeReceiveChart } from "@/components/match-stats/ServeReceiveChart";
import { ShotTypeChart } from "@/components/match-stats/ShotTypeChart";
import { GameProgressionChart } from "@/components/match-stats/GameProgressionChart";
import { GameByGameBreakdown } from "@/components/match-stats/GameByGameBreakdown";
import { PlayerShotAnalysis } from "@/components/match-stats/PlayerShotAnalysis";
import { WagonWheelSection } from "@/components/match-stats/WagonWheelSection";
import {
  computeStats,
  computePlayerStats,
  computeServeStats,
} from "@/lib/match-stats-utils";
import { formatStrokeName } from "@/lib/utils";

export default function MatchStatsPage() {
  const params = useParams();
  const matchId = params.id as string;
  const { match, fetchingMatch, fetchMatch } = useMatchStore();

  useEffect(() => {
    if (!matchId) return;
    const searchParams = new URLSearchParams(window.location.search);
    const category =
      (searchParams.get("category") as "individual" | "team") || "individual";
    fetchMatch(matchId, category);
  }, [matchId, fetchMatch]);

  if (fetchingMatch) {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center gap-2">
        <Loader2 className="animate-spin size-4" />
        <span className="text-sm">Loading stats...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-8 text-center">Match not found</div>
    );
  }

  if (isIndividualMatch(match)) {
    const isSingles = match.matchType === "singles";
    const isDoubles =
      match.matchType === "doubles" || match.matchType === "mixed_doubles";

    const side1Name = isSingles
      ? match.participants?.[0]?.fullName ||
        match.participants?.[0]?.username ||
        "Player 1"
      : isDoubles
      ? "Side 1"
      : "Player 1";

    const side2Name = isSingles
      ? match.participants?.[1]?.fullName || "Player 2"
      : isDoubles
      ? "Side 2"
      : "Player 2";

    const allGames = match.games || [];
    const shots = allGames.flatMap((g) => g.shots || []);
    const allParticipants = match.participants || [];

    const { shotTypes } = computeStats(shots);
    const playerStats = computePlayerStats(shots);
    const serveStats = computeServeStats(allGames, match.matchCategory);

    const serveData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = allParticipants.find((p) => p._id.toString() === playerId);
      return {
        player: player?.fullName || player?.username || "Unknown",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });

    const strokeData = Object.entries(shotTypes).map(([type, value]) => ({
      name: formatStrokeName(type),
      value,
    }));

    const playerPieData = Object.entries(playerStats).map(
      ([playerId, stats]) => ({
        playerId,
        playerName: stats.name,
        data: Object.entries(stats.strokes).map(([stroke, count]) => ({
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

    return (
      <div>
        <MatchHeader
          matchId={matchId}
          matchCategory={match.matchCategory}
          side1Name={side1Name}
          side2Name={side2Name}
        />

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="w-full flex flex-wrap gap-2 p-1">
            <TabsTrigger
              value="overall"
              className="font-semibold sm:text-sm text-xs whitespace-nowrap px-2 py-1"
            >
              Match Summary
            </TabsTrigger>

            <TabsTrigger
              value="games"
              className="font-semibold sm:text-sm text-xs whitespace-nowrap px-2 py-1"
            >
              Game Breakdown
            </TabsTrigger>

            <TabsTrigger
              value="players"
              className="font-semibold sm:text-sm text-xs whitespace-nowrap px-2 py-1"
            >
              Per-player Stats
            </TabsTrigger>

            <TabsTrigger
              value="wagon-wheel"
              className="font-semibold sm:text-sm text-xs whitespace-nowrap px-2 py-1"
            >
              Shot Maps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-3 gap-6 p-6">
              <MatchScoreSummary
                side1Name={side1Name}
                side2Name={side2Name}
                side1Sets={match.finalScore.side1Sets}
                side2Sets={match.finalScore.side2Sets}
                totalPoints={shots.length}
                totalGames={allGames.length}
              />
              <ServeReceiveChart data={serveData} />
              <ShotTypeChart data={strokeData} />
              {allGames.length > 1 && (
                <GameProgressionChart
                  data={gameProgressionData}
                  side1Name={side1Name}
                  side2Name={side2Name}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="games" className="space-y-4 mt-6">
            <GameByGameBreakdown
              games={allGames}
              side1Name={side1Name}
              side2Name={side2Name}
            />
          </TabsContent>

          <TabsContent value="players" className="space-y-6 mt-6">
            <PlayerShotAnalysis playerPieData={playerPieData} />
          </TabsContent>

          <TabsContent value="wagon-wheel" className="space-y-6 mt-6">
            <WagonWheelSection
              participants={allParticipants}
              allShots={shots}
              games={allGames}
              hideByGame={allGames.length <= 1}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (isTeamMatch(match)) {
    const team1Name = match.team1?.name || "Team 1";
    const team2Name = match.team2?.name || "Team 2";

    // Aggregate all games from all subMatches
    const allSubMatchGames = match.subMatches?.flatMap((sm) => sm.games || []) || [];
    const allShots = allSubMatchGames.flatMap((g) => g.shots || []);

    // Get all participants from both teams
    const team1Players = match.team1?.players?.map((p) => p.user) || [];
    const team2Players = match.team2?.players?.map((p) => p.user) || [];
    const allParticipants = [...team1Players, ...team2Players];

    const { shotTypes } = computeStats(allShots);
    const playerStats = computePlayerStats(allShots);
    const serveStats = computeServeStats(allSubMatchGames, match.matchCategory);

    const serveData = Object.entries(serveStats).map(([playerId, s]) => {
      const player = allParticipants.find((p) => p._id?.toString() === playerId);
      return {
        player: player?.fullName || player?.username || "Unknown",
        Serve: s.servePoints,
        Receive: s.receivePoints,
      };
    });

    const strokeData = Object.entries(shotTypes).map(([type, value]) => ({
      name: formatStrokeName(type),
      value,
    }));

    const playerPieData = Object.entries(playerStats).map(
      ([playerId, stats]) => ({
        playerId,
        playerName: stats.name,
        data: Object.entries(stats.strokes).map(([stroke, count]) => ({
          name: formatStrokeName(stroke),
          value: count,
        })),
      })
    );

    // SubMatch progression (how many submatches each team won)
    const subMatchProgressionData = match.subMatches?.map((sm, idx) => ({
      game: `M${idx + 1}`,
      [team1Name]: sm.finalScore?.team1Sets || 0,
      [team2Name]: sm.finalScore?.team2Sets || 0,
    })) || [];

    return (
      <div>
        <MatchHeader
          matchId={matchId}
          matchCategory={match.matchCategory}
          side1Name={team1Name}
          side2Name={team2Name}
        />

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="w-full flex flex-wrap gap-2 p-1">
            <TabsTrigger
              value="overall"
              className="font-semibold sm:text-sm text-xs whitespace-nowrap px-2 py-1"
            >
              Match Summary
            </TabsTrigger>

            <TabsTrigger
              value="submatches"
              className="font-semibold sm:text-sm text-xs whitespace-nowrap px-2 py-1"
            >
              SubMatch Breakdown
            </TabsTrigger>

            <TabsTrigger
              value="players"
              className="font-semibold sm:text-sm text-xs whitespace-nowrap px-2 py-1"
            >
              Per-player Stats
            </TabsTrigger>

            <TabsTrigger
              value="wagon-wheel"
              className="font-semibold sm:text-sm text-xs whitespace-nowrap px-2 py-1"
            >
              Shot Maps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-3 gap-6 p-6">
              <MatchScoreSummary
                side1Name={team1Name}
                side2Name={team2Name}
                side1Sets={match.finalScore.team1Matches}
                side2Sets={match.finalScore.team2Matches}
                totalPoints={allShots.length}
                totalGames={allSubMatchGames.length}
              />
              <ServeReceiveChart data={serveData} />
              <ShotTypeChart data={strokeData} />
              {(match.subMatches?.length || 0) > 1 && (
                <GameProgressionChart
                  data={subMatchProgressionData}
                  side1Name={team1Name}
                  side2Name={team2Name}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="submatches" className="space-y-4 mt-6">
            {match.subMatches?.map((subMatch, smIdx) => {
              const smGames = subMatch.games || [];
              const player1 = Array.isArray(subMatch.playerTeam1)
                ? subMatch.playerTeam1.map((p: any) => p?.fullName || p?.username).join(" & ")
                : (subMatch.playerTeam1 as any)?.fullName ||
                  (subMatch.playerTeam1 as any)?.username ||
                  "TBD";
              const player2 = Array.isArray(subMatch.playerTeam2)
                ? subMatch.playerTeam2.map((p: any) => p?.fullName || p?.username).join(" & ")
                : (subMatch.playerTeam2 as any)?.fullName ||
                  (subMatch.playerTeam2 as any)?.username ||
                  "TBD";

              return (
                <div key={smIdx} className="border rounded-lg p-4 space-y-4">
                  <div className="flex flex-col justify-between">
                    <h3 className="flex items-center gap-4 font-semibold text-sm">
                      <span>Match{subMatch.matchNumber}: {player1} vs {player2}</span>
                      <span>{subMatch.finalScore?.team1Sets || 0} - {subMatch.finalScore?.team2Sets || 0}</span>
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {subMatch.winnerSide && (
                        <span className="ml-2 text-emerald-500">
                          ({subMatch.winnerSide === "team1" ? team1Name : team2Name} won)
                        </span>
                      )}
                    </span>
                  </div>
                  <GameByGameBreakdown
                    games={smGames}
                    side1Name={player1}
                    side2Name={player2}
                  />
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="players" className="space-y-6 mt-6">
            <PlayerShotAnalysis playerPieData={playerPieData} />
          </TabsContent>

          <TabsContent value="wagon-wheel" className="space-y-6 mt-6">
            <WagonWheelSection
              participants={allParticipants}
              allShots={allShots}
              games={allSubMatchGames}
              hideByGame={allSubMatchGames.length <= 1}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}
