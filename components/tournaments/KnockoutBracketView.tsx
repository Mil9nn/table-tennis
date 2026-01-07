"use client";

import React, { useMemo } from "react";
import type { FC } from "react";
import type { KnockoutBracket, BracketMatch } from "@/types/tournamentDraw";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Calendar } from "lucide-react";
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

    // Only allow clicking if match has participants assigned and a match document exists
    // TBD matches should not be clickable
    const canClick = 
      matchDoc !== null && 
      displayState !== "bye" && 
      displayState !== "tbd";
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

  const getStatusIndicator = (
    displayState: EnhancedMatchData["displayState"]
  ) => {
    switch (displayState) {
      case "live":
        return (
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        );
      default:
        return null;
    }
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

  const renderParticipantRow = (
    participant: Participant | null,
    participantId: string | null,
    isWinnerSide: boolean,
    matchParticipants: any[] | undefined,
    sideIndex: number,
    score?: number
  ) => {
    if (isDoubles && matchParticipants && matchParticipants.length === 4) {
      const startIdx = sideIndex === 0 ? 0 : 2;
      const players = [
        matchParticipants[startIdx],
        matchParticipants[startIdx + 1],
      ].filter(Boolean);

      if (players.length === 2) {
        return (
          <>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              {players.map((player: any) => (
                <div key={player._id} className="flex items-center gap-1">
                  <Avatar className="h-4 w-4 shrink-0">
                    <AvatarImage src={getParticipantImage(player)} />
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-[7px] font-medium">
                      {getParticipantDisplayName(player)
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`text-[10px] truncate ${
                      isWinnerSide
                        ? "font-semibold text-green-600"
                        : "text-slate-600"
                    }`}
                  >
                    {getParticipantDisplayName(player)}
                  </span>
                </div>
              ))}
            </div>
            {score !== undefined && (
              <span className="text-xs font-semibold text-slate-900 ml-1">
                {score}
              </span>
            )}
          </>
        );
      }
    }

    const pair = getPairForParticipant(participantId);
    const hasPair = isDoubles && pair && pair.players.length >= 2;

    if (!participant && !hasPair) {
      return <div className="flex-1 text-[10px] text-slate-400">TBD</div>;
    }

    if (hasPair && pair) {
      return (
        <>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {pair.players.map((player) => (
              <div key={player._id} className="flex items-center gap-1">
                <Avatar className="h-4 w-4 shrink-0">
                  <AvatarImage src={getParticipantImage(player)} />
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-[7px] font-medium">
                    {getParticipantDisplayName(player)
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`text-[10px] truncate ${
                    isWinnerSide
                      ? "font-semibold text-green-600"
                      : "text-slate-600"
                  }`}
                >
                  {getParticipantDisplayName(player)}
                </span>
              </div>
            ))}
          </div>
          {score !== undefined && (
            <span className="text-xs font-semibold text-slate-900 ml-1">
              {score}
            </span>
          )}
        </>
      );
    }

    return (
      <>
        <Avatar className="h-5 w-5 shrink-0">
          {getLocalParticipantImage(participant) ? (
            <AvatarImage src={getLocalParticipantImage(participant)} />
          ) : (
            <AvatarFallback className="bg-slate-200 text-slate-700 text-[8px] font-medium">
              {getLocalParticipantInitials(participant)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div
            className={`text-xs truncate ${
              isWinnerSide ? "font-semibold text-green-600" : "text-slate-600"
            }`}
          >
            {getLocalParticipantName(participant)}
          </div>
        </div>
        {score !== undefined && (
          <span className="text-xs font-semibold text-slate-900 ml-1">
            {score}
          </span>
        )}
      </>
    );
  };

  const renderMatchCard = (bracketMatch: BracketMatch, roundNumber: number) => {
    const enhanced = enhanceMatchData(bracketMatch);
    const {
      participant1,
      participant2,
      matchDoc,
      displayState,
      canClick,
      showScore,
    } = enhanced;

    return (
      <div
        onClick={() => canClick && matchDoc && onMatchClick?.(matchDoc._id)}
        className={`relative w-full min-w-48 ${
          canClick ? "cursor-pointer" : ""
        }`}
      >
        <Card
          className={`
            bg-white border transition-all duration-200
            ${canClick ? "hover:border-slate-400 hover:shadow-md" : ""}
            ${
              displayState === "live"
                ? "border-red-300 bg-red-50"
                : "border-slate-200"
            }
          `}
        >
          <CardContent className="p-2 space-y-1">
            {/* Header with status and time */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {getStatusIndicator(displayState)}
                {displayState !== "completed" && (
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {displayState === "bye"
                      ? "Bye"
                      : displayState === "live"
                      ? "Live"
                      : displayState === "scheduled"
                      ? "Scheduled"
                      : displayState === "ready"
                      ? "Ready"
                      : "TBD"}
                  </span>
                )}
              </div>
              {matchDoc?.date && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
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

            {/* Bye Match Display */}
            {displayState === "bye" && (
              <div className="py-1 text-center">
                <div className="text-xs font-semibold text-slate-700">
                  {participant1 || bracketMatch.participant1 ? (
                    <>
                      {getDisplayName(participant1, bracketMatch.participant1)}{" "}
                      advances
                    </>
                  ) : participant2 || bracketMatch.participant2 ? (
                    <>
                      {getDisplayName(participant2, bracketMatch.participant2)}{" "}
                      advances
                    </>
                  ) : (
                    "BYE"
                  )}
                </div>
              </div>
            )}

            {/* Normal Match Display */}
            {displayState !== "bye" && (
              <>
                {/* Participant 1 */}
                <div className="flex items-center gap-1 p-1 rounded transition-colors hover:bg-slate-50">
                  {renderParticipantRow(
                    participant1,
                    bracketMatch.participant1,
                    isWinner(enhanced, 0),
                    (matchDoc as any)?.participants,
                    0,
                    showScore && matchDoc?.finalScore
                      ? matchDoc.finalScore.side1Sets
                      : undefined
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-1 px-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-medium text-slate-400">
                    VS
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Participant 2 */}
                <div className="flex items-center gap-1 p-1 rounded transition-colors hover:bg-slate-50">
                  {renderParticipantRow(
                    participant2,
                    bracketMatch.participant2,
                    isWinner(enhanced, 1),
                    (matchDoc as any)?.participants,
                    1,
                    showScore && matchDoc?.finalScore
                      ? matchDoc.finalScore.side2Sets
                      : undefined
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Connector line */}
        {roundNumber < bracket.rounds.length && (
          <div className="absolute top-1/2 -right-8 w-8 h-px bg-slate-300 -translate-y-1/2" />
        )}
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
    <div className="space-y-6">
      {/* Main Bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-12 min-w-max px-4">
          {bracket.rounds.map((round, roundIndex) => (
            <div
              key={round.roundNumber}
              className="flex flex-col items-center gap-3"
            >
              {/* Round Header */}
              <div className="py-1 px-2 text-center">
                <h3 className="text-xs font-semibold text-slate-900">
                  {round.roundName}
                </h3>
                {round.scheduledDate && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 justify-center">
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
              </div>

              {/* Matches */}
              <div
                className="flex flex-col justify-around gap-4"
                style={{
                  minHeight: `${Math.max(300, round.matches.length * 110)}px`,
                }}
              >
                {round.matches.map((bracketMatch, matchIndex) => (
                  <div key={matchIndex} className="relative flex items-center">
                    {renderMatchCard(bracketMatch, round.roundNumber)}

                    {/* Vertical connector lines */}
                    {roundIndex > 0 &&
                      matchIndex % 2 === 0 &&
                      matchIndex < round.matches.length - 1 && (
                        <div className="absolute -left-6 top-1/2 w-6">
                          <svg
                            className="absolute top-0 left-0 w-full overflow-visible"
                            style={{ height: `${110 * 2}px` }}
                          >
                            <line
                              x1="0"
                              y1="0"
                              x2="6"
                              y2="0"
                              stroke="#cbd5e1"
                              strokeWidth="1"
                            />
                            <line
                              x1="0"
                              y1="0"
                              x2="0"
                              y2={110 * 2}
                              stroke="#cbd5e1"
                              strokeWidth="1"
                            />
                            <line
                              x1="0"
                              y1={110 * 2}
                              x2="6"
                              y2={110 * 2}
                              stroke="#cbd5e1"
                              strokeWidth="1"
                            />
                          </svg>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Third Place Match */}
      {showThirdPlace && bracket.thirdPlaceMatch && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-2">
              <h3 className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Third Place
              </h3>
            </div>
            {renderMatchCard(bracket.thirdPlaceMatch, -1)}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Live</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-semibold">●</span>
            <span>Winner</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnockoutBracketView;
