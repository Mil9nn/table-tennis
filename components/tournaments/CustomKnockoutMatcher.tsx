"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { KnockoutBracket } from "@/types/tournamentDraw";
import DoublesPairBuilder, { DoublesPairData } from "./DoublesPairBuilder";

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

// Persisted pair from tournament.doublesPairs
interface PersistedPair {
  _id: string;
  player1: Participant;
  player2: Participant;
}

interface CustomMatchup {
  matchNumber: number;
  participant1: string | null; // For doubles: pair ID; for singles: player ID
  participant2: string | null;
}

interface CustomKnockoutMatcherProps {
  tournamentId: string;
  bracket: KnockoutBracket;
  participants: Participant[];
  qualifiedParticipantIds?: Set<string>; // Set of qualified participant IDs (for hybrid tournaments)
  currentRound: number;
  onSuccess?: () => void;
  matchType?: "singles" | "doubles";
  existingPairs?: PersistedPair[]; // Pairs from tournament.doublesPairs
}

export default function CustomKnockoutMatcher({
  tournamentId,
  bracket,
  participants,
  qualifiedParticipantIds,
  currentRound,
  onSuccess,
  matchType = "singles",
  existingPairs = [],
}: CustomKnockoutMatcherProps) {
  const [matchups, setMatchups] = useState<CustomMatchup[]>([]);
  const [saving, setSaving] = useState(false);
  const [pairs, setPairs] = useState<DoublesPairData[]>([]);
  const [showPairBuilder, setShowPairBuilder] = useState(false);

  // Check if this is a doubles tournament
  const isDoubles = matchType === "doubles";

  // Initialize pairs from existing data
  useEffect(() => {
    if (isDoubles && existingPairs.length > 0) {
      setPairs(existingPairs.map(p => ({
        _id: p._id,
        player1: p.player1,
        player2: p.player2,
      })));
    }
  }, [existingPairs, isDoubles]);

  // For Round 1 doubles without pairs, show pair builder
  useEffect(() => {
    if (isDoubles && currentRound === 1 && pairs.length === 0 && existingPairs.length === 0) {
      setShowPairBuilder(true);
    }
  }, [isDoubles, currentRound, pairs.length, existingPairs.length]);

  // Get pair by ID
  const getPairById = useCallback((id: string): DoublesPairData | undefined => {
    return pairs.find((pair) => pair._id === id);
  }, [pairs]);

  // Get participant by ID (for singles)
  const getParticipantById = useCallback((id: string): Participant | undefined => {
    return participants.find((p) => p._id === id);
  }, [participants]);

  // Get all entry IDs who have been eliminated (lost their matches)
  const getEliminatedEntryIds = useCallback((upToRound: number): Set<string> => {
    const eliminated = new Set<string>();

    for (const round of bracket.rounds) {
      if (round.roundNumber >= upToRound) break;

      for (const match of round.matches) {
        if (match.completed && match.winner) {
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
  }, [bracket.rounds]);

  // Get eligible entry IDs for the current round
  const getEligibleIds = useCallback((): Set<string> => {
    if (isDoubles) {
      // For doubles, use pair IDs
      if (currentRound === 1) {
        return new Set(pairs.map((pair) => pair._id));
      }
      const eliminated = getEliminatedEntryIds(currentRound);
      const eligible = new Set<string>();
      for (const pair of pairs) {
        if (!eliminated.has(pair._id)) {
          eligible.add(pair._id);
        }
      }
      return eligible;
    } else {
      // For singles, use individual player IDs
      if (currentRound === 1) {
        return new Set(participants.map((p) => p._id));
      }
      const eliminated = getEliminatedEntryIds(currentRound);
      const eligible = new Set<string>();
      for (const participant of participants) {
        if (!eliminated.has(participant._id)) {
          eligible.add(participant._id);
        }
      }
      return eligible;
    }
  }, [isDoubles, currentRound, pairs, participants, getEliminatedEntryIds]);

  const eligibleIds = getEligibleIds();

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

  // Get used IDs in current matchups (excluding a specific match)
  const getUsedIds = (excludeMatchIndex?: number): Set<string> => {
    const used = new Set<string>();
    matchups.forEach((matchup, idx) => {
      if (idx === excludeMatchIndex) return;
      if (matchup.participant1) used.add(matchup.participant1);
      if (matchup.participant2) used.add(matchup.participant2);
    });
    return used;
  };

  const getAvailableParticipants = (excludeMatchIndex?: number): Participant[] => {
    const used = getUsedIds(excludeMatchIndex);
    return participants.filter(
      (p) => {
        // Must not be used in another match
        if (used.has(p._id)) return false;
        // Must be eligible (not eliminated)
        if (!eligibleIds.has(p._id)) return false;
        // For hybrid tournaments, must be qualified (if qualifiedParticipantIds is provided)
        if (qualifiedParticipantIds && !qualifiedParticipantIds.has(p._id)) return false;
        return true;
      }
    );
  };

  const getAvailablePairs = (excludeMatchIndex?: number): DoublesPairData[] => {
    const used = getUsedIds(excludeMatchIndex);
    return pairs.filter(
      (pair) => !used.has(pair._id) && eligibleIds.has(pair._id)
    );
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

  const handlePairsChange = (newPairs: DoublesPairData[]) => {
    setPairs(newPairs);
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

    // For doubles Round 1, validate pairs are created
    if (isDoubles && currentRound === 1) {
      const requiredPairs = Math.floor(participants.length / 2);
      if (pairs.length < requiredPairs) {
        toast.error(`Please create all ${requiredPairs} pairs before saving`);
        return;
      }
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
            // For doubles, include pairs data
            ...(isDoubles && currentRound === 1 && {
              doublesPairs: pairs.map(p => ({
                _id: p._id,
                player1: p.player1._id,
                player2: p.player2._id,
              })),
            }),
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

  const usedIds = getUsedIds();
  const eliminatedIds = getEliminatedEntryIds(currentRound);

  // Get unmatched eligible entries
  const unmatchedEligiblePairs = isDoubles
    ? pairs.filter((pair) => !usedIds.has(pair._id) && eligibleIds.has(pair._id))
    : [];
  const unmatchedEligibleParticipants = !isDoubles
    ? participants.filter((p) => !usedIds.has(p._id) && eligibleIds.has(p._id))
    : [];

  // Get eliminated entries
  const eliminatedPairs = isDoubles
    ? pairs.filter((pair) => eliminatedIds.has(pair._id))
    : [];
  const eliminatedParticipants = !isDoubles
    ? participants.filter((p) => eliminatedIds.has(p._id))
    : [];

  const isValid = matchups.every(
    (matchup) => matchup.participant1 && matchup.participant2
  );

  // For doubles Round 1, check if pairs are ready
  const pairsReady = !isDoubles || currentRound > 1 || pairs.length >= matchups.length * 2;

  // Show pair builder for doubles Round 1 if pairs not created yet
  if (isDoubles && currentRound === 1 && showPairBuilder && pairs.length < Math.floor(participants.length / 2)) {
    return (
      <div className="space-y-4">
        <DoublesPairBuilder
          participants={participants}
          existingPairs={pairs}
          onPairsChange={handlePairsChange}
        />
        
        {pairs.length >= Math.floor(participants.length / 2) && (
          <Button
            onClick={() => setShowPairBuilder(false)}
            className="w-full"
            size="lg"
          >
            <Check className="w-4 h-4 mr-2" />
            Continue to Match Configuration
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {currentRoundData.roundName}
            </h3>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Round {currentRound} - Configure {matchups.length} match
              {matchups.length !== 1 ? "es" : ""}
            </p>
          </div>
          <Badge variant="outline" className="text-xs rounded-full">
            {matchups.filter((m) => m.participant1 && m.participant2).length}/
            {matchups.length} Complete
          </Badge>
        </div>
      </header>

      {/* Show pairs summary for doubles */}
      {isDoubles && pairs.length > 0 && (
        <Card className="bg-indigo-50/50 border-indigo-200">
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">
                {pairs.length} Doubles Pairs Created
              </span>
              {currentRound === 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPairBuilder(true)}
                  className="text-xs h-7"
                >
                  Edit Pairs
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matchups List */}
      <div className="space-y-3">
        <AnimatePresence>
          {matchups.map((matchup, index) => {
            // For singles, get individual participants
            const p1 = !isDoubles && matchup.participant1
              ? getParticipantById(matchup.participant1)
              : undefined;
            const p2 = !isDoubles && matchup.participant2
              ? getParticipantById(matchup.participant2)
              : undefined;

            // For doubles, get pairs
            const pair1 = isDoubles && matchup.participant1
              ? getPairById(matchup.participant1)
              : undefined;
            const pair2 = isDoubles && matchup.participant2
              ? getPairById(matchup.participant2)
              : undefined;

            // Get available options based on match type
            const availableForMatch = isDoubles
              ? getAvailablePairs(index)
              : getAvailableParticipants(index);

            // Prepare available options for each side
            let availableForP1 = matchup.participant2
              ? availableForMatch.filter((item: any) =>
                  isDoubles ? item._id !== matchup.participant2 : item._id !== matchup.participant2
                )
              : availableForMatch;
            let availableForP2 = matchup.participant1
              ? availableForMatch.filter((item: any) =>
                  isDoubles ? item._id !== matchup.participant1 : item._id !== matchup.participant1
                )
              : availableForMatch;

            // Add current selections to available options if not already there
            if (isDoubles) {
              if (pair1 && !availableForP1.find((item: any) => item._id === pair1._id)) {
                availableForP1 = [pair1 as any, ...availableForP1];
              }
              if (pair2 && !availableForP2.find((item: any) => item._id === pair2._id)) {
                availableForP2 = [pair2 as any, ...availableForP2];
              }
            } else {
              if (p1 && !availableForP1.find((item: any) => item._id === p1._id)) {
                availableForP1 = [p1 as any, ...availableForP1];
              }
              if (p2 && !availableForP2.find((item: any) => item._id === p2._id)) {
                availableForP2 = [p2 as any, ...availableForP2];
              }
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
                      <div className="shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-sm">
                          {matchup.matchNumber}
                        </div>
                      </div>

                      {/* Entry 1 */}
                      <div className="flex-1 min-w-50">
                        <Select
                          value={matchup.participant1 || ""}
                          onValueChange={(value) =>
                            updateMatchupParticipant(index, "participant1", value)
                          }
                        >
                          <SelectTrigger className={isDoubles ? "h-auto min-h-15 py-2" : "h-11 w-full"}>
                            <SelectValue placeholder={isDoubles ? "Select pair" : "Select player"}>
                              {isDoubles && pair1 ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5 shrink-0">
                                      <AvatarImage src={pair1.player1.profileImage} />
                                      <AvatarFallback className="text-[10px]">
                                        {(pair1.player1.fullName || pair1.player1.username).substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium">
                                      {pair1.player1.fullName || pair1.player1.username}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5 shrink-0">
                                    <AvatarImage src={pair1.player2.profileImage} />
                                    <AvatarFallback className="text-[10px]">
                                      {(pair1.player2.fullName || pair1.player2.username).substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">
                                    {pair1.player2.fullName || pair1.player2.username}
                                  </span>
                                  </div>
                                </div>
                              ) : !isDoubles && p1 ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6 shrink-0">
                                    <AvatarImage src={p1.profileImage} />
                                    <AvatarFallback className="text-xs">
                                      {(p1.fullName || p1.username).substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium truncate">
                                    {p1.fullName || p1.username}
                                  </span>
                                </div>
                              ) : (
                                <span>{isDoubles ? "Select pair" : "Select player"}</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableForP1.length > 0 ? (
                              availableForP1.map((item: any) => {
                                const isQualified = qualifiedParticipantIds 
                                  ? qualifiedParticipantIds.has(item._id || (item.player1?._id && item.player2?._id ? item._id : item.player1?._id))
                                  : true; // If no qualifiedParticipantIds provided, assume all are qualified (pure knockout)
                                
                                return (
                                  <SelectItem
                                    key={item._id}
                                    value={item._id}
                                  >
                                    {isDoubles ? (
                                      <div className="flex items-center gap-2 flex-wrap py-1">
                                        <Avatar className="w-5 h-5 shrink-0">
                                          <AvatarImage src={item.player1?.profileImage} />
                                          <AvatarFallback className="text-[10px]">
                                            {(item.player1?.fullName || item.player1?.username || "").substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs">
                                          {item.player1?.fullName || item.player1?.username}
                                        </span>
                                        <span className="text-xs text-muted-foreground">&</span>
                                        <Avatar className="w-5 h-5 shrink-0">
                                          <AvatarImage src={item.player2?.profileImage} />
                                          <AvatarFallback className="text-[10px]">
                                            {(item.player2?.fullName || item.player2?.username || "").substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs">
                                          {item.player2?.fullName || item.player2?.username}
                                        </span>
                                        {qualifiedParticipantIds && (
                                          <Badge variant={isQualified ? "default" : "destructive"} className="ml-auto text-[10px]">
                                            {isQualified ? "Qualified" : "Eliminated"}
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6 shrink-0">
                                          <AvatarImage src={item.profileImage} />
                                          <AvatarFallback className="text-xs">
                                            {(item.fullName || item.username).substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">
                                          {item.fullName || item.username}
                                        </span>
                                        {qualifiedParticipantIds && (
                                          <Badge variant={isQualified ? "default" : "destructive"} className="ml-auto text-[10px]">
                                            {isQualified ? "Qualified" : "Eliminated"}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                No available {isDoubles ? "pairs" : "players"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* VS Divider */}
                      <div className="shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          VS
                        </span>
                      </div>

                      {/* Entry 2 */}
                      <div className="flex-1 min-w-50">
                        <Select
                          value={matchup.participant2 || ""}
                          onValueChange={(value) =>
                            updateMatchupParticipant(index, "participant2", value)
                          }
                        >
                          <SelectTrigger className={isDoubles ? "h-auto min-h-15 py-2" : "h-11 w-full"}>
                            <SelectValue placeholder={isDoubles ? "Select pair" : "Select player"}>
                              {isDoubles && pair2 ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5 shrink-0">
                                    <AvatarImage src={pair2.player1.profileImage} />
                                    <AvatarFallback className="text-[10px]">
                                      {(pair2.player1.fullName || pair2.player1.username).substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">
                                    {pair2.player1.fullName || pair2.player1.username}
                                  </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5 shrink-0">
                                    <AvatarImage src={pair2.player2.profileImage} />
                                    <AvatarFallback className="text-[10px]">
                                      {(pair2.player2.fullName || pair2.player2.username).substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">
                                    {pair2.player2.fullName || pair2.player2.username}
                                  </span>
                                  </div>
                                </div>
                              ) : !isDoubles && p2 ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6 shrink-0">
                                    <AvatarImage src={p2.profileImage} />
                                    <AvatarFallback className="text-xs">
                                      {(p2.fullName || p2.username).substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium truncate">
                                    {p2.fullName || p2.username}
                                  </span>
                                </div>
                              ) : (
                                <span>{isDoubles ? "Select pair" : "Select player"}</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableForP2.length > 0 ? (
                              availableForP2.map((item: any) => {
                                const isQualified = qualifiedParticipantIds 
                                  ? qualifiedParticipantIds.has(item._id || (item.player1?._id && item.player2?._id ? item._id : item.player1?._id))
                                  : true; // If no qualifiedParticipantIds provided, assume all are qualified (pure knockout)
                                
                                return (
                                  <SelectItem
                                    key={item._id}
                                    value={item._id}
                                  >
                                    {isDoubles ? (
                                      <div className="flex items-center gap-2 flex-wrap py-1">
                                        <Avatar className="w-5 h-5 shrink-0">
                                          <AvatarImage src={item.player1?.profileImage} />
                                          <AvatarFallback className="text-[10px]">
                                            {(item.player1?.fullName || item.player1?.username || "").substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs">
                                          {item.player1?.fullName || item.player1?.username}
                                        </span>
                                        <span className="text-xs text-muted-foreground">&</span>
                                        <Avatar className="w-5 h-5 shrink-0">
                                          <AvatarImage src={item.player2?.profileImage} />
                                          <AvatarFallback className="text-[10px]">
                                            {(item.player2?.fullName || item.player2?.username || "").substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs">
                                          {item.player2?.fullName || item.player2?.username}
                                        </span>
                                        {qualifiedParticipantIds && (
                                          <Badge variant={isQualified ? "default" : "destructive"} className="ml-auto text-[10px]">
                                            {isQualified ? "Qualified" : "Eliminated"}
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6 shrink-0">
                                          <AvatarImage src={item.profileImage} />
                                          <AvatarFallback className="text-xs">
                                            {(item.fullName || item.username).substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">
                                          {item.fullName || item.username}
                                        </span>
                                        {qualifiedParticipantIds && (
                                          <Badge variant={isQualified ? "default" : "destructive"} className="ml-auto text-[10px]">
                                            {isQualified ? "Qualified" : "Eliminated"}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                No available {isDoubles ? "pairs" : "players"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Icon */}
                      <div className="shrink-0">
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

      {/* Unmatched Eligible Participants (Singles) */}
      {!isDoubles && unmatchedEligibleParticipants.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-2">
                  Unmatched Eligible Participants ({unmatchedEligibleParticipants.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {unmatchedEligibleParticipants.map((participant) => (
                    <Badge key={participant._id} variant="outline" className="bg-white">
                      <Avatar className="w-4 h-4 mr-1.5">
                        <AvatarImage src={participant.profileImage} />
                        <AvatarFallback className="text-[8px]">
                          {(participant.fullName || participant.username).substring(0, 2).toUpperCase()}
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
      )}

      {/* Eliminated sections - only show for rounds > 1 */}
      {isDoubles && eliminatedPairs.length > 0 && currentRound > 1 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-1">
                  Eliminated Pairs ({eliminatedPairs.length})
                </h4>
                <p className="text-xs text-red-700 mb-2">
                  These pairs lost in previous rounds
                </p>
                <div className="flex flex-wrap gap-2">
                  {eliminatedPairs.map((pair) => (
                    <Badge key={pair._id} variant="outline" className="bg-white opacity-60 py-1.5 px-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{pair.player1.fullName || pair.player1.username}</span>
                        <span className="text-xs text-muted-foreground mx-0.5">&</span>
                        <span className="text-xs">{pair.player2.fullName || pair.player2.username}</span>
                      </div>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isDoubles && eliminatedParticipants.length > 0 && currentRound > 1 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-1">
                  Eliminated Participants ({eliminatedParticipants.length})
                </h4>
                <p className="text-xs text-red-700 mb-2">
                  These participants lost in previous rounds
                </p>
                <div className="flex flex-wrap gap-2">
                  {eliminatedParticipants.map((participant) => (
                    <Badge key={participant._id} variant="outline" className="bg-white opacity-60">
                      {participant.fullName || participant.username}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      {matchups.length > 0 && (
          <div className="px-4">
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
            </div>
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
