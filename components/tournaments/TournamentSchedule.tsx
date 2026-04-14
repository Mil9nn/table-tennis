"use client";

import React from "react";
import type { FC } from "react";
import type { Round } from "@/types/tournament.type";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users } from "lucide-react";
import { getAvatarFallbackStyle } from "@/lib/utils";

interface Participant {
  _id: string;
  username?: string;
  fullName?: string;
  profileImage?: string;
  name?: string; // For teams
  logo?: string; // For teams
}

interface TeamInfo {
  _id?: string;
  name: string;
  logo?: string;
  captain?: any;
  players?: any[];
}

interface IndividualMatch {
  _id: string;
  matchCategory?: "individual";
  matchType?: "singles" | "doubles";
  participants: Participant[];
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  finalScore?: {
    side1Sets?: number;
    side2Sets?: number;
    setsById?: Record<string, number>;
    setsByPlayerId?: Record<string, number>;
    sets?: Record<string, number>;
  };
  games?: Array<{
    winnerId?: string;
    winnerPlayerId?: string;
    winner?: string;
    winnerSide?: "side1" | "side2";
    side1Score?: number;
    side2Score?: number;
    scoresById?: Record<string, number>;
    scoresByPlayerId?: Record<string, number>;
    scores?: Record<string, number>;
  }>;
  winnerId?: string;
  winnerPlayerId?: string;
  winner?: string;
  winnerSide?: "side1" | "side2";
  date?: string;
  time?: string;
}

interface TeamMatch {
  _id: string;
  matchCategory: "team";
  team1: TeamInfo;
  team2: TeamInfo;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  finalScore?: { team1Matches: number; team2Matches: number };
  winnerTeam?: "team1" | "team2";
  date?: string;
  time?: string;
}

type Match = IndividualMatch | TeamMatch;

interface TournamentScheduleProps {
  rounds: (Round & {
    groupName?: string;
    groupId?: string;
    roundName?: string;
  })[];
  matches: Match[];
  onMatchClick?: (id: string) => void;
  showDate?: boolean;
  showTime?: boolean;
  venue?: string;
  format?: "round_robin" | "knockout";
  isTeamTournament?: boolean;
}

