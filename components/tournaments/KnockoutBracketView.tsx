"use client";

import React, { useMemo } from "react";
import type { FC } from "react";
import type { KnockoutBracket, BracketMatch } from "@/types/tournamentDraw";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";
import { getAvatarFallbackStyle } from "@/lib/utils";
import {
  createParticipantMap,
  resolveParticipant,
  getParticipantInitials,
} from "@/services/tournament/utils/participantResolver";
import {
  Participant as TournamentParticipant,
  isTeamParticipant,
  isUserParticipant,
  getParticipantDisplayName,
  getParticipantImage,
} from "@/types/tournament.type";

interface Participant {
  _id: string;
  username?: string;
  fullName?: string;
  profileImage?: string;
  name?: string;
  logo?: string;
}

interface MatchDetails {
  _id: string;
  participants: Participant[];
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  finalScore?: { side1Sets: number; side2Sets: number };
  winnerSide?: "side1" | "side2";
  date?: string;
  time?: string;
  bracketPosition?: {
    round: number;
    matchNumber: number;
  };
}

interface PersistedDoublesPair {
  _id: string;
  player1: TournamentParticipant;
  player2: TournamentParticipant;
}

interface KnockoutBracketViewProps {
  bracket: KnockoutBracket;
  participants: TournamentParticipant[];
  matches: MatchDetails[];
  onMatchClick?: (matchId: string) => void;
  showThirdPlace?: boolean;
  category?: "individual" | "team";
  matchType?: "singles" | "doubles";
  doublesPairs?: PersistedDoublesPair[];
}

interface DoublesPair {
  id: string;
  players: TournamentParticipant[];
}

interface EnhancedMatchData {
  bracketMatch: BracketMatch;
  participant1: Participant | null;
  participant2: Participant | null;
  matchDoc: MatchDetails | null;
  displayState: "bye" | "tbd" | "ready" | "scheduled" | "live" | "completed";
  canClick: boolean;
  showScore: boolean;
}

const getLocalParticipantName = (p: Participant | null): string => {
  if (!p) return "TBD";
  // Use the helper function that handles both users and teams
  return getParticipantDisplayName(p);
};

const getLocalParticipantImage = (
  p: Participant | null
): string | undefined => {
  if (!p) return undefined;
  // Use the helper function that handles both users and teams
  return getParticipantImage(p);
};

const getLocalParticipantInitials = (p: Participant | null): string => {
  if (!p) return "?";
  const name = getLocalParticipantName(p);
  return name.substring(0, 2).toUpperCase();
};

