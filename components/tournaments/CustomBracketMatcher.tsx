"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shuffle,
  Trash2,
  Check,
  AlertCircle,
  Plus,
} from "lucide-react";
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

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
  rank?: number;
  points?: number;
  groupId?: string;
}

interface CustomMatch {
  participant1: Participant | string | null;
  participant2: Participant | string | null;
}

interface CustomBracketMatcherProps {
  participants: Participant[];
  matches: CustomMatch[];
  onMatchesChange: (matches: CustomMatch[]) => void;
  onSave?: () => void;
  saving?: boolean;
  showGroupInfo?: boolean;
}

export default function CustomBracketMatcher({
  participants,
  matches,
  onMatchesChange,
  onSave,
  saving = false,
  showGroupInfo = false,
}: CustomBracketMatcherProps) {
  const getUsedParticipantIds = (): Set<string> => {
    const used = new Set<string>();
    matches.forEach((match) => {
      const p1Id =
        typeof match.participant1 === "string"
          ? match.participant1
          : match.participant1?._id;
      const p2Id =
        typeof match.participant2 === "string"
          ? match.participant2
          : match.participant2?._id;
      if (p1Id) used.add(p1Id);
      if (p2Id) used.add(p2Id);
    });
    return used;
  };

  const getAvailableParticipants = (excludeIndex?: number): Participant[] => {
    const used = new Set<string>();
    matches.forEach((match, idx) => {
      if (idx === excludeIndex) return;
      const p1Id =
        typeof match.participant1 === "string"
          ? match.participant1
          : match.participant1?._id;
      const p2Id =
        typeof match.participant2 === "string"
          ? match.participant2
          : match.participant2?._id;
      if (p1Id) used.add(p1Id);
      if (p2Id) used.add(p2Id);
    });
    return participants.filter((p) => !used.has(p._id));
  };

  const getParticipantById = (id: string): Participant | undefined => {
    return participants.find((p) => p._id === id);
  };

  const getParticipantFromSlot = (
    slot: Participant | string | null
  ): Participant | undefined => {
    if (!slot) return undefined;
    if (typeof slot === "string") {
      return getParticipantById(slot);
    }
    return slot;
  };

  const addMatch = () => {
    const available = getAvailableParticipants();
    if (available.length < 2) {
      return;
    }
    onMatchesChange([...matches, { participant1: null, participant2: null }]);
  };

  const removeMatch = (index: number) => {
    onMatchesChange(matches.filter((_, i) => i !== index));
  };

  const updateMatchParticipant = (
    matchIndex: number,
    slot: "participant1" | "participant2",
    participantId: string | null
  ) => {
    const newMatches = [...matches];
    newMatches[matchIndex] = {
      ...newMatches[matchIndex],
      [slot]: participantId,
    };
    onMatchesChange(newMatches);
  };

  const autoGenerateMatches = () => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const newMatches: CustomMatch[] = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newMatches.push({
        participant1: shuffled[i]._id,
        participant2: shuffled[i + 1]._id,
      });
    }

    onMatchesChange(newMatches);
  };

  const clearAllMatches = () => {
    onMatchesChange([]);
  };

  const usedParticipants = getUsedParticipantIds();
  const unmatchedParticipants = participants.filter(
    (p) => !usedParticipants.has(p._id)
  );

  const isValid = matches.every((match) => {
    const p1Id =
      typeof match.participant1 === "string"
        ? match.participant1
        : match.participant1?._id;
    const p2Id =
      typeof match.participant2 === "string"
        ? match.participant2
        : match.participant2?._id;
    return p1Id && p2Id;
  });

  const requiredMatches = Math.floor(participants.length / 2);
  const hasEnoughMatches = matches.length >= requiredMatches;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="space-y-2">
        <div>
          <h3 className="text-lg font-semibold">
            Bracket Matches
          </h3>
          <p className="text-sm mt-1">
            {matches.length} match{matches.length !== 1 ? "es" : ""} created
            {requiredMatches > 0 && ` • ${requiredMatches} required`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={autoGenerateMatches}
            disabled={participants.length < 2}
          >
            <Shuffle className="w-4 h-4" />
            Randomize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllMatches}
            disabled={matches.length === 0}
            className="bg-red-400 text-red-800"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            Clear
          </Button>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-2">
        <AnimatePresence>
          {matches.map((match, index) => {
            const p1 = getParticipantFromSlot(match.participant1);
            const p2 = getParticipantFromSlot(match.participant2);
            const p1Id =
              typeof match.participant1 === "string"
                ? match.participant1
                : match.participant1?._id;
            const p2Id =
              typeof match.participant2 === "string"
                ? match.participant2
                : match.participant2?._id;

            const availableForMatch = getAvailableParticipants(index);
            const availableForP1 = p2Id
              ? availableForMatch.filter((p) => p._id !== p2Id)
              : availableForMatch;
            const availableForP2 = p1Id
              ? availableForMatch.filter((p) => p._id !== p1Id)
              : availableForMatch;

            // Add current selections to available options
            if (p1 && !availableForP1.find((p) => p._id === p1._id)) {
              availableForP1.unshift(p1);
            }
            if (p2 && !availableForP2.find((p) => p._id === p2._id)) {
              availableForP2.unshift(p2);
            }

            const isComplete = p1Id && p2Id;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative flex gap-2 border rounded-lg p-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Match Number */}
                  <div className="flex-shrink-0 flex items-center justify-center sm:justify-start">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                  </div>

                  {/* Participant 1 */}
                  <div className="flex-1">
                    <Select
                      value={p1Id || ""}
                      onValueChange={(value) =>
                        updateMatchParticipant(index, "participant1", value)
                      }
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select player">
                          {p1 ? (
                            <div className="flex items-center gap-2 ">
                              <Avatar className="w-6 h-6 flex-shrink-0">
                                <AvatarImage src={p1.profileImage} />
                                <AvatarFallback className="text-xs">
                                  {(p1.fullName || p1.username)
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start  flex-1">
                                <span className="text-sm font-medium truncate w-full">
                                  {p1.fullName || p1.username}
                                </span>
                                {showGroupInfo && p1.groupId && (
                                  <span className="text-xs">
                                    Group {p1.groupId}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span>Select player</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="">
                        {availableForP1.length > 0 ? (
                          availableForP1.map((participant) => (
                            <SelectItem
                              key={participant._id}
                              value={participant._id}
                            >
                              <div className="flex items-center gap-2 ">
                                <Avatar className="w-6 h-6 flex-shrink-0">
                                  <AvatarImage src={participant.profileImage} />
                                  <AvatarFallback className="text-xs">
                                    {(
                                      participant.fullName ||
                                      participant.username
                                    )
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col  flex-1">
                                  <span className="truncate">
                                    {participant.fullName || participant.username}
                                  </span>
                                  {showGroupInfo && participant.groupId && (
                                    <span className="text-xs">
                                      Group {participant.groupId}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm">
                            No available players
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* VS Divider */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                      VS
                    </span>
                  </div>

                  {/* Participant 2 */}
                  <div className="flex-1 ">
                    <Select
                      value={p2Id || ""}
                      onValueChange={(value) =>
                        updateMatchParticipant(index, "participant2", value)
                      }
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select player">
                          {p2 ? (
                            <div className="flex items-center gap-2 ">
                              <Avatar className="w-6 h-6 flex-shrink-0">
                                <AvatarImage src={p2.profileImage} />
                                <AvatarFallback className="text-xs">
                                  {(p2.fullName || p2.username)
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start  flex-1">
                                <span className="text-sm font-medium truncate w-full">
                                  {p2.fullName || p2.username}
                                </span>
                                {showGroupInfo && p2.groupId && (
                                  <span className="text-xs">
                                    Group {p2.groupId}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span>Select player</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="">
                        {availableForP2.length > 0 ? (
                          availableForP2.map((participant) => (
                            <SelectItem
                              key={participant._id}
                              value={participant._id}
                            >
                              <div className="flex items-center gap-2 ">
                                <Avatar className="w-6 h-6 flex-shrink-0">
                                  <AvatarImage src={participant.profileImage} />
                                  <AvatarFallback className="text-xs">
                                    {(
                                      participant.fullName ||
                                      participant.username
                                    )
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col  flex-1">
                                  <span className="truncate">
                                    {participant.fullName || participant.username}
                                  </span>
                                  {showGroupInfo && participant.groupId && (
                                    <span className="text-xs">
                                      Group {participant.groupId}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm">
                            No available players
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remove Button */}
                  <div className="flex-shrink-0 flex items-center justify-center sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMatch(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Match Button */}
        {getAvailableParticipants().length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-2"
          >
             <Button
               variant="outline"
               onClick={addMatch}
               className="w-full border-dashed"
             >
               <Plus className="w-4 h-4 mr-2" />
               Add Match
             </Button>
          </motion.div>
        )}
      </div>

      {/* Unmatched Participants */}
      {unmatchedParticipants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">
                Unmatched Participants ({unmatchedParticipants.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {unmatchedParticipants.map((participant) => (
                  <Badge
                    key={participant._id}
                    variant="outline"
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
              {unmatchedParticipants.length === 1 && (
                <p className="text-xs mt-2">
                  This participant will receive a bye in the first round.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Validation Status */}
      {matches.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          {isValid && hasEnoughMatches ? (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>All matches are valid and ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>
                {!isValid
                  ? "Some matches are incomplete"
                  : !hasEnoughMatches
                  ? `Need at least ${requiredMatches} matches`
                  : "Please complete all matches"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {onSave && (
        <div className="pt-4 border-t">
          <Button
            onClick={onSave}
            disabled={saving || !isValid || !hasEnoughMatches}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                
                Save Bracket Configuration
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

