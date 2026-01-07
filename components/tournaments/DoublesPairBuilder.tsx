"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Check, AlertCircle, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Participant as TournamentParticipant,
  getParticipantDisplayName,
  getParticipantImage,
  isUserParticipant
} from "@/types/tournament.type";

export interface DoublesPairData {
  _id: string;
  player1: TournamentParticipant;
  player2: TournamentParticipant;
}

interface DoublesPairBuilderProps {
  participants: TournamentParticipant[];
  existingPairs?: DoublesPairData[];
  onPairsChange: (pairs: DoublesPairData[]) => void;
  disabled?: boolean;
}

/**
 * Component for creating and managing doubles pairs
 * Used in Round 1 of doubles knockout tournaments with custom matching
 */
export default function DoublesPairBuilder({
  participants,
  existingPairs = [],
  onPairsChange,
  disabled = false,
}: DoublesPairBuilderProps) {
  const [pairs, setPairs] = useState<DoublesPairData[]>(existingPairs);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Get all players that are already in a pair
  const pairedPlayerIds = new Set(
    pairs.flatMap((pair) => [pair.player1._id, pair.player2._id])
  );

  // Get unpaired players
  const unpairedPlayers = participants.filter(
    (p) => !pairedPlayerIds.has(p._id)
  );

  // Notify parent when pairs change
  useEffect(() => {
    onPairsChange(pairs);
  }, [pairs, onPairsChange]);

  // Initialize with existing pairs
  useEffect(() => {
    if (existingPairs.length > 0) {
      setPairs(existingPairs);
    }
  }, [existingPairs]);

  const togglePlayerSelection = (playerId: string) => {
    if (disabled) return;

    setSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      if (prev.length >= 2) {
        // Replace first selection
        return [prev[1], playerId];
      }
      return [...prev, playerId];
    });
  };

  const createPair = () => {
    if (selectedPlayers.length !== 2) {
      toast.error("Select exactly 2 players to create a pair");
      return;
    }

    const player1 = participants.find((p) => p._id === selectedPlayers[0]);
    const player2 = participants.find((p) => p._id === selectedPlayers[1]);

    if (!player1 || !player2) {
      toast.error("Invalid player selection");
      return;
    }

    const newPair: DoublesPairData = {
      _id: `pair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      player1,
      player2,
    };

    setPairs((prev) => [...prev, newPair]);
    setSelectedPlayers([]);
    toast.success("Pair created!");
  };

  const removePair = (pairId: string) => {
    if (disabled) return;
    setPairs((prev) => prev.filter((p) => p._id !== pairId));
    toast.info("Pair removed");
  };

  const autoGeneratePairs = () => {
    if (disabled) return;
    if (unpairedPlayers.length < 2) {
      toast.error("Not enough unpaired players");
      return;
    }

    // Shuffle unpaired players and create pairs
    const shuffled = [...unpairedPlayers].sort(() => Math.random() - 0.5);
    const newPairs: DoublesPairData[] = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newPairs.push({
        _id: `pair-${Date.now()}-${i}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        player1: shuffled[i],
        player2: shuffled[i + 1],
      });
    }

    setPairs((prev) => [...prev, ...newPairs]);
    setSelectedPlayers([]);
    toast.success(`Created ${newPairs.length} pairs automatically`);
  };

  const isSelected = (playerId: string) => selectedPlayers.includes(playerId);
  const isComplete = unpairedPlayers.length === 0;
  const hasOddPlayers = participants.length % 2 !== 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Doubles pairs
          </h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {pairs.length} pairs / {Math.floor(participants.length / 2)} needed
        </Badge>
      </div>

      {/* Warning for odd players */}
      {hasOddPlayers && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent>
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                You have an odd number of players ({participants.length}). Please add or remove one player.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Created Pairs */}
      {pairs.length > 0 && (
        <Card>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AnimatePresence>
                {pairs.map((pair, index) => (
                  <motion.div
                    key={pair._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 text-xs"
                    >
                      {index + 1}
                    </Badge>
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={getParticipantImage(pair.player1)} />
                        <AvatarFallback className="text-[10px]">
                          {getParticipantDisplayName(pair.player1)
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate">
                        {getParticipantDisplayName(pair.player1)}
                      </span>
                      <span className="text-xs text-muted-foreground">&</span>
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={getParticipantImage(pair.player2)} />
                        <AvatarFallback className="text-[10px]">
                          {getParticipantDisplayName(pair.player2)
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate">
                        {getParticipantDisplayName(pair.player2)}
                      </span>
                    </div>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100"
                        onClick={() => removePair(pair._id)}
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unpaired Players */}
      {unpairedPlayers.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Unpaired Players ({unpairedPlayers.length})
              </CardTitle>
              {unpairedPlayers.length >= 2 && !disabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoGeneratePairs}
                  className="h-7 text-xs"
                >
                  <Shuffle className="w-3 h-3 mr-1" />
                  Auto-pair remaining
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Select 2 players to create a pair
            </p>
            <div className="flex flex-wrap gap-2">
              {unpairedPlayers.map((player) => (
                <motion.button
                  key={player._id}
                  onClick={() => togglePlayerSelection(player._id)}
                  disabled={disabled}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                    ${
                      isSelected(player._id)
                        ? "border-indigo-400 ring-1 ring-indigo-200"
                        : "bg-white border-slate-200 hover:border-indigo-300"
                    }
                    ${
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  `}
                  whileTap={{ scale: disabled ? 1 : 0.98 }}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={getParticipantImage(player)} />
                    <AvatarFallback className="text-[10px]">
                      {getParticipantDisplayName(player)
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {getParticipantDisplayName(player)}
                  </span>
                  {isSelected(player._id) && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Pair Button */}
      {selectedPlayers.length === 2 && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button onClick={createPair} className="w-full" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Pair
          </Button>
        </motion.div>
      )}
    </div>
  );
}
