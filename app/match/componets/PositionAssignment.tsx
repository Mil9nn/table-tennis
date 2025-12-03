"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface Player {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    username: string;
    profileImage?: string;
  };
}

interface PositionAssignmentProps {
  teamName: string;
  players: Player[];
  positions: string[];
  assignments: Record<string, string>; // playerId -> position
  onAssignmentChange: (playerId: string, position: string | null) => void;
}

export default function PositionAssignment({
  teamName,
  players,
  positions,
  assignments,
  onAssignmentChange,
}: PositionAssignmentProps) {
  // Get available positions for a specific player
  const getAvailablePositions = (currentPlayerId: string) => {
    const assignedPositions = new Set(
      Object.entries(assignments)
        .filter(([playerId]) => playerId !== currentPlayerId)
        .map(([_, position]) => position)
    );

    return positions.filter(pos => !assignedPositions.has(pos));
  };

  const getCurrentPosition = (playerId: string) => {
    return assignments[playerId] || "";
  };

  // Check if all required positions are assigned
  const allPositionsAssigned = positions.every(pos =>
    Object.values(assignments).includes(pos)
  );

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-2">
        <div className="">
          <h4 className="font-medium text-sm">{teamName} - Position Assignment</h4>
          {!allPositionsAssigned && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="w-3 h-3" />
              <span>Assign all positions</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {players.map((player) => {
          const playerId = player.user._id;
          const availablePositions = getAvailablePositions(playerId);
          const currentPosition = getCurrentPosition(playerId);

          return (
            <div
              key={playerId}
              className="flex items-center justify-between gap-3 p-2 bg-background rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {player.user.fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{player.user.username}
                </p>
              </div>

              <Select
                value={currentPosition}
                onValueChange={(value) => {
                  onAssignmentChange(playerId, value === "unassigned" ? null : value);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None</SelectItem>
                  {/* Show current position even if "taken" */}
                  {currentPosition && !availablePositions.includes(currentPosition) && (
                    <SelectItem value={currentPosition}>{currentPosition}</SelectItem>
                  )}
                  {availablePositions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          No players in this team
        </div>
      )}
    </div>
  );
}