const KnockoutBracketView: FC<KnockoutBracketViewProps> = ({
  bracket,
  participants,
  matches,
  onMatchClick,
  showThirdPlace = false,
  category = "individual",
  matchType = "singles",
  doublesPairs = [],
}) => {
  const isDoubles = matchType === "doubles";

  const pairsMap = useMemo(() => {
    const map = new Map<string, DoublesPair>();
    if (!isDoubles) return map;

    if (doublesPairs && doublesPairs.length > 0) {
      for (const pair of doublesPairs) {
        map.set(pair._id, {
          id: pair._id,
          players: [pair.player1, pair.player2],
        });
      }
      return map;
    }

    const userParticipants = participants.filter(isUserParticipant);
    for (let i = 0; i < userParticipants.length; i += 2) {
      const player1 = userParticipants[i];
      const player2 = userParticipants[i + 1];
      if (player1 && player2) {
        map.set(player1._id, {
          id: player1._id,
          players: [player1, player2],
        });
      }
    }
    return map;
  }, [participants, isDoubles, doublesPairs]);

  const participantMap = useMemo(() => {
    const converted = participants.map((p) => {
      if (isUserParticipant(p)) {
        return {
          _id: p._id,
          username: p.username,
          fullName: p.fullName,
          profileImage: p.profileImage,
        };
      } else if (isTeamParticipant(p)) {
        return {
          _id: p._id,
          name: p.name, // Teams use 'name' not 'username'
          logo: p.logo, // Teams use 'logo' not 'profileImage'
          // Add optional fields for compatibility with ParticipantBase interface
          // Note: Don't include 'username' as isTeamParticipant checks !('username' in participant)
          fullName: p.name,
          profileImage: p.logo,
        };
      }
      return null;
    }).filter((p): p is NonNullable<typeof p> => p !== null);
    
    return createParticipantMap(converted as any);
  }, [participants]);

  const matchByPosition = useMemo(() => {
    const map = new Map<string, MatchDetails>();
    matches.forEach((match) => {
      if (match.bracketPosition) {
        const key = `${match.bracketPosition.round}-${match.bracketPosition.matchNumber}`;
        map.set(key, match);
      }
    });
    return map;
  }, [matches]);

  const enhanceMatchData = (bracketMatch: BracketMatch): EnhancedMatchData => {
    const positionKey = `${bracketMatch.bracketPosition.round}-${bracketMatch.bracketPosition.matchNumber}`;
    const matchDoc = matchByPosition.get(positionKey) || null;

    let participant1: Participant | null = null;
    let participant2: Participant | null = null;

    if (!isDoubles) {
      participant1 = resolveParticipant(
        bracketMatch.participant1,
        participantMap
      );
      participant2 = resolveParticipant(
        bracketMatch.participant2,
        participantMap
      );
    }

    let displayState: EnhancedMatchData["displayState"] = "tbd";

    const isByeMatch =
      (bracketMatch.participant1 !== null &&
        bracketMatch.participant2 === null) ||
      (bracketMatch.participant1 === null &&
        bracketMatch.participant2 !== null);

    if (isByeMatch && bracketMatch.completed) {
      displayState = "bye";
    } else if (bracketMatch.completed) {
      displayState = "completed";
    } else if (matchDoc) {
      if (matchDoc.status === "completed") displayState = "completed";
      else if (matchDoc.status === "in_progress") displayState = "live";
      else displayState = "scheduled";
    } else if (bracketMatch.participant1 && bracketMatch.participant2) {
      if (isDoubles) {
        const pair1 = pairsMap.get(bracketMatch.participant1 as string);
        const pair2 = pairsMap.get(bracketMatch.participant2 as string);
        if (pair1 && pair2) {
          displayState = "ready";
        } else {
          displayState = "tbd";
        }
      } else if (participant1 && participant2) {
        displayState = "ready";
      } else {
        displayState = "tbd";
      }
    } else {
      displayState = "tbd";
    }

    // Allow clicking if:
    // 1. Match has a match document (match exists in database), OR
    // 2. Match has both participants assigned and is in "ready" state (for custom matching or matches not yet created)
    // TBD and bye matches should not be clickable
    const canClick = 
      displayState !== "bye" && 
      displayState !== "tbd" &&
      (matchDoc !== null || displayState === "ready");
    const showScore =
      displayState === "completed" && matchDoc?.finalScore !== undefined;

    return {
      bracketMatch,
      participant1,
      participant2,
      matchDoc,
      displayState,
      canClick,
      showScore,
    };
  };

  const isWinner = (
    enhanced: EnhancedMatchData,
    participantIndex: number
  ): boolean => {
    const { bracketMatch, matchDoc } = enhanced;

    if (bracketMatch.completed && bracketMatch.winner) {
      const participant =
        participantIndex === 0
          ? bracketMatch.participant1
          : bracketMatch.participant2;
      return bracketMatch.winner === participant;
    }

    if (matchDoc?.status === "completed" && matchDoc.winnerSide) {
      return (
        (matchDoc.winnerSide === "side1" && participantIndex === 0) ||
        (matchDoc.winnerSide === "side2" && participantIndex === 1)
      );
    }

    return false;
  };

  const getPairForParticipant = (
    participantId: string | null
  ): DoublesPair | null => {
    if (!participantId || !isDoubles) return null;
    return pairsMap.get(participantId) || null;
  };

  const getDisplayName = (
    participant: Participant | null,
    participantId: string | null
  ): string => {
    if (isDoubles) {
      const pair = getPairForParticipant(participantId);
      if (pair && pair.players.length >= 2) {
        const p1Name = getParticipantDisplayName(pair.players[0]);
        const p2Name = getParticipantDisplayName(pair.players[1]);
        return `${p1Name} & ${p2Name}`;
      }
    }
    return getLocalParticipantName(participant);
  };

  // Helper to get participant display info for schedule row format
  const getParticipantDisplay = (
    participant: Participant | null,
    participantId: string | null,
    isWinnerSide: boolean,
    matchParticipants: any[] | undefined,
    sideIndex: number
  ) => {
    // Handle doubles with match participants array
    if (isDoubles && matchParticipants && matchParticipants.length === 4) {
      const startIdx = sideIndex === 0 ? 0 : 2;
      const players = [
        matchParticipants[startIdx],
        matchParticipants[startIdx + 1],
      ].filter(Boolean);

      if (players.length === 2) {
        return {
          type: "doubles" as const,
          players: players.map((p: any) => ({
            _id: p._id,
            name: getParticipantDisplayName(p),
            image: getParticipantImage(p),
            initials: getParticipantDisplayName(p).substring(0, 2).toUpperCase(),
          })),
        };
      }
    }

    // Handle doubles with pairs map
    const pair = getPairForParticipant(participantId);
    if (isDoubles && pair && pair.players.length >= 2) {
      return {
        type: "doubles" as const,
        players: pair.players.map((p) => ({
          _id: p._id,
          name: getParticipantDisplayName(p),
          image: getParticipantImage(p),
          initials: getParticipantDisplayName(p).substring(0, 2).toUpperCase(),
        })),
      };
    }

    // Handle singles or TBD
    if (!participant) {
      return {
        type: "singles" as const,
        name: "TBD",
        image: undefined,
        initials: "?",
        isWinner: false,
      };
    }

    return {
      type: "singles" as const,
      name: getLocalParticipantName(participant),
      image: getLocalParticipantImage(participant),
      initials: getLocalParticipantInitials(participant),
      isWinner: isWinnerSide,
    };
  };

  const renderMatchRow = (bracketMatch: BracketMatch) => {
    const enhanced = enhanceMatchData(bracketMatch);
    const {
      participant1,
      participant2,
      matchDoc,
      displayState,
      canClick,
      showScore,
    } = enhanced;

    // Determine match ID to use for navigation
    let matchId: string | null = null;
    if (matchDoc?._id) {
      matchId = String(matchDoc._id);
    } else if (typeof bracketMatch.matchId === 'string') {
      matchId = bracketMatch.matchId;
    } else if (typeof bracketMatch.matchId === 'object' && bracketMatch.matchId && '_id' in bracketMatch.matchId) {
      matchId = String((bracketMatch.matchId as { _id: any })._id);
    }

    const p1Display = getParticipantDisplay(
      participant1,
      bracketMatch.participant1,
      isWinner(enhanced, 0),
      (matchDoc as any)?.participants,
      0
    );

    const p2Display = getParticipantDisplay(
      participant2,
      bracketMatch.participant2,
      isWinner(enhanced, 1),
      (matchDoc as any)?.participants,
      1
    );

    const score = showScore && matchDoc?.finalScore
      ? `${matchDoc.finalScore.side1Sets}-${matchDoc.finalScore.side2Sets}`
      : null;

    // Precompute some boolean flags
    const isLive = displayState === "live";

    // Handle bye matches
    if (displayState === "bye") {
      const advancingParticipant = participant1 || participant2 || bracketMatch.participant1 || bracketMatch.participant2;
      const advancingName = advancingParticipant
        ? getDisplayName(
            participant1 || participant2,
            bracketMatch.participant1 || bracketMatch.participant2
          )
        : "BYE";

      return (
        <div
          className={`
            flex items-center justify-between p-2.5
            border-b border-black/5
            ${canClick && matchId ? "cursor-pointer transition hover:bg-neutral-50" : ""}
            ${isLive ? "bg-red-50" : ""}
          `}
          onClick={() => canClick && matchId && onMatchClick?.(matchId)}
        >
          <div className="flex-1 text-sm text-slate-600">
            {advancingName} advances (Bye)
          </div>
          <Badge variant="outline" className="text-xs">
            Bye
          </Badge>
        </div>
      );
    }

    return (
      <div
        className={`
          flex items-center justify-between p-2.5 gap-2
          border-b border-black/5
          ${canClick && matchId ? "cursor-pointer transition hover:bg-neutral-50" : ""}
          ${isLive ? "bg-red-50" : ""}
        `}
        onClick={() => canClick && matchId && onMatchClick?.(matchId)}
      >
        {/* LEFT SIDE — Participant 1 */}
        <div
          className={`flex flex-1 ${
            p1Display.type === "doubles"
              ? "flex-col gap-1"
              : "items-center gap-2"
          }`}
        >
          {p1Display.type === "doubles" ? (
            <>
              {p1Display.players.map((player) => (
                <div key={player._id} className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6 shrink-0">
                    {player.image ? (
                      <AvatarImage src={player.image} />
                    ) : (
                      <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(player._id)}>
                        {player.initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={`text-xs ${
                      isWinner(enhanced, 0)
                        ? "text-green-500 font-semibold"
                        : "text-neutral-700"
                    }`}
                  >
                    {player.name}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <Avatar className="h-6 w-6 shrink-0">
                {p1Display.image ? (
                  <AvatarImage src={p1Display.image} />
                ) : (
                  <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(bracketMatch.participant1 || undefined)}>
                    {p1Display.initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={`text-xs ${
                  isWinner(enhanced, 0)
                    ? "text-green-500 font-semibold"
                    : "text-neutral-700"
                }`}
              >
                {p1Display.name}
              </div>
            </>
          )}
        </div>

        {/* VS */}
        <div className="text-[11px] text-muted-foreground font-semibold px-1">
          vs
        </div>

        {/* RIGHT SIDE — Participant 2 */}
        <div
          className={`flex flex-1 ${
            p2Display.type === "doubles"
              ? "flex-col gap-1"
              : "items-center gap-2"
          }`}
        >
          {p2Display.type === "doubles" ? (
            <>
              {p2Display.players.map((player) => (
                <div key={player._id} className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6 shrink-0">
                    {player.image ? (
                      <AvatarImage src={player.image} />
                    ) : (
                      <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(player._id)}>
                        {player.initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={`text-xs ${
                      isWinner(enhanced, 1)
                        ? "text-green-600 font-semibold"
                        : "text-neutral-700"
                    }`}
                  >
                    {player.name}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div
                className={`text-xs ${
                  isWinner(enhanced, 1)
                    ? "text-green-600 font-semibold"
                    : "text-neutral-700"
                }`}
              >
                {p2Display.name}
              </div>
              <Avatar className="h-6 w-6 shrink-0">
                {p2Display.image ? (
                  <AvatarImage src={p2Display.image} />
                ) : (
                  <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(bracketMatch.participant2 || undefined)}>
                    {p2Display.initials}
                  </AvatarFallback>
                )}
              </Avatar>
            </>
          )}
        </div>

        {/* RIGHT SIDE — Score + Status + Date */}
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {score && (
            <div className="text-xs font-semibold">{score}</div>
          )}
          
          {displayState === "live" && (
            <Badge className="text-xs bg-red-500 text-white animate-pulse">
              LIVE
            </Badge>
          )}
          
          {displayState === "scheduled" && (
            <Badge variant="outline" className="text-xs">
              Scheduled
            </Badge>
          )}
          
          {displayState === "ready" && (
            <Badge variant="outline" className="text-xs">
              Ready
            </Badge>
          )}
          
          {displayState === "tbd" && (
            <Badge variant="outline" className="text-xs text-slate-400">
              TBD
            </Badge>
          )}

          {matchDoc?.date && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(matchDoc.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!bracket || bracket.rounds.length === 0) {
    return (
      <Card className="bg-white border-slate-200">
        <CardContent className="p-6 text-center text-slate-500">
          <Trophy className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p className="text-xs font-medium">No bracket generated</p>
          <p className="text-[10px] mt-1 text-slate-400">
            Generate a knockout bracket to view the tournament structure
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {bracket.rounds.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 text-center text-slate-500">
            <Trophy className="w-8 h-8 mx-auto opacity-30 mb-2" />
            <p className="text-xs font-medium">No bracket generated</p>
            <p className="text-[10px] mt-1 text-slate-400">
              Generate a knockout bracket to view the tournament structure
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Bracket Rounds */}
          {bracket.rounds.map((round, roundIndex) => {
            // Check if any match in this round is live
            const hasLiveMatch = round.matches.some((bracketMatch) => {
              const enhanced = enhanceMatchData(bracketMatch);
              return enhanced.displayState === "live";
            });

            return (
              <section
                key={round.roundNumber}
                className="space-y-2"
              >
                {/* Round Header */}
                <div>
                  <h2 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    {round.roundName || `Round ${round.roundNumber}`}
                    {hasLiveMatch && (
                      <Badge className="text-xs bg-red-500 text-white animate-pulse">
                        LIVE
                      </Badge>
                    )}
                    {round.scheduledDate && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(round.scheduledDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    )}
                  </h2>
                </div>

                {/* Matches Under Round */}
                <div>
                  {round.matches.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No matches scheduled
                    </div>
                  ) : (
                    round.matches.map((bracketMatch, matchIndex) => (
                      <div key={matchIndex}>
                        {renderMatchRow(bracketMatch)}
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}

          {/* Third Place Match */}
          {showThirdPlace && bracket.thirdPlaceMatch && (
            <section className="space-y-2 mt-4 pt-3 border-t border-black/5">
              <div>
                <h2 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Third Place Match
                </h2>
              </div>
              <div>
                {renderMatchRow(bracket.thirdPlaceMatch)}
              </div>
            </section>
          )}

          {/* Legend */}
          <div className="mt-3 pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-600">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>Live</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-600 font-semibold">●</span>
                <span>Winner</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KnockoutBracketView;
