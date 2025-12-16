"use client";

import React from "react";
import type { FC } from "react";
import type { Round } from "@/types/tournament.type";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users } from "lucide-react";

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
  participants: Participant[];
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  finalScore?: { side1Sets: number; side2Sets: number };
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
  rounds: (Round & { groupName?: string; groupId?: string; roundName?: string })[];
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
    return (match as TeamMatch).team1 !== undefined && (match as TeamMatch).team2 !== undefined;
  };

  const initials = (p?: Participant | TeamInfo) => {
    if (!p) return "?";
    const displayName = (p as TeamInfo).name || (p as Participant).fullName || (p as Participant).username || "?";
    return displayName
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getDisplayName = (p?: Participant | TeamInfo) => {
    if (!p) return "?";
    return (p as TeamInfo).name || (p as Participant).fullName || (p as Participant).username || "?";
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
      if (!match.winnerSide) return false;
      return (
        (match.winnerSide === "side1" && index === 0) ||
        (match.winnerSide === "side2" && index === 1)
      );
    }
  };

  const getMatchScore = (match: Match) => {
    if (match.status !== "completed") return null;
    
    if (isTeamMatch(match) && match.finalScore) {
      return `${match.finalScore.team1Matches}-${match.finalScore.team2Matches}`;
    } else if (!isTeamMatch(match) && match.finalScore) {
      return `${match.finalScore.side1Sets}-${match.finalScore.side2Sets}`;
    }
    return null;
  };

  const getParticipant1 = (match: Match): Participant | TeamInfo | undefined => {
    if (isTeamMatch(match)) {
      return match.team1;
    }
    return match.participants?.[0];
  };

  const getParticipant2 = (match: Match): Participant | TeamInfo | undefined => {
    if (isTeamMatch(match)) {
      return match.team2;
    }
    return match.participants?.[1];
  };

  return (
    <div className="space-y-2">
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
          const isNewGroup = round.groupName && (
            index === 0 || 
            rounds[index - 1].groupName !== round.groupName
          );

          return (
            <section 
              key={`${round.groupId || 'main'}-${round.roundNumber}`} 
              className="space-y-2"
            >
              {/* Group Header (only show for grouped tournaments) */}
              {isNewGroup && round.groupName && (
                <div className="mt-4 mb-2 pt-2 border-t border-slate-200">
                  <h3 className="text-base font-bold text-indigo-700">
                    {round.groupName}
                  </h3>
                </div>
              )}

              {/* Round Header */}
              <div>
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
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          {getImage(participant1) ? (
                            <AvatarImage src={getImage(participant1)} />
                          ) : (
                            <AvatarFallback className="bg-blue-400 text-white text-xs">
                              {initials(participant1)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div
                          className={`text-sm truncate min-w-0 ${
                            isWinner(match, 0) ? "text-green-500" : "text-neutral-700"
                          }`}
                        >
                          {getDisplayName(participant1)}
                        </div>

                        {/* VS */}
                        <div className="text-[11px] text-muted-foreground font-semibold px-1">
                          vs
                        </div>

                        <div
                          className={`text-sm truncate min-w-0 ${
                            isWinner(match, 1) ? "text-green-600" : "text-neutral-700"
                          }`}
                        >
                          {getDisplayName(participant2)}
                        </div>
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          {getImage(participant2) ? (
                            <AvatarImage src={getImage(participant2)} />
                          ) : (
                            <AvatarFallback className="text-xs bg-blue-400 text-white">
                              {initials(participant2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>

                      {/* RIGHT SIDE — score + time */}
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {score && (
                          <div className="text-sm font-semibold">
                            {score}
                          </div>
                        )}

                        {showTime && match.time && (
                          <div className="text-[11px] text-muted-foreground">
                            {match.time}
                          </div>
                        )}
                      </div>
                    </div>
                  )})
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
