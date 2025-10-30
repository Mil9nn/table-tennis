"use client";

import { useEffect, useRef } from "react";
import { TeamMatch, MatchStatus, Participant, PlayerKey } from "@/types/match.type";
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
import MatchStatusBadge from "@/components/MatchStatusBadge";

interface SwaythlingScorerProps {
  match: TeamMatch;
}

export default function SwaythlingScorer({ match }: SwaythlingScorerProps) {
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

  // Get player info for current submatch
  const player1 = currentSubMatch.playerTeam1 as Participant;
  const player2 = currentSubMatch.playerTeam2 as Participant;

  const player1Name = player1?.fullName;
  const player2Name = player2?.fullName;

  const teamMatchPlayers = {
    side1: {
      name: player1Name!,
      playerId: player1?._id,
      serverKey: "team1" as const,
    },
    side2: {
      name: player2Name!,
      playerId: player2?._id,
      serverKey: "team2" as const,
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

  const handleUndo = async () => {
  if (team1Score === 0 && team2Score === 0) {
    toast.error("No points to undo");
    return;
  }

  const currentGameData = currentSubMatch?.games?.find(
    (g: any) => g.gameNumber === currentGame
  );
  
  if (!currentGameData || !currentGameData.shots || currentGameData.shots.length === 0) {
    toast.error("No shots to undo");
    return;
  }

  const lastShot = currentGameData.shots[currentGameData.shots.length - 1];
  const lastSide = lastShot.side as PlayerKey;

  await subtractPoint(lastSide);
};

  return (
    <div className="max-w-6xl mx-auto space-y-2">
      {/* Team Match Score Overview */}
      <Card className="shadow-none rounded-none">
        <CardHeader>
          <CardTitle>Swaythling Format</CardTitle>
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
          <CardTitle>Individual Matches</CardTitle>
          <Badge variant="outline">
            Match {currentSubMatchIndex + 1} of {match.subMatches.length}
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
                  <span className="hidden sm:inline">Match</span>
                  <span className="inline sm:hidden">M</span>
                  {idx + 1}
                  {isCompleted && sm.winnerSide && (
                    <span className="ml-2">
                      {sm.winnerSide === "team1" ? "✓" : "✓"}
                    </span>
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
              <span>Match {currentSubMatchIndex + 1}:</span>
              <MatchStatusBadge status={currentSubMatch.status as MatchStatus} size="sm" showIcon={false} />
            </CardTitle>
            <p className="text-xs font-semibold">
              {player1Name} vs {player2Name}
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
                  ? player1Name
                  : player2Name}
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
                currentServer={currentSubMatch.currentServer!}
                side1Sets={team1Sets}
                side2Sets={team2Sets}
                status={currentSubMatch.status}
                onAddPoint={({ side, playerId }) => {
                  if (!isSubMatchActive) {
                    toast.error("Start the match first");
                    return;
                  }
                  setPendingPlayer({ side, playerId });
                  setShotDialogOpen(true);
                }}
                onUndo={handleUndo}
                onReset={() => toast.info("Reset not yet implemented")}
                onToggleMatch={() => {
                  if (
                    !isSubMatchActive &&
                    !currentSubMatch.serverConfig?.firstServer
                  ) {
                    setServerDialogOpen(true);
                  } else {
                    toggleSubMatch();
                  }
                }}
                teamMatchPlayers={{
                  side1: Array.isArray(teamMatchPlayers.side1)
                    ? teamMatchPlayers.side1
                    : [teamMatchPlayers.side1],
                  side2: Array.isArray(teamMatchPlayers.side2)
                    ? teamMatchPlayers.side2
                    : [teamMatchPlayers.side2],
                }}
              />

              <div className="mt-6">
                <GamesHistory
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[player1, player2] as any}
                />
              </div>

              <div className="mt-6">
                <ShotFeed
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[player1, player2] as any}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isCompleted && <TeamMatchCompletedCard match={match} />}

      {/* Shot Selector Dialog */}
      {!isCompleted && <ShotSelector />}

      {!isCompleted && (
        <>
          <ShotSelector />
          <InitialServerDialog
            matchType="singles"
            participants={[player1, player2] as any}
            isTeamMatch={true}
            subMatchId={currentSubMatch._id?.toString()}
          />
        </>
      )}
    </div>
  );
}
