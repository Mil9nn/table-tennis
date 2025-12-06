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
  username: string;
  fullName?: string;
  profileImage?: string;
}

interface Match {
  _id: string;
  participants: Participant[];
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  finalScore?: { side1Sets: number; side2Sets: number };
  winnerSide?: "side1" | "side2";
  date?: string;
  time?: string;
}

interface TournamentScheduleProps {
  rounds: (Round & { groupName?: string; groupId?: string; roundName?: string })[];
  matches: Match[];
  onMatchClick?: (id: string) => void;
  showDate?: boolean;
  showTime?: boolean;
  venue?: string;
  format?: "round_robin" | "knockout";
}

const TournamentSchedule: FC<TournamentScheduleProps> = ({
  rounds,
  matches,
  onMatchClick,
  showDate = true,
  showTime = true,
  format = "round_robin",
}) => {
  const getMatchById = (id: string) =>
    matches.find((m) => String(m._id) === String(id)) ?? null;

  const initials = (p?: Participant) =>
    (p?.fullName || p?.username || "?")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const isWinner = (match: Match, index: number) => {
    if (match.status !== "completed" || !match.winnerSide) return false;
    return (
      (match.winnerSide === "side1" && index === 0) ||
      (match.winnerSide === "side2" && index === 1)
    );
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
                  roundMatches.map((match) => (
                    <div
                      key={match._id}
                      onClick={() => onMatchClick?.(match._id)}
                      className="
                        flex items-center justify-between p-2.5
                        border-b border-black/5 cursor-pointer 
                        transition hover:bg-neutral-50
                      "
                    >
                      {/* LEFT SIDE — players */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          {match.participants?.[0]?.profileImage ? (
                            <AvatarImage src={match.participants[0].profileImage} />
                          ) : (
                            <AvatarFallback className="bg-blue-400 text-white text-xs">
                              {initials(match.participants?.[0])}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div
                          className={`text-sm truncate min-w-0 ${
                            isWinner(match, 0) ? "text-green-500" : "text-neutral-700"
                          }`}
                        >
                          {match.participants?.[0]?.fullName || match.participants?.[0]?.username}
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
                          {match.participants?.[1]?.fullName || match.participants?.[1]?.username}
                        </div>
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          {match.participants?.[1]?.profileImage ? (
                            <AvatarImage src={match.participants[1].profileImage} />
                          ) : (
                            <AvatarFallback className="text-xs bg-blue-400 text-white">
                              {initials(match.participants?.[1])}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>

                      {/* RIGHT SIDE — score + time */}
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {match.status === "completed" && match.finalScore && (
                          <div className="text-sm font-semibold">
                            {match.finalScore.side1Sets}-{match.finalScore.side2Sets}
                          </div>
                        )}

                        {showTime && match.time && (
                          <div className="text-[11px] text-muted-foreground">
                            {match.time}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
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
