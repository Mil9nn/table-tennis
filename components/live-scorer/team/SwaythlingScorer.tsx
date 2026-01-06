"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  TeamMatch,
  MatchStatus,
  Participant,
  PlayerKey,
} from "@/types/match.type";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import TrackingModeToggle from "../common/TrackingModeToggle";
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
    team1Games,
    team2Games,
    currentGame,
    isSubMatchActive,
    status,
    setInitialTeamMatch,
    subtractPoint,
    toggleSubMatch,
    swapSides,
  } = useTeamMatch();

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);
  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);
  const shotTrackingMode = useMatchStore((s) => s.shotTrackingMode);
  const user = useAuthStore((s) => s.user);
  const updateSubMatchScore = useTeamMatch((s) => s.updateSubMatchScore);

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

  // Auto-open server dialog if no server config exists for current submatch
  useEffect(() => {
    if (
      currentSubMatch &&
      currentSubMatch.status !== "completed" &&
      !currentSubMatch.serverConfig?.firstServer
    ) {
      setServerDialogOpen(true);
    }
  }, [currentSubMatch, setServerDialogOpen]);

  if (!match || !currentSubMatch) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No active submatch</p>
      </div>
    );
  }

  // Get player info for current submatch
  // Note: playerTeam1/playerTeam2 can be either a single player or array of players
  const player1Raw = currentSubMatch.playerTeam1;
  const player2Raw = currentSubMatch.playerTeam2;

  const player1 = (
    Array.isArray(player1Raw) ? player1Raw[0] : player1Raw
  ) as Participant | null;
  const player2 = (
    Array.isArray(player2Raw) ? player2Raw[0] : player2Raw
  ) as Participant | null;

  const player1Name = player1?.fullName || player1?.username || "TBD";
  const player2Name = player2?.fullName || player2?.username || "TBD";

  // Check if players are assigned (not TBD)
  const hasValidPlayers = player1?._id && player2?._id;

  const teamMatchPlayers = {
    side1: {
      name: player1Name,
      playerId: player1?._id || "",
      serverKey: "team1" as const,
      profileImage: player1?.profileImage,
    },
    side2: {
      name: player2Name,
      playerId: player2?._id || "",
      serverKey: "team2" as const,
      profileImage: player2?.profileImage,
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

  // Show warning if players are not assigned for this submatch
  if (!hasValidPlayers && !isCompleted) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Players Not Assigned</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Rubber {currentSubMatchIndex + 1}: {player1Name} vs {player2Name}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Players need to be assigned to positions before this match can be
              scored. Please ensure both teams have configured their player
              assignments (A, B, C positions).
            </p>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => goToSubMatch(currentSubMatchIndex - 1)}
                disabled={currentSubMatchIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => goToSubMatch(currentSubMatchIndex + 1)}
                disabled={currentSubMatchIndex >= match.subMatches.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function IconNavButton({ children, ...props }: any) {
    return (
      <button
        {...props}
        className="h-7 w-7 flex items-center justify-center rounded-md border
                   hover:bg-muted disabled:opacity-40 transition"
      >
        {children}
      </button>
    );
  }

  const handleUndo = async () => {
    if (team1Score === 0 && team2Score === 0) {
      toast.error("No points to undo");
      return;
    }

    const currentGameData = currentSubMatch?.games?.find(
      (g: any) => g.gameNumber === currentGame
    );

    if (
      !currentGameData ||
      !currentGameData.shots ||
      currentGameData.shots.length === 0
    ) {
      toast.error("No shots to undo");
      return;
    }

    const lastShot = currentGameData.shots[currentGameData.shots.length - 1];
    const lastSide = lastShot.side as "team1" | "team2";

    await subtractPoint(lastSide);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-2">
      {/* Team Match Score Overview */}
      <Card className="border rounded-md shadow-none">
        <CardContent className="px-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left Team */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium text-muted-foreground truncate">
                {match.team1.name}
              </span>
              <span className="text-xl font-semibold text-emerald-600 tabular-nums">
                {match.finalScore.team1Matches}
              </span>
            </div>

            {/* Divider */}
            <span className="text-sm text-muted-foreground select-none">—</span>

            {/* Right Team */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl font-semibold text-rose-600 tabular-nums">
                {match.finalScore.team2Matches}
              </span>
              <span className="text-sm font-medium text-muted-foreground truncate">
                {match.team2.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SubMatch Navigator */}
      <Card className="border rounded-md shadow-none">
        <div className="flex items-center justify-between px-4">
          {/* Left: Label */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Rubbers
            </h3>
            <Badge variant="secondary" className="h-5 px-2 text-[11px]">
              {currentSubMatchIndex + 1} / {match.subMatches.length}
            </Badge>
          </div>

          {/* Right: Navigator */}
          <div className="flex items-center gap-1">
            <IconNavButton
              disabled={currentSubMatchIndex === 0}
              onClick={() => goToSubMatch(currentSubMatchIndex - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </IconNavButton>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw]">
              {match.subMatches.map((sm, idx) => {
                const isActive = idx === currentSubMatchIndex;
                const isCompleted = sm.status === "completed";

                return (
                  <button
                    key={idx}
                    onClick={() => goToSubMatch(idx)}
                    className={`
                h-7 min-w-[32px] px-2 rounded-md border text-xs font-medium transition
                ${isActive && "border-primary bg-primary/10 text-primary"}
                ${
                  isCompleted &&
                  !isActive &&
                  "border-emerald-200 bg-emerald-50 text-emerald-700"
                }
                ${
                  !isActive &&
                  !isCompleted &&
                  "border-muted hover:border-foreground/20"
                }
              `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <IconNavButton
              disabled={currentSubMatchIndex === match.subMatches.length - 1}
              onClick={() => goToSubMatch(currentSubMatchIndex + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </IconNavButton>
          </div>
        </div>
      </Card>

      {/* Current SubMatch Details */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="w-full flex items-center justify-between gap-2">
              <span>Rubber {currentSubMatchIndex + 1}:</span>
              <MatchStatusBadge
                status={currentSubMatch.status as MatchStatus}
              />
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
                Rubber Completed!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Winner:{" "}
                {currentSubMatch.winnerSide === "team1"
                  ? player1Name
                  : player2Name}
              </p>
              <p className="text-sm text-gray-500">
                Score: {currentSubMatch.finalScore?.team1Games || 0} -{" "}
                {currentSubMatch.finalScore?.team2Games || 0}
              </p>
            </div>
          ) : (
            <>
              {match && <TrackingModeToggle />}
              <ScoreBoard
                match={match}
                side1Score={team1Score}
                side2Score={team2Score}
                isMatchActive={isSubMatchActive}
                currentServer={currentSubMatch.currentServer!}
                side1Sets={team1Games}
                side2Sets={team2Games}
                status={currentSubMatch.status}
                onAddPoint={async ({ side, playerId }) => {
                  if (currentSubMatch.status === "completed") {
                    toast.error("Submatch is completed!");
                    return;
                  }

                  // Convert side1/side2 to team1/team2 for team matches
                  const teamSide = side === "side1" ? "team1" : "team2";

                  // Determine effective mode: match override > user preference > default "detailed"
                  const effectiveMode =
                    shotTrackingMode || user?.shotTrackingMode || "detailed";

                  if (effectiveMode === "simple") {
                    // Simple mode: directly increment score without shot data
                    await updateSubMatchScore(teamSide, 1, undefined, playerId);
                  } else {
                    // Detailed mode: open shot selector dialog
                    setPendingPlayer({ side: teamSide, playerId });
                    setShotDialogOpen(true);
                  }
                }}
                onUndo={handleUndo}
                onReset={() => toast.info("Reset not yet implemented")}
                onToggleMatch={toggleSubMatch}
                onSwap={swapSides}
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
