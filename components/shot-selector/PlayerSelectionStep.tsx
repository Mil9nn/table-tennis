"use client";

import React from "react";
import { motion } from "framer-motion";
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {players.map((player, index) => {
          const { id, name, image } = getPlayerInfo(player);
          const isSelected = selectedPlayerId === id;
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <motion.button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                "relative p-6 rounded-xl border-2 transition-all text-left",
                "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-300"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-gray-200">
                  <AvatarImage src={image} alt={name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {initials || <User className="w-6 h-6" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{name}</p>
                </div>
                {isSelected && (
                  <motion.div
                    className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <svg
                      className="w-4 h-4 text-white"
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
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}


