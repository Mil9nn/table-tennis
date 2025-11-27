"use client";

import React, { useState } from "react";
import { KnockoutBracket as IKnockoutBracket, Participant } from "@/types/tournament.type";
import { Trophy, Medal, Award, Loader2, ChevronRight } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";

interface KnockoutBracketProps {
  bracket: IKnockoutBracket;
  participants?: Participant[];
  onMatchClick?: (matchId: string) => void;
  tournamentId?: string;
}

export default function KnockoutBracket({
  bracket,
  participants = [],
  onMatchClick,
  tournamentId,
}: KnockoutBracketProps) {
  const [creatingMatchPosition, setCreatingMatchPosition] = useState<number | null>(null);

  const participantMap = new Map(
    participants.map((p) => [p._id.toString(), p])
  );

  const getParticipantName = (participantId?: string): string => {
    if (!participantId) return "TBD";
    const participant = participantMap.get(participantId);
    return participant?.fullName || participant?.username || "Unknown";
  };

  const getParticipantFromSlot = (slot: any, bracket?: any): string => {
    if (slot.type === "bye") return "BYE";
    if (slot.type === "tbd") return "TBD";
    if (slot.participantId) {
      return getParticipantName(slot.participantId.toString());
    }
    if (slot.type === "from_match" && bracket) {
      const sourceMatch = findMatchByPosition(bracket, slot.fromMatchPosition);
      if (sourceMatch) {
        const winnerId = slot.isWinnerOf ? sourceMatch.winner : sourceMatch.loser;
        if (winnerId) {
          return getParticipantName(winnerId.toString());
        }
      }
      return `Winner M${slot.fromMatchPosition + 1}`;
    }
    if (slot.type === "from_group") {
      return `${slot.fromGroupPosition}${getOrdinalSuffix(slot.fromGroupPosition)} from Group ${slot.fromGroupId}`;
    }
    return "TBD";
  };

  const findMatchByPosition = (bracket: any, position: number): any => {
    for (const round of bracket.rounds) {
      const match = round.matches.find((m: any) => m.bracketPosition === position);
      if (match) return match;
    }
    return null;
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const getRoundIcon = (roundName: string) => {
    if (roundName === "Final") return <Trophy className="size-5 bg-yellow-100 text-yellow-500 p-1 rounded-full" />;
    if (roundName === "Semi Finals") return <Medal className="size-5 bg-gray-200 p-1 rounded-full" />;
    if (roundName === "Quarter Finals") return <Award className="size-5" />;
    return null;
  };

  const resolveParticipantId = (slot: any, bracket?: any): string | null => {
    if (slot.type === "bye" || slot.type === "tbd") return null;
    if (slot.participantId) {
      return slot.participantId.toString();
    }
    if (slot.type === "from_match" && bracket) {
      const sourceMatch = findMatchByPosition(bracket, slot.fromMatchPosition);
      if (sourceMatch) {
        const winnerId = slot.isWinnerOf ? sourceMatch.winner : sourceMatch.loser;
        if (winnerId) {
          return winnerId.toString();
        }
      }
    }
    return null;
  };

  const isMatchPlayable = (match: any): boolean => {
    const p1Id = resolveParticipantId(match.participant1, bracket);
    const p2Id = resolveParticipantId(match.participant2, bracket);
    return p1Id !== null && p2Id !== null;
  };

  const handleMatchClick = async (match: any) => {
    if (match.matchId) {
      onMatchClick?.(match.matchId.toString());
      return;
    }

    if (!isMatchPlayable(match)) {
      toast.error("Both participants must be determined");
      return;
    }

    if (!tournamentId) {
      toast.error("Cannot create match: Tournament ID not provided");
      return;
    }

    try {
      setCreatingMatchPosition(match.bracketPosition);
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/create-bracket-match`,
        { bracketPosition: match.bracketPosition }
      );

      if (data.matchId) {
        onMatchClick?.(data.matchId.toString());
      }
    } catch (err: any) {
      console.error("Error creating match:", err);
      toast.error(err.response?.data?.error || "Failed to create match");
    } finally {
      setCreatingMatchPosition(null);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-8 px-4 sm:px-6">
      <div className="min-w-max">
        <div className="flex gap-6 lg:gap-12 items-start">
          {bracket.rounds.map((round, roundIndex) => (
            <React.Fragment key={round.roundNumber}>
              <div className="flex flex-col min-w-[240px] sm:min-w-[280px]">
                {/* Round Header */}
                <div className="mb-6 pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <div className="text-neutral-400">
                      {getRoundIcon(round.name)}
                    </div>
                    <h3 className="font-semibold text-sm text-neutral-900 tracking-tight">
                      {round.name}
                    </h3>
                  </div>
                  {round.completed && (
                    <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Complete
                    </span>
                  )}
                </div>

                {/* Matches */}
                <div className="flex flex-col justify-around flex-1 gap-8">
                  {round.matches.map((match) => {
                    const participant1Name = getParticipantFromSlot(match.participant1, bracket);
                    const participant2Name = getParticipantFromSlot(match.participant2, bracket);

                    // Resolve participant IDs for winner comparison
                    const participant1Id = resolveParticipantId(match.participant1, bracket);
                    const participant2Id = resolveParticipantId(match.participant2, bracket);

                    const isThirdPlaceMatch =
                      match.bracketPosition === bracket.thirdPlaceMatchPosition;

                    const isByeMatch = match.participant1.type === "bye" || match.participant2.type === "bye";
                    const hasActualParticipants = match.participant1.type === "direct" || match.participant2.type === "direct";
                    const isActuallyCompleted = match.completed && (
                      match.matchId ||
                      (match.winner && isByeMatch && hasActualParticipants)
                    );

                    const isPlayable = isMatchPlayable(match);
                    const isCreating = creatingMatchPosition === match.bracketPosition;

                    const isPending = participant1Name === "TBD" || participant2Name === "TBD" ||
                                     participant1Name.includes("Winner") || participant2Name.includes("Winner");

                    return (
                      <div
                        key={match.bracketPosition}
                        onClick={() => !isCreating && handleMatchClick(match)}
                        className={`
                          group relative rounded-lg border transition-all duration-200
                          ${isPlayable || match.matchId ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
                          ${isActuallyCompleted 
                            ? " border-emerald-400 border-2 shadow-sm" 
                            : isPending
                            ? "bg-neutral-50/80 border-neutral-200"
                            : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md"
                          }
                          ${isThirdPlaceMatch ? "ring-2 ring-orange-400/30" : ""}
                        `}
                      >
                        {/* Third Place Badge */}
                        {isThirdPlaceMatch && (
                          <div className="absolute -top-2.5 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Award className="w-2.5 h-2.5" />
                            3RD PLACE
                          </div>
                        )}

                        {/* Match Content */}
                        <div className="p-3 space-y-2">
                          {/* Participant 1 */}
                          <div className={`
                            flex items-center justify-between px-3 py-2 rounded-md transition-colors
                            ${isActuallyCompleted && participant1Id && match.winner?.toString() === participant1Id
                              ? "bg-white/80 ring-emerald-300"
                              : "bg-neutral-50"
                            }
                          `}>
                            <span className={`
                              text-[13px] truncate flex-1
                              ${isActuallyCompleted && participant1Id && match.winner?.toString() === participant1Id
                                ? "font-semibold text-neutral-900"
                                : "font-medium text-neutral-700"
                              }
                            `}>
                              {participant1Name}
                            </span>
                            {isActuallyCompleted && participant1Id && match.winner?.toString() === participant1Id && (
                              <div className="ml-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                            )}
                          </div>

                          {/* VS Divider */}
                          <div className="flex items-center justify-center">
                            <div className="h-px flex-1 bg-neutral-200" />
                            <span className="px-2 text-[10px] font-semibold text-neutral-400 tracking-wider">
                              VS
                            </span>
                            <div className="h-px flex-1 bg-neutral-200" />
                          </div>

                          {/* Participant 2 */}
                          <div className={`
                            flex items-center justify-between px-3 py-2 rounded-md transition-colors
                            ${isActuallyCompleted && participant2Id && match.winner?.toString() === participant2Id
                              ? "bg-white/80"
                              : "bg-neutral-50"
                            }
                          `}>
                            <span className={`
                              text-[13px] truncate flex-1
                              ${isActuallyCompleted && participant2Id && match.winner?.toString() === participant2Id
                                ? "font-semibold text-neutral-900"
                                : "font-medium text-neutral-700"
                              }
                            `}>
                              {participant2Name}
                            </span>
                            {isActuallyCompleted && participant2Id && match.winner?.toString() === participant2Id && (
                              <div className="ml-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Match Footer */}
                        <div className="px-3 py-2 border-t border-neutral-200/50 bg-neutral-50/30 rounded-b-lg">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-500 font-medium">
                              Match {match.bracketPosition + 1}
                            </span>
                            {isCreating ? (
                              <span className="text-blue-600 font-semibold flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Creating
                              </span>
                            ) : isActuallyCompleted ? (
                              <span className="text-emerald-600 font-semibold">
                                Complete
                              </span>
                            ) : !isPending ? (
                              <span className="text-blue-600 font-medium flex items-center gap-1">
                                Ready
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            ) : (
                              <span className="text-neutral-400 font-medium">Pending</span>
                            )}
                          </div>
                          {match.scheduledTime && (
                            <div className="mt-1 text-[10px] text-neutral-500">
                              {new Date(match.scheduledTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Round Connector */}
              {roundIndex < bracket.rounds.length - 1 && (
                <div className="flex items-center justify-center self-stretch py-12">
                  <ChevronRight className="w-5 h-5 text-neutral-300" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}