const TournamentSchedule: FC<TournamentScheduleProps> = ({
  rounds,
  matches,
  onMatchClick,
  showDate = true,
  showTime = true,
  format = "round_robin",
  isTeamTournament = false,
}) => {
  const getMatchById = (id: string) =>
    matches.find((m) => String(m._id) === String(id)) ?? null;

  const isTeamMatch = (match: Match): match is TeamMatch => {
    return (
      (match as TeamMatch).team1 !== undefined &&
      (match as TeamMatch).team2 !== undefined
    );
  };

  const initials = (p?: Participant | TeamInfo) => {
    if (!p) return "?";
    const displayName =
      (p as TeamInfo).name ||
      (p as Participant).fullName ||
      (p as Participant).username ||
      "?";
    return displayName
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getDisplayName = (p?: Participant | TeamInfo) => {
    if (!p) return "?";
    return (
      (p as TeamInfo).name ||
      (p as Participant).fullName ||
      (p as Participant).username ||
      "?"
    );
  };

  const getImage = (p?: Participant | TeamInfo) => {
    if (!p) return undefined;
    return (p as TeamInfo).logo || (p as Participant).profileImage;
  };

  const isWinner = (match: Match, index: number) => {
    if (match.status !== "completed") return false;

    if (isTeamMatch(match)) {
      if (!match.winnerTeam) return false;
      return (
        (match.winnerTeam === "team1" && index === 0) ||
        (match.winnerTeam === "team2" && index === 1)
      );
    } else {
      const winnerId = String(
        (match as IndividualMatch).winnerId ||
          (match as IndividualMatch).winnerPlayerId ||
          (match as IndividualMatch).winner ||
          ""
      );
      if (winnerId) {
        if (isDoubles(match as IndividualMatch)) {
          const ids = index === 0
            ? [(match as IndividualMatch).participants?.[0]?._id, (match as IndividualMatch).participants?.[1]?._id]
            : [(match as IndividualMatch).participants?.[2]?._id, (match as IndividualMatch).participants?.[3]?._id];
          return ids.filter(Boolean).map(String).includes(winnerId);
        }
        const id = index === 0
          ? (match as IndividualMatch).participants?.[0]?._id
          : (match as IndividualMatch).participants?.[1]?._id;
        return String(id || "") === winnerId;
      }
      if (!(match as IndividualMatch).winnerSide) return false;
      return (
        ((match as IndividualMatch).winnerSide === "side1" && index === 0) ||
        ((match as IndividualMatch).winnerSide === "side2" && index === 1)
      );
    }
  };

  const getMatchScore = (match: Match) => {
    if (match.status !== "completed") return null;

    if (isTeamMatch(match) && match.finalScore) {
      return `${match.finalScore.team1Matches}-${match.finalScore.team2Matches}`;
    } else if (!isTeamMatch(match) && match.finalScore) {
      const byId =
        match.finalScore.setsById ||
        match.finalScore.setsByPlayerId ||
        match.finalScore.sets ||
        {};

      const side1Ids = isDoubles(match)
        ? [match.participants?.[0]?._id, match.participants?.[1]?._id]
        : [match.participants?.[0]?._id];
      const side2Ids = isDoubles(match)
        ? [match.participants?.[2]?._id, match.participants?.[3]?._id]
        : [match.participants?.[1]?._id];

      const readSideScore = (ids: Array<string | undefined>, fallback: number) => {
        const values = ids
          .map((id) => (id ? byId[String(id)] : undefined))
          .filter((value): value is number => value !== undefined && value !== null)
          .map((value) => Number(value));

        if (values.length === 0) return fallback;
        return Math.max(...values);
      };

      const s1 = readSideScore(side1Ids, Number(match.finalScore.side1Sets ?? 0));
      const s2 = readSideScore(side2Ids, Number(match.finalScore.side2Sets ?? 0));

      // Fallback for stale embedded tournament matches where finalScore is not synced
      if (s1 === 0 && s2 === 0 && Array.isArray(match.games) && match.games.length > 0) {
        let side1SetsFromGames = 0;
        let side2SetsFromGames = 0;

        for (const game of match.games) {
          const winnerId = String(game.winnerId || game.winnerPlayerId || game.winner || "");
          if (winnerId) {
            const side1Won = side1Ids.filter(Boolean).map(String).includes(winnerId);
            const side2Won = side2Ids.filter(Boolean).map(String).includes(winnerId);
            if (side1Won) side1SetsFromGames += 1;
            if (side2Won) side2SetsFromGames += 1;
            continue;
          }

          if (game.winnerSide === "side1") {
            side1SetsFromGames += 1;
            continue;
          }
          if (game.winnerSide === "side2") {
            side2SetsFromGames += 1;
          }
        }

        if (side1SetsFromGames > 0 || side2SetsFromGames > 0) {
          return `${side1SetsFromGames}-${side2SetsFromGames}`;
        }
      }

      return `${s1}-${s2}`;
    }
    return null;
  };

  const getMatchType = (
    match: Match
  ): "singles" | "doubles" => {
    if (isTeamMatch(match)) return "singles";
    const indMatch = match as IndividualMatch;
    return indMatch.matchType || "singles";
  };

  const isDoubles = (match: Match): boolean => {
    const type = getMatchType(match);
    return type === "doubles";
  };

  const getParticipant1 = (
    match: Match
  ): Participant | TeamInfo | undefined => {
    if (isTeamMatch(match)) {
      return match.team1;
    }
    return match.participants?.[0];
  };

  const getParticipant2 = (
    match: Match
  ): Participant | TeamInfo | undefined => {
    if (isTeamMatch(match)) {
      return match.team2;
    }
    // For doubles: participants[0,1] are team 1, participants[2,3] are team 2
    if (isDoubles(match)) {
      return match.participants?.[2];
    }
    return match.participants?.[1];
  };

  return (
    <div className="">
      {rounds.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-sm border border-white/10">
          <CardContent className="p-8 text-center text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto opacity-40" />
            <p className="mt-3 text-sm font-medium">No schedule available</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Create a draw to populate matches
            </p>
          </CardContent>
        </Card>
      ) : (
        rounds.map((round, index) => {
          const roundMatches = (round.matches || [])
            .map(getMatchById)
            .filter(Boolean) as Match[];

          // Check if this is the first round of a new group
          const isNewGroup =
            round.groupName &&
            (index === 0 || rounds[index - 1].groupName !== round.groupName);

          return (
            <section
              key={`${round.groupId || "main"}-${round.roundNumber}`}
              className=""
            >
              

              {/* Round Header */}
              <div className="">
                <h2 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  {format === "knockout" && round.roundName ? (
                    <>{round.roundName}</>
                  ) : round.groupName ? (
                    <>
                      {round.groupName} - Round {round.roundNumber}
                    </>
                  ) : (
                    <>Round {round.roundNumber}</>
                  )}
                  {roundMatches.some((m) => m.status === "in_progress") && (
                    <Badge className="text-xs bg-red-500 text-white animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </h2>
              </div>

              {/* Matches Under Round */}
              <div className="">
                {roundMatches.length === 0 ? (
                  <div className="rounded-lg border p-4 bg-white/60 backdrop-blur-sm text-center text-sm text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto opacity-40" />
                    <div className="mt-2">No matches scheduled</div>
                  </div>
                ) : (
                  roundMatches.map((match) => {
                    const participant1 = getParticipant1(match);
                    const participant2 = getParticipant2(match);
                    const score = getMatchScore(match);
                    const matchIsDoubles = isDoubles(match);
                    const indMatch = match as IndividualMatch;

                    return (
                      <div
                        key={match._id}
                        onClick={() => onMatchClick?.(match._id)}
                        className="
                        flex items-center justify-between p-2.5
                        border-b border-black/5 cursor-pointer 
                        transition hover:bg-neutral-50
                      "
                      >
                        {/* LEFT SIDE — players/teams */}
                        <div
                          className={`flex flex-1 ${
                            matchIsDoubles
                              ? "flex-col gap-1"
                              : "items-center gap-2"
                          }`}
                        >
                          {matchIsDoubles ? (
                            // Doubles: show 2 players for side1
                            <>
                              {[0, 1].map((idx) => {
                                const p = indMatch.participants?.[idx];
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5"
                                  >
                                    <Avatar className="h-6 w-6 shrink-0">
                                      {getImage(p) ? (
                                        <AvatarImage src={getImage(p)} />
                                      ) : (
                                        <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(p?._id)}>
                                          {initials(p)}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div
                                      className={`text-xs ${
                                        isWinner(match, 0)
                                          ? "text-green-500"
                                          : "text-neutral-700"
                                      }`}
                                    >
                                      {getDisplayName(p)}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            // Singles: show single player
                            <>
                              <Avatar className="h-6 w-6 shrink-0">
                                {getImage(participant1) ? (
                                  <AvatarImage src={getImage(participant1)} />
                                ) : (
                                  <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(participant1?._id)}>
                                    {initials(participant1)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div
                                className={`text-xs ${
                                  isWinner(match, 0)
                                    ? "text-green-500"
                                    : "text-neutral-700"
                                }`}
                              >
                                {getDisplayName(participant1)}
                              </div>
                            </>
                          )}
                        </div>

                        {/* VS */}
                        <div className="text-[11px] text-muted-foreground font-semibold px-1">
                          vs
                        </div>

                        {/* RIGHT SIDE — players/teams */}
                        <div
                          className={`flex flex-1 ${
                            matchIsDoubles
                              ? "flex-col gap-1"
                              : "items-center gap-2"
                          }`}
                        >
                          {matchIsDoubles ? (
                            // Doubles: show 2 players for side2
                            <>
                              {[2, 3].map((idx) => {
                                const p = indMatch.participants?.[idx];
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5"
                                  >
                                    <Avatar className="h-6 w-6 shrink-0">
                                      {getImage(p) ? (
                                        <AvatarImage src={getImage(p)} />
                                      ) : (
                                        <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(p?._id)}>
                                          {initials(p)}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div
                                      className={`text-xs ${
                                        isWinner(match, 1)
                                          ? "text-green-600"
                                          : "text-neutral-700"
                                      }`}
                                    >
                                      {getDisplayName(p)}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            // Singles: show single player
                            <>
                              <div
                                className={`text-xs ${
                                  isWinner(match, 1)
                                    ? "text-green-600"
                                    : "text-neutral-700"
                                }`}
                              >
                                {getDisplayName(participant2)}
                                </div>
                                <Avatar className="h-6 w-6 shrink-0">
                                {getImage(participant2) ? (
                                  <AvatarImage src={getImage(participant2)} />
                                ) : (
                                  <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(participant2?._id)}>
                                    {initials(participant2)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            </>
                          )}
                        </div>

                        {/* RIGHT SIDE — score + time */}
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          {score && (
                            <div className="text-sm font-semibold">{score}</div>
                          )}

                          {showTime && match.time && (
                            <div className="text-[11px] text-muted-foreground">
                              {match.time}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

export default TournamentSchedule;
