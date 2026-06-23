"use client";

import React from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerSelectionStepProps {
  players: Array<{ _id: string; fullName?: string; username?: string; profileImage?: string } | string>;
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
}

export function PlayerSelectionStep({
  players,
  selectedPlayerId,
  onSelect,
}: PlayerSelectionStepProps) {
  const getPlayerInfo = (player: typeof players[0]) => {
    if (typeof player === "string") {
      return { id: player, name: player, image: undefined };
    }
    return {
      id: player._id,
      name: player.fullName || player.username || "Unknown",
      image: player.profileImage,
    };
  };

  // Get player initials
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get first name only (first part before space)
  const getFirstName = (name: string): string => {
    return name.split(" ")[0] || name;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {players.map((player) => {
          const { id, name, image } = getPlayerInfo(player);
          const isSelected = selectedPlayerId === id;
          const initials = getInitials(name);
          const displayName = getFirstName(name);

          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors text-left shrink-0",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                isSelected
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
              )}
            >
              <Avatar className="w-6 h-6 border border-gray-200 shrink-0">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback className={cn(
                  "text-[10px]",
                  isSelected ? "bg-blue-400 text-white" : "bg-gray-100 text-gray-600"
                )}>
                  {initials || <User className="w-3 h-3" />}
                </AvatarFallback>
              </Avatar>
              <span className={cn(
                "text-xs font-medium truncate",
                isSelected ? "text-white" : "text-gray-700"
              )}>
                {displayName}
              </span>
              {isSelected && (
                <svg
                  className="w-3 h-3 text-white shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


