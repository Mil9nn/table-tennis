"use client";

import React, { useMemo } from "react";
import type { FC } from "react";
import type { KnockoutBracket, BracketMatch } from "@/types/tournamentDraw";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Award } from "lucide-react";
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

// Local participant type for internal use (compatible with both users and teams)
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

interface KnockoutBracketViewProps {
  bracket: KnockoutBracket;
  participants: TournamentParticipant[]; // All tournament participants (users or teams)
  matches: MatchDetails[]; // Created match documents
  onMatchClick?: (matchId: string) => void;
  showThirdPlace?: boolean;
  category?: "individual" | "team";
}

/**
 * Enhanced match data combining bracket structure and match documents
 */
interface EnhancedMatchData {
  // From bracket structure
  bracketMatch: BracketMatch;
  participant1: Participant | null;
  participant2: Participant | null;

  // From match document (if exists)
  matchDoc: MatchDetails | null;

  // Computed state
  displayState: "bye" | "tbd" | "ready" | "scheduled" | "live" | "completed";
  canClick: boolean;
  showScore: boolean;
}

// Helper to get display name for a local participant
const getLocalParticipantName = (p: Participant | null): string => {
  if (!p) return "TBD";
  // Team: has 'name' but no 'username'
  if (p.name && !p.username) return p.name;
  return p.fullName || p.username || "Unknown";
};

// Helper to get image for a local participant
const getLocalParticipantImage = (p: Participant | null): string | undefined => {
  if (!p) return undefined;
  // Team: has 'logo' instead of 'profileImage'
  if (p.name && !p.username) return p.logo;
  return p.profileImage;
};

