"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { KnockoutBracket } from "@/types/tournamentDraw";

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

interface CustomMatchup {
  matchNumber: number;
  participant1: string | null;
  participant2: string | null;
}

interface CustomKnockoutMatcherProps {
  tournamentId: string;
  bracket: KnockoutBracket;
  participants: Participant[];
  currentRound: number;
  onSuccess?: () => void;
}

export default function CustomKnockoutMatcher({
  tournamentId,
  bracket,
  participants,
  currentRound,
  onSuccess,
}: CustomKnockoutMatcherProps) {
  const [matchups, setMatchups] = useState<CustomMatchup[]>([]);
  const [saving, setSaving] = useState(false);

  // Get all participants who have been eliminated (lost their matches)
  const getEliminatedParticipants = (upToRound: number): Set<string> => {
    const eliminated = new Set<string>();

    // Check all rounds before the target round
    for (const round of bracket.rounds) {
      if (round.roundNumber >= upToRound) break;

      for (const match of round.matches) {
        if (match.completed && match.winner) {
          // Find the loser
          const loser =
            match.participant1 === match.winner
              ? match.participant2
              : match.participant1;

          if (loser) {
            eliminated.add(loser.toString());
          }
        }
      }
    }

    return eliminated;
  };

  // Get eligible participants for the current round
  const getEligibleParticipants = (): Set<string> => {
    // For round 1, all tournament participants are eligible
    if (currentRound === 1) {
      return new Set(participants.map((p) => p._id));
    }

    // For subsequent rounds, only participants who haven't lost are eligible
    const eliminated = getEliminatedParticipants(currentRound);
    const eligible = new Set<string>();

    for (const participant of participants) {
      if (!eliminated.has(participant._id)) {
        eligible.add(participant._id);
      }
    }

    return eligible;
  };

  const eligibleParticipantIds = getEligibleParticipants();

  // Initialize matchups based on the current round
  useEffect(() => {
    const round = bracket.rounds.find((r) => r.roundNumber === currentRound);
    if (!round) return;

    const initialMatchups: CustomMatchup[] = round.matches.map((match) => ({
      matchNumber: match.bracketPosition.matchNumber,
      participant1: match.participant1,
      participant2: match.participant2,
    }));

    setMatchups(initialMatchups);
  }, [bracket, currentRound]);

  const currentRoundData = bracket.rounds.find(
    (r) => r.roundNumber === currentRound
  );

  if (!currentRoundData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Round {currentRound} not found in bracket.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUsedParticipantIds = (): Set<string> => {
    const used = new Set<string>();
    matchups.forEach((matchup) => {
      if (matchup.participant1) used.add(matchup.participant1);
      if (matchup.participant2) used.add(matchup.participant2);
    });
    return used;
  };

  const getAvailableParticipants = (
    excludeMatchIndex?: number
  ): Participant[] => {
    const used = new Set<string>();
    matchups.forEach((matchup, idx) => {
      if (idx === excludeMatchIndex) return;
      if (matchup.participant1) used.add(matchup.participant1);
      if (matchup.participant2) used.add(matchup.participant2);
    });

    // Filter by: 1) not used in this round, 2) eligible (not eliminated)
    return participants.filter(
      (p) => !used.has(p._id) && eligibleParticipantIds.has(p._id)
    );
  };

  const getParticipantById = (id: string): Participant | undefined => {
    return participants.find((p) => p._id === id);
  };

  const updateMatchupParticipant = (
    matchIndex: number,
    slot: "participant1" | "participant2",
    participantId: string | null
  ) => {
    const newMatchups = [...matchups];
    newMatchups[matchIndex] = {
      ...newMatchups[matchIndex],
      [slot]: participantId,
    };
    setMatchups(newMatchups);
  };

  const resetMatchups = () => {
    const round = bracket.rounds.find((r) => r.roundNumber === currentRound);
    if (!round) return;

    const initialMatchups: CustomMatchup[] = round.matches.map((match) => ({
      matchNumber: match.bracketPosition.matchNumber,
      participant1: null,
      participant2: null,
    }));

    setMatchups(initialMatchups);
    toast.info("Matchups reset");
  };

  const handleSave = async () => {
    // Validate all matchups are complete
    const isAllComplete = matchups.every(
      (matchup) => matchup.participant1 && matchup.participant2
    );

    if (!isAllComplete) {
      toast.error("Please complete all matchups before saving");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/custom-bracket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roundNumber: currentRound,
            matches: matchups,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save custom matchups");
      }

      toast.success("Custom matchups saved successfully!");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error saving custom matchups:", error);
      toast.error(error.message || "Failed to save custom matchups");
    } finally {
      setSaving(false);
    }
  };

  const usedParticipants = getUsedParticipantIds();
  const eliminatedParticipantIds = getEliminatedParticipants(currentRound);
  const eliminatedParticipants = participants.filter((p) =>
    eliminatedParticipantIds.has(p._id)
  );
  const unmatchedEligibleParticipants = participants.filter(
    (p) => !usedParticipants.has(p._id) && eligibleParticipantIds.has(p._id)
  );

  const isValid = matchups.every(
    (matchup) => matchup.participant1 && matchup.participant2
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {currentRoundData.roundName}
            </h3>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Round {currentRound} - Customize {matchups.length} match
              {matchups.length !== 1 ? "es" : ""}
            </p>
          </div>
          <Badge variant="outline" className="text-xs rounded-full">
            {matchups.filter((m) => m.participant1 && m.participant2).length}/
            {matchups.length} Complete
          </Badge>
        </div>
      </header>

      {/* Matchups List */}
      <div className="space-y-3">
        <AnimatePresence>
          {matchups.map((matchup, index) => {
            const p1 = matchup.participant1
              ? getParticipantById(matchup.participant1)
              : undefined;
            const p2 = matchup.participant2
              ? getParticipantById(matchup.participant2)
              : undefined;

            const availableForMatch = getAvailableParticipants(index);
            const availableForP1 = matchup.participant2
              ? availableForMatch.filter((p) => p._id !== matchup.participant2)
              : availableForMatch;
            const availableForP2 = matchup.participant1
              ? availableForMatch.filter((p) => p._id !== matchup.participant1)
              : availableForMatch;

            // Add current selections to available options
            if (p1 && !availableForP1.find((p) => p._id === p1._id)) {
              availableForP1.unshift(p1);
            }
            if (p2 && !availableForP2.find((p) => p._id === p2._id)) {
              availableForP2.unshift(p2);
            }

            const isComplete = matchup.participant1 && matchup.participant2;

            return (
              <motion.div
                key={matchup.matchNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Match Number */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-sm">
                          {matchup.matchNumber}
                        </div>
                      </div>

                      {/* Participant 1 */}
                      <div className="flex-1 min-w-[200px]">
                        <Select
                          value={matchup.participant1 || ""}
                          onValueChange={(value) =>
                            updateMatchupParticipant(
                              index,
                              "participant1",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Select player">
                              {p1 ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6 flex-shrink-0">
                                    <AvatarImage src={p1.profileImage} />
                                    <AvatarFallback className="text-xs">
                                      {(p1.fullName || p1.username)
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium truncate">
                                    {p1.fullName || p1.username}
                                  </span>
                                </div>
                              ) : (
                                <span>Select player</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableForP1.length > 0 ? (
                              availableForP1.map((participant) => (
                                <SelectItem
                                  key={participant._id}
                                  value={participant._id}
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6 flex-shrink-0">
                                      <AvatarImage
                                        src={participant.profileImage}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {(
                                          participant.fullName ||
                                          participant.username
                                        )
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {participant.fullName ||
                                        participant.username}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                No available players
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* VS Divider */}
                      <div className="flex-shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          VS
                        </span>
                      </div>

                      {/* Participant 2 */}
                      <div className="flex-1 min-w-[200px]">
                        <Select
                          value={matchup.participant2 || ""}
                          onValueChange={(value) =>
                            updateMatchupParticipant(
                              index,
                              "participant2",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Select player">
                              {p2 ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6 flex-shrink-0">
                                    <AvatarImage src={p2.profileImage} />
                                    <AvatarFallback className="text-xs">
                                      {(p2.fullName || p2.username)
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium truncate">
                                    {p2.fullName || p2.username}
                                  </span>
                                </div>
                              ) : (
                                <span>Select player</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableForP2.length > 0 ? (
                              availableForP2.map((participant) => (
                                <SelectItem
                                  key={participant._id}
                                  value={participant._id}
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6 flex-shrink-0">
                                      <AvatarImage
                                        src={participant.profileImage}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {(
                                          participant.fullName ||
                                          participant.username
                                        )
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {participant.fullName ||
                                        participant.username}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                No available players
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {isComplete ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Unmatched Eligible Participants */}
      {unmatchedEligibleParticipants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">
                    Unmatched Eligible Participants (
                    {unmatchedEligibleParticipants.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {unmatchedEligibleParticipants.map((participant) => (
                      <Badge
                        key={participant._id}
                        variant="outline"
                        className="bg-white"
                      >
                        <Avatar className="w-4 h-4 mr-1.5">
                          <AvatarImage src={participant.profileImage} />
                          <AvatarFallback className="text-[8px]">
                            {(participant.fullName || participant.username)
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {participant.fullName || participant.username}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Eliminated Participants (for info) */}
      {eliminatedParticipants.length > 0 && currentRound > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">
                    Eliminated Participants ({eliminatedParticipants.length})
                  </h4>
                  <p className="text-xs text-red-700 mb-2">
                    These participants lost in previous rounds and cannot be
                    selected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {eliminatedParticipants.map((participant) => (
                      <Badge
                        key={participant._id}
                        variant="outline"
                        className="bg-white opacity-60"
                      >
                        <Avatar className="w-4 h-4 mr-1.5">
                          <AvatarImage src={participant.profileImage} />
                          <AvatarFallback className="text-[8px]">
                            {(participant.fullName || participant.username)
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {participant.fullName || participant.username}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Validation Status */}
      {matchups.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              {isValid ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    All matchups are complete and ready to save
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-600 font-medium">
                    Please complete all matchups before saving
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={resetMatchups}
          disabled={saving}
          className="flex-1"
          size="lg"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !isValid}
          className="flex-1"
          size="lg"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Matchups
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
