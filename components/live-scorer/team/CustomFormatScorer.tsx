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
import { ChevronLeft, ChevronRight, Trophy, Users } from "lucide-react";
import TeamMatchCompletedCard from "../common/TeamMatchCompletedCard";
import InitialServerDialog from "@/components/ServerDialog";
import MatchStatusBadge from "@/components/MatchStatusBadge";
import MatchTypeBadge from "@/components/MatchTypeBadge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface CustomFormatScorerProps {
  match: TeamMatch;
}

export default function CustomFormatScorer({ match }: CustomFormatScorerProps) {
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
    currentServer,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Users className="w-16 h-16 mx-auto text-gray-300" />
          <p className="text-gray-500 font-medium">No active match</p>
          <p className="text-sm text-gray-400">
            Please select a match to continue
          </p>
        </div>
      </div>
    );
  }

  // Get player info for current submatch
  const isDoublesMatch = currentSubMatch.matchType === "doubles";

  const getPlayersForSubmatch = () => {
    const team1Players = Array.isArray(currentSubMatch.playerTeam1)
      ? currentSubMatch.playerTeam1
      : [currentSubMatch.playerTeam1];

    const team2Players = Array.isArray(currentSubMatch.playerTeam2)
      ? currentSubMatch.playerTeam2
      : [currentSubMatch.playerTeam2];

    return {
      player1: team1Players as Participant[],
      player2: team2Players as Participant[],
    };
  };

  const { player1, player2 } = getPlayersForSubmatch();

  const teamMatchPlayers = isDoublesMatch
    ? {
        side1: [
          {
            name: player1[0]?.fullName || player1[0]?.username || "Player 1",
            playerId: player1[0]?._id,
            serverKey: "team1_main" as const,
            profileImage: player1[0]?.profileImage,
          },
          {
            name: player1[1]?.fullName || player1[1]?.username || "Partner 1",
            playerId: player1[1]?._id,
            serverKey: "team1_partner" as const,
            profileImage: player1[1]?.profileImage,
          },
        ],
        side2: [
          {
            name: player2[0]?.fullName || player2[0]?.username || "Player 2",
            playerId: player2[0]?._id,
            serverKey: "team2_main" as const,
            profileImage: player2[0]?.profileImage,
          },
          {
            name: player2[1]?.fullName || player2[1]?.username || "Partner 2",
            playerId: player2[1]?._id,
            serverKey: "team2_partner" as const,
            profileImage: player2[1]?.profileImage,
          },
        ],
      }
    : {
        side1: [
          {
            name:
              player1[0]?.fullName || player1[0]?.username || "Team 1 Player",
            playerId: player1[0]?._id,
            serverKey: "team1" as const,
            profileImage: player1[0]?.profileImage,
          },
        ],
        side2: [
          {
            name:
              player2[0]?.fullName || player2[0]?.username || "Team 2 Player",
            playerId: player2[0]?._id,
            serverKey: "team2" as const,
            profileImage: player2[0]?.profileImage,
          },
        ],
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

    if (!currentGameData) {
      toast.error("No game data found");
      return;
    }

    let lastSide: "team1" | "team2";

    // If shots exist, use them to determine which side scored last (detailed mode)
    if (currentGameData.shots && currentGameData.shots.length > 0) {
      const lastShot = currentGameData.shots[currentGameData.shots.length - 1];
      lastSide = lastShot.side as "team1" | "team2";
    } else {
      // No shots available (simple mode) - determine which side to subtract from
      // Subtract from the side with the higher score, or team1 if scores are equal
      if (team1Score > team2Score) {
        lastSide = "team1";
      } else if (team2Score > team1Score) {
        lastSide = "team2";
      } else {
        // Scores are equal - subtract from team1 as fallback
        lastSide = "team1";
      }
    }

    await subtractPoint(lastSide);
  };

  return (
    <div className="max-w-7xl mx-auto bg-blue-100">
      <Accordion type="single" collapsible defaultValue="">
        <AccordionItem value="custom-format">
          {/* Accordion Expanded Content */}
          <AccordionContent>
            {/* --- MATCH SUMMARY CARD --- */}
            <Card className="border-none rounded-none">
              <CardContent>
                <div className="rounded-2xl border bg-white shadow-sm p-4">
                  <div className="">
                    {/* Team 1 */}
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-medium text-gray-500 tracking-wide">
                        {match.team1.name}
                      </p>
                      <p className="text-xl font-extrabold bg-gradient-to-br from-emerald-500 to-emerald-700 text-transparent bg-clip-text">
                        {match.finalScore.team1Matches}
                      </p>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-medium text-gray-500 tracking-wide">
                        {match.team2.name}
                      </p>
                      <p className="text-xl font-extrabold bg-gradient-to-br from-rose-500 to-rose-700 text-transparent bg-clip-text">
                        {match.finalScore.team2Matches}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>Match Progress</span>
                    <span className="ml-auto">
                      {
                        match.subMatches.filter(
                          (sm) => sm.status === "completed"
                        ).length
                      }{" "}
                      / {match.subMatches.length} completed
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                      style={{
                        width: `${
                          (match.subMatches.filter(
                            (sm) => sm.status === "completed"
                          ).length /
                            match.subMatches.length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* --- SUBMATCH NAVIGATOR CARD - Collapsible --- */}
            <Accordion type="single" collapsible defaultValue="" className="border rounded-md">
              <AccordionItem value="rubber-navigator" className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-sm font-medium">
                      Rubber {currentSubMatchIndex + 1}: {teamMatchPlayers.side1.map((p) => p.name).join(" & ")} vs {teamMatchPlayers.side2.map((p) => p.name).join(" & ")}
                    </CardTitle>
                    <Badge variant="secondary" className="text-sm ml-auto">
                      {currentSubMatchIndex + 1} / {match.subMatches.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="px-4 pb-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToSubMatch(currentSubMatchIndex - 1)}
                    disabled={currentSubMatchIndex === 0}
                    className="shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* SubMatch Buttons */}
                  <div className="flex gap-2 flex-1 p-2">
                    {match.subMatches.map((sm, idx) => {
                      const isActive = idx === currentSubMatchIndex;
                      sm.status === "completed";
                      const matchTypeIcon =
                        sm.matchType === "singles" ? "S" : "D";

                      return (
                        <button
                          key={idx}
                          onClick={() => goToSubMatch(idx)}
                          className={`
                      relative flex-shrink-0 px-4 rounded-xl border-2 font-medium text-sm transition-all duration-200
                      ${
                        isActive
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105"
                          : sm.status === "completed"
                          ? "border-green-300 bg-green-50 text-green-700 hover:shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                        >
                          <div className="flex items-center gap-2">
                            <span>#{idx + 1}</span>
                            <span className="text-xs font-semibold">
                              {matchTypeIcon}
                            </span>
                          </div>

                          {sm.status === "completed" && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                              <span className="text-xs">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToSubMatch(currentSubMatchIndex + 1)}
                    disabled={
                      currentSubMatchIndex === match.subMatches.length - 1
                    }
                    className="shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Current SubMatch Details - Modern Card */}
      <Card className="border-none rounded-none py-0">
        <CardContent className="p-0">
          {currentSubMatch.status === "completed" ? (
            <div className="text-center py-12 space-y-4">
              <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">
                  Rubber Completed!
                </p>
                <p className="text-sm text-gray-600">
                  Winner:{" "}
                  <span className="font-semibold">
                    {currentSubMatch.winnerSide === "team1"
                      ? teamMatchPlayers.side1.map((p) => p.name).join(" & ")
                      : teamMatchPlayers.side2.map((p) => p.name).join(" & ")}
                  </span>
                </p>
                <p className="text-lg font-mono">
                  {currentSubMatch.finalScore?.team1Games || 0} -{" "}
                  {currentSubMatch.finalScore?.team2Games || 0}
                </p>
              </div>
            </div>
          ) : (
            <>
              {match && <TrackingModeToggle />}
              <ScoreBoard
                match={match}
                side1Score={team1Score}
                side2Score={team2Score}
                isMatchActive={isSubMatchActive}
                currentServer={currentServer}
                side1Sets={team1Games}
                side2Sets={team2Games}
                status={currentSubMatch.status as MatchStatus}
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
                teamMatchPlayers={teamMatchPlayers}
              />

              <div className="p-4 space-y-4">
                <GamesHistory
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[...player1, ...player2] as any}
                />

                <ShotFeed
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[...player1, ...player2] as any}
                  serverConfig={currentSubMatch.serverConfig}
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