// Helper to get initials for a local participant
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
}) => {
  // Create participant lookup map for O(1) access
  // Convert TournamentParticipant[] to ParticipantBase[] for internal use
  // Only include user participants (teams are handled separately in rendering)
  const participantMap = useMemo(() => {
    const userParticipants = participants.filter(isUserParticipant);
    const converted = userParticipants.map(p => {
      if (isUserParticipant(p)) {
        return {
          _id: p._id,
          username: p.username,
          fullName: p.fullName,
          profileImage: p.profileImage,
        };
      }
      return null;
    }).filter((p): p is NonNullable<typeof p> => p !== null);
    return createParticipantMap(converted);
  }, [participants]);

  // Create match lookup by bracket position
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

  /**
   * Enhance bracket match with all necessary display data
   */
  const enhanceMatchData = (bracketMatch: BracketMatch): EnhancedMatchData => {
    // Get match document if exists
    const positionKey = `${bracketMatch.bracketPosition.round}-${bracketMatch.bracketPosition.matchNumber}`;
    const matchDoc = matchByPosition.get(positionKey) || null;

    // Resolve participants from bracket structure
    const participant1 = resolveParticipant(bracketMatch.participant1, participantMap);
    const participant2 = resolveParticipant(bracketMatch.participant2, participantMap);

    // Determine display state
    let displayState: EnhancedMatchData["displayState"] = "tbd";

    // Check if it's a bye match (one participant is assigned, other is null)
    const isByeMatch =
      (bracketMatch.participant1 !== null && bracketMatch.participant2 === null) ||
      (bracketMatch.participant1 === null && bracketMatch.participant2 !== null);

    if (isByeMatch && bracketMatch.completed) {
      displayState = "bye";
    } else if (bracketMatch.completed) {
      displayState = "completed";
    } else if (matchDoc) {
      // Match document exists
      if (matchDoc.status === "completed") displayState = "completed";
      else if (matchDoc.status === "in_progress") displayState = "live";
      else displayState = "scheduled";
    } else if (participant1 && participant2) {
      // Both participants known but no match doc yet
      displayState = "ready";
    } else {
      // At least one participant unknown
      displayState = "tbd";
    }

    const canClick = matchDoc !== null && displayState !== "bye";
    const showScore = displayState === "completed" && matchDoc?.finalScore !== undefined;

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

  /**
   * Get status badge for a match
   */
  const getStatusBadge = (displayState: EnhancedMatchData["displayState"]) => {
    switch (displayState) {
      case "bye":
        return <Badge className="text-xs bg-amber-500 text-white">BYE</Badge>;
      case "completed":
        return <Badge className="text-xs bg-green-500 text-white">Completed</Badge>;
      case "live":
        return <Badge className="text-xs bg-red-500 text-white animate-pulse">Live</Badge>;
      case "scheduled":
        return <Badge className="text-xs bg-blue-500 text-white">Scheduled</Badge>;
      case "ready":
        return <Badge className="text-xs bg-purple-500 text-white">Ready</Badge>;
      case "tbd":
        return <Badge className="text-xs bg-gray-400 text-white">TBD</Badge>;
    }
  };

  /**
   * Check if a participant won the match
   */
  const isWinner = (
    enhanced: EnhancedMatchData,
    participantIndex: number
  ): boolean => {
    const { bracketMatch, matchDoc } = enhanced;

    // Check from bracket structure
    if (bracketMatch.completed && bracketMatch.winner) {
      const participant = participantIndex === 0
        ? bracketMatch.participant1
        : bracketMatch.participant2;
      return bracketMatch.winner === participant;
    }

    // Check from match document
    if (matchDoc?.status === "completed" && matchDoc.winnerSide) {
      return (
        (matchDoc.winnerSide === "side1" && participantIndex === 0) ||
        (matchDoc.winnerSide === "side2" && participantIndex === 1)
      );
    }

    return false;
  };

  /**
   * Render a single match card
   */
  const renderMatchCard = (
    bracketMatch: BracketMatch,
    roundNumber: number
  ) => {
    const enhanced = enhanceMatchData(bracketMatch);
    const { participant1, participant2, matchDoc, displayState, canClick, showScore } = enhanced;

    return (
      <div
        onClick={() => canClick && matchDoc && onMatchClick?.(matchDoc._id)}
        className={`
          relative w-full min-w-[260px]
          ${canClick ? "cursor-pointer" : ""}
        `}
      >
        <Card
          className={`
            bg-white backdrop-blur-sm border transition-all duration-200
            ${canClick ? "hover:shadow-lg hover:scale-[1.02]" : ""}
            ${
              displayState === "completed"
                ? "border-green-200 bg-green-50/30"
                : displayState === "live"
                ? "border-red-300 bg-red-50/30"
                : displayState === "bye"
                ? "border-amber-200 bg-amber-50/30"
                : displayState === "ready"
                ? "border-purple-200 bg-purple-50/30"
                : "border-slate-200"
            }
          `}
        >
          <CardContent className="p-3 space-y-2">
            {/* Header with status and time */}
            <div className="flex justify-between items-center mb-2">
              {getStatusBadge(displayState)}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {matchDoc?.time && <span>{matchDoc.time}</span>}
              </div>
            </div>

            {/* Bye Match Special Display */}
            {displayState === "bye" && (
              <div className="py-4 text-center">
                <Award className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <div className="text-sm font-semibold text-amber-700">
                  {participant1 ? (
                    <>{getLocalParticipantName(participant1)} advances</>
                  ) : participant2 ? (
                    <>{getLocalParticipantName(participant2)} advances</>
                  ) : (
                    "BYE"
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  (Automatic advancement)
                </div>
              </div>
            )}

            {/* Normal Match Display */}
            {displayState !== "bye" && (
              <>
                {/* Participant 1 */}
                <div
                  className={`
                    flex items-center gap-2 p-2 rounded-lg transition-colors
                    ${
                      isWinner(enhanced, 0)
                        ? "bg-green-100 border border-green-300"
                        : "bg-slate-50"
                    }
                  `}
                >
                  {participant1 ? (
                    <>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {getLocalParticipantImage(participant1) ? (
                          <AvatarImage src={getLocalParticipantImage(participant1)} />
                        ) : (
                          <AvatarFallback className="bg-blue-500 text-white text-xs">
                            {getLocalParticipantInitials(participant1)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium truncate ${
                            isWinner(enhanced, 0) ? "text-green-700" : "text-slate-700"
                          }`}
                        >
                          {getLocalParticipantName(participant1)}
                        </div>
                      </div>
                      {showScore && matchDoc?.finalScore && (
                        <span className="text-sm font-bold text-slate-700">
                          {matchDoc.finalScore.side1Sets}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 text-sm text-slate-400 italic">TBD</div>
                  )}
                </div>

                {/* VS Divider */}
                <div className="text-center">
                  <span className="text-xs font-semibold text-slate-400">VS</span>
                </div>

                {/* Participant 2 */}
                <div
                  className={`
                    flex items-center gap-2 p-2 rounded-lg transition-colors
                    ${
                      isWinner(enhanced, 1)
                        ? "bg-green-100 border border-green-300"
                        : "bg-slate-50"
                    }
                  `}
                >
                  {participant2 ? (
                    <>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {getLocalParticipantImage(participant2) ? (
                          <AvatarImage src={getLocalParticipantImage(participant2)} />
                        ) : (
                          <AvatarFallback className="bg-blue-500 text-white text-xs">
                            {getLocalParticipantInitials(participant2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium truncate ${
                            isWinner(enhanced, 1) ? "text-green-700" : "text-slate-700"
                          }`}
                        >
                          {getLocalParticipantName(participant2)}
                        </div>
                      </div>
                      {showScore && matchDoc?.finalScore && (
                        <span className="text-sm font-bold text-slate-700">
                          {matchDoc.finalScore.side2Sets}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 text-sm text-slate-400 italic">TBD</div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Connector line to next round */}
        {roundNumber < bracket.rounds.length && (
          <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-slate-300 -translate-y-1/2 z-0" />
        )}
      </div>
    );
  };

  // Empty state
  if (!bracket || bracket.rounds.length === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border border-white/10">
        <CardContent className="p-12 text-center text-muted-foreground">
          <Trophy className="w-16 h-16 mx-auto opacity-40" />
          <p className="mt-4 text-base font-medium">No bracket generated</p>
          <p className="text-sm mt-2 text-muted-foreground">
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
        <div className="inline-flex gap-16 min-w-max px-4">
          {bracket.rounds.map((round, roundIndex) => (
            <div key={round.roundNumber} className="flex flex-col items-center gap-4">
              {/* Round Header */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-3 px-4 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-base font-bold text-indigo-700 text-center">
                  {round.roundName}
                </h3>
                {round.scheduledDate && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground justify-center">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(round.scheduledDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Matches in this round */}
              <div
                className="flex flex-col justify-around gap-8"
                style={{
                  minHeight: `${Math.max(400, round.matches.length * 140)}px`,
                }}
              >
                {round.matches.map((bracketMatch, matchIndex) => (
                  <div key={matchIndex} className="relative flex items-center">
                    {renderMatchCard(bracketMatch, round.roundNumber)}

                    {/* Vertical connector lines for subsequent rounds */}
                    {roundIndex > 0 && matchIndex % 2 === 0 && matchIndex < round.matches.length - 1 && (
                      <div className="absolute -left-8 top-1/2 w-8">
                        <svg
                          className="absolute top-0 left-0 w-full overflow-visible"
                          style={{ height: `${140 * 2}px` }}
                        >
                          {/* Top horizontal */}
                          <line
                            x1="0"
                            y1="0"
                            x2="8"
                            y2="0"
                            stroke="#CBD5E1"
                            strokeWidth="2"
                          />
                          {/* Vertical connector */}
                          <line
                            x1="0"
                            y1="0"
                            x2="0"
                            y2={140 * 2}
                            stroke="#CBD5E1"
                            strokeWidth="2"
                          />
                          {/* Bottom horizontal */}
                          <line
                            x1="0"
                            y1={140 * 2}
                            x2="8"
                            y2={140 * 2}
                            stroke="#CBD5E1"
                            strokeWidth="2"
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
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-amber-600 inline-flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Third Place Match
              </h3>
            </div>
            {renderMatchCard(bracket.thirdPlaceMatch, -1)}
          </div>
        </div>
      )}

      {/* Bracket Legend */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span>Live</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Bye</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>TBD</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnockoutBracketView;
