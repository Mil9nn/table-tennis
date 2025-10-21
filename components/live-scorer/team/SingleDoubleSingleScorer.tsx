"use client";

import { useEffect, useRef } from "react";
import { TeamMatch, MatchStatus, Participant } from "@/types/match.type";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
import ScoreBoard from "../common/ScoreBoard";
import GamesHistory from "../common/GamesHistory";
import ShotFeed from "../common/ShotFeed";
import ShotSelector from "@/components/ShotSelector";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TeamMatchCompletedCard from "../common/TeamMatchCompletedCard";
import InitialServerDialog from "@/components/ServerDialog";

interface SingleDoubleSingleScorerProps {
  match: TeamMatch;
}

export default function SingleDoubleSingleScorer({ match }: SingleDoubleSingleScorerProps) {
  const {
    currentSubMatchIndex,
    currentSubMatch,
    team1Score,
    team2Score,
    team1Sets,
    team2Sets,
    currentGame,
    isSubMatchActive,
    status,
    setInitialTeamMatch,
    subtractPoint,
    toggleSubMatch,
  } = useTeamMatch();

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);
  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);

  const lastMatchId = useRef<string | null>(null);
  const lastSubMatchIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!match) return;

    const matchChanged = lastMatchId.current !== match._id;
    const subMatchChanged = lastSubMatchIndex.current !== currentSubMatchIndex;

    if (matchChanged || subMatchChanged) {
      setInitialTeamMatch(match);
      lastMatchId.current = match._id;
      lastSubMatchIndex.current = currentSubMatchIndex;
    }
  }, [match, currentSubMatchIndex, setInitialTeamMatch]);

  if (!match || !currentSubMatch) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No active submatch</p>
      </div>
    );
  }

  // Determine if current submatch is doubles (match 2 in the sequence)
  const isDoublesMatch = currentSubMatch.matchNumber === 2;
  
  // Get players for current submatch
  const getPlayersForSubmatch = () => {
    if (isDoublesMatch) {
      // Doubles match - 2 players per team
      const team1Players = match.team1.players.slice(0, 2);
      const team2Players = match.team2.players.slice(0, 2);
      
      return {
        player1: team1Players.map(p => p.user as Participant),
        player2: team2Players.map(p => p.user as Participant),
      };
    } else {
      // Singles match
      const player1 = currentSubMatch.playerTeam1 as Participant;
      const player2 = currentSubMatch.playerTeam2 as Participant;
      
      return {
        player1: [player1],
        player2: [player2],
      };
    }
  };

  const { player1, player2 } = getPlayersForSubmatch();

  const teamMatchPlayers = {
    side1: {
      name: player1.map(p => p?.fullName || p?.username || "Player").join(" & "),
      playerId: player1[0]?._id,
      serverKey: "side1" as const,
    },
    side2: {
      name: player2.map(p => p?.fullName || p?.username || "Player").join(" & "),
      playerId: player2[0]?._id,
      serverKey: "side2" as const,
    },
  };

  const goToSubMatch = (index: number) => {
    if (index < 0 || index >= match.subMatches.length) return;
    useMatchStore.getState().setMatch({
      ...match,
      currentSubMatch: index + 1,
    });
    setInitialTeamMatch({
      ...match,
      currentSubMatch: index + 1,
    });
  };

  const isCompleted = status === "completed";

  // Format labels for submatches
  const getSubMatchLabel = (index: number) => {
    if (index === 0) return "Singles 1";
    if (index === 1) return "Doubles";
    if (index === 2) return "Singles 2";
    return `Match ${index + 1}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-2">
      {/* Team Match Score Overview */}
      <Card className="shadow-none rounded-none">
        <CardHeader>
          <CardTitle>Single-Double-Single Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">{match.team1.name}</p>
              <p className="text-4xl font-bold text-emerald-600">
                {match.finalScore.team1Matches}
              </p>
            </div>
            <div className="text-2xl text-gray-400">-</div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">{match.team2.name}</p>
              <p className="text-4xl font-bold text-rose-600">
                {match.finalScore.team2Matches}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SubMatch Navigator */}
      <Card className="rounded-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Match Sequence</CardTitle>
          <Badge variant="outline">
            {getSubMatchLabel(currentSubMatchIndex)}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToSubMatch(currentSubMatchIndex - 1)}
              disabled={currentSubMatchIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {match.subMatches.map((sm, idx) => {
              const isActive = idx === currentSubMatchIndex;
              const isCompleted = sm.status === "completed";

              return (
                <button
                  key={idx}
                  onClick={() => goToSubMatch(idx)}
                  className={`
                    px-4 py-2 rounded-lg border-2 whitespace-nowrap text-sm font-medium transition-all
                    ${
                      isActive
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : isCompleted
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  {getSubMatchLabel(idx)}
                  {isCompleted && sm.winnerSide && (
                    <span className="ml-2">✓</span>
                  )}
                </button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToSubMatch(currentSubMatchIndex + 1)}
              disabled={currentSubMatchIndex === match.subMatches.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current SubMatch Details */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="w-full flex items-center justify-between gap-2">
              <span>{getSubMatchLabel(currentSubMatchIndex)}</span>
              <Badge className="rounded-full">
                {currentSubMatch.status === "completed"
                  ? "Completed"
                  : currentSubMatch.status === "in_progress"
                  ? "In Progress"
                  : "Scheduled"}
              </Badge>
            </CardTitle>
            <p className="text-xs font-semibold">
              {teamMatchPlayers.side1.name} vs {teamMatchPlayers.side2.name}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {currentSubMatch.status === "completed" ? (
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-green-600">
                Match Completed!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Winner:{" "}
                {currentSubMatch.winnerSide === "team1"
                  ? teamMatchPlayers.side1.name
                  : teamMatchPlayers.side2.name}
              </p>
              <p className="text-sm text-gray-500">
                Score: {currentSubMatch.finalScore?.team1Sets || 0} -{" "}
                {currentSubMatch.finalScore?.team2Sets || 0}
              </p>
            </div>
          ) : (
            <>
              <ScoreBoard
                match={match}
                side1Score={team1Score}
                side2Score={team2Score}
                isMatchActive={isSubMatchActive}
                currentServer={null}
                side1Sets={team1Sets}
                side2Sets={team2Sets}
                status={currentSubMatch.status as MatchStatus}
                onAddPoint={({ side, playerId }) => {
                  if (!isSubMatchActive) {
                    toast.error("Start the match first");
                    return;
                  }
                  setPendingPlayer({ side, playerId });
                  setShotDialogOpen(true);
                }}
                onSubtractPoint={subtractPoint}
                onReset={() => toast.info("Reset not yet implemented")}
                onToggleMatch={() => {
                  // Show server dialog if starting and no server config
                  if (!isSubMatchActive && !currentSubMatch.serverConfig?.firstServer) {
                    setServerDialogOpen(true);
                  } else {
                    toggleSubMatch();
                  }
                }}
                teamMatchPlayers={teamMatchPlayers}
              />

              <div className="mt-6">
                <GamesHistory
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[...player1, ...player2] as any}
                />
              </div>

              <div className="mt-6">
                <ShotFeed
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[...player1, ...player2] as any}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isCompleted && <TeamMatchCompletedCard match={match} />}

      {!isCompleted && (
        <>
          <ShotSelector />
          <InitialServerDialog 
            matchType={isDoublesMatch ? "doubles" : "singles"} 
            participants={[...player1, ...player2] as any}
            isTeamMatch={true}
            subMatchId={currentSubMatch._id?.toString()}
          />
        </>
      )}
    </div>
  );
}