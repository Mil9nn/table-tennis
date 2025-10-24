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
import { ChevronLeft, ChevronRight, Trophy, Users } from "lucide-react";
import TeamMatchCompletedCard from "../common/TeamMatchCompletedCard";
import InitialServerDialog from "@/components/ServerDialog";

interface CustomFormatScorerProps {
  match: TeamMatch;
}

export default function CustomFormatScorer({ match }: CustomFormatScorerProps) {
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
    currentServer,
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
        side1: {
          name: player1
            .map((p) => p?.fullName || p?.username || "Player")
            .join(" & "),
          playerId: player1[0]?._id,
          serverKey: "team1_main" as const,
        },
        side2: {
          name: player2
            .map((p) => p?.fullName || p?.username || "Player")
            .join(" & "),
          playerId: player2[0]?._id,
          serverKey: "team2_main" as const,
        },
      }
    : {
        side1: {
          name: player1[0]?.fullName || player1[0]?.username || "Team 1 Player",
          playerId: player1[0]?._id,
          serverKey: "team1" as const,
        },
        side2: {
          name: player2[0]?.fullName || player2[0]?.username || "Team 2 Player",
          playerId: player2[0]?._id,
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

  const getMatchTypeLabel = (type: string) => {
    return type === "singles" ? "Singles" : "Doubles";
  };

  const getMatchTypeBadge = (type: string) => {
    return type === "singles" ? (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        Singles
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-200"
      >
        Doubles
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4">
      {/* Team Match Score Overview - Modern Card */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Custom Format Match
            </CardTitle>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {match.subMatches.length} Matches
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-8 items-center">
            {/* Team 1 */}
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-600">
                {match.team1.name}
              </p>
              <p className="text-5xl font-bold text-emerald-600">
                {match.finalScore.team1Matches}
              </p>
              <p className="text-xs text-gray-500">Matches Won</p>
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-full border-t-2 border-dashed border-gray-300"></div>
              <span className="text-sm font-semibold text-gray-400 bg-white px-3 py-1 rounded-full border">
                VS
              </span>
              <div className="w-full border-t-2 border-dashed border-gray-300"></div>
            </div>

            {/* Team 2 */}
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-600">
                {match.team2.name}
              </p>
              <p className="text-5xl font-bold text-rose-600">
                {match.finalScore.team2Matches}
              </p>
              <p className="text-xs text-gray-500">Matches Won</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>Match Progress</span>
              <span className="ml-auto">
                {
                  match.subMatches.filter((sm) => sm.status === "completed")
                    .length
                }{" "}
                / {match.subMatches.length} completed
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                style={{
                  width: `${
                    (match.subMatches.filter((sm) => sm.status === "completed")
                      .length /
                      match.subMatches.length) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SubMatch Navigator - Modern Design */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Match Sequence
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              Match {currentSubMatchIndex + 1} of {match.subMatches.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToSubMatch(currentSubMatchIndex - 1)}
              disabled={currentSubMatchIndex === 0}
              className="shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex gap-2 flex-1">
              {match.subMatches.map((sm, idx) => {
                const isActive = idx === currentSubMatchIndex;
                const isCompleted = sm.status === "completed";
                const matchTypeIcon = sm.matchType === "singles" ? "S" : "D";

                return (
                  <button
                    key={idx}
                    onClick={() => goToSubMatch(idx)}
                    className={`
                      relative flex-shrink-0 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-200
                      ${
                        isActive
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105"
                          : isCompleted
                          ? "border-green-300 bg-green-50 text-green-700 hover:shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold">
                        {matchTypeIcon}
                      </span>
                      <span>#{idx + 1}</span>
                    </div>
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToSubMatch(currentSubMatchIndex + 1)}
              disabled={currentSubMatchIndex === match.subMatches.length - 1}
              className="shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current SubMatch Details - Modern Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getMatchTypeBadge(currentSubMatch.matchType)}
                <span className="text-lg font-bold">
                  Match {currentSubMatchIndex + 1}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">
                  {teamMatchPlayers.side1.name}
                </span>
                <span className="mx-2 text-gray-400">vs</span>
                <span className="font-medium">
                  {teamMatchPlayers.side2.name}
                </span>
              </p>
            </div>
            <Badge
              className={`self-start sm:self-center px-4 py-1 ${
                currentSubMatch.status === "completed"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : currentSubMatch.status === "in_progress"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {currentSubMatch.status === "completed"
                ? "Completed"
                : currentSubMatch.status === "in_progress"
                ? "In Progress"
                : "Scheduled"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {currentSubMatch.status === "completed" ? (
            <div className="text-center py-12 space-y-4">
              <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">
                  Match Completed!
                </p>
                <p className="text-sm text-gray-600">
                  Winner:{" "}
                  <span className="font-semibold">
                    {currentSubMatch.winnerSide === "team1"
                      ? teamMatchPlayers.side1.name
                      : teamMatchPlayers.side2.name}
                  </span>
                </p>
                <p className="text-lg font-mono">
                  {currentSubMatch.finalScore?.team1Sets || 0} -{" "}
                  {currentSubMatch.finalScore?.team2Sets || 0}
                </p>
              </div>
            </div>
          ) : (
            <>
              <ScoreBoard
                match={match}
                side1Score={team1Score}
                side2Score={team2Score}
                isMatchActive={isSubMatchActive}
                currentServer={currentServer}
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
                  if (
                    !isSubMatchActive &&
                    !currentSubMatch.serverConfig?.firstServer
                  ) {
                    setServerDialogOpen(true);
                  } else {
                    toggleSubMatch();
                  }
                }}
                teamMatchPlayers={teamMatchPlayers}
              />

              <div className="p-4 space-y-4">
                <GamesHistory
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[player1, player2] as any}
                />

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
