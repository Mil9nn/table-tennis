"use client";

import { AddPointPayload } from "@/types/match.type";
import Image from "next/image";
import { motion } from "framer-motion";
import { getInitials } from "@/lib/utils";

type PlayerInfo = {
  name: string;
  playerId?: string;
  serverKey?: string;
  profileImage?: string;
};

interface PlayerCardProps {
  players: PlayerInfo[];
  score: number;
  side: "side1" | "side2" | "team1" | "team2";
  onAddPoint: (payload: AddPointPayload) => void;
  setsWon: number;
  color?: "emerald" | "rose";
  disabled?: boolean;
  currentServer: string | null;
}

export default function PlayerCard({
  players,
  score,
  side,
  onAddPoint,
  setsWon,
  color = "emerald",
  disabled = false,
  currentServer,
}: PlayerCardProps) {
  
  // FIXED: Full Tailwind classes (no dynamic partials)
  const colors = {
    emerald: {
      gradient: "bg-[#3c6e71]",
      text: "text-slate-50",
      scoreText: "text-slate-100",
      badge: "bg-white/15 text-slate-100",
      server: "bg-amber-400",
    },
    rose: {
      gradient: "bg-[#284b63]",
      text: "text-slate-50",
      scoreText: "text-slate-100",
      badge: "bg-white/15 text-slate-100",
      server: "bg-amber-400",
    },
  };

  const isPlayerServing = (player: PlayerInfo) => {
    if (!currentServer || !player.serverKey) return false;
    return currentServer === player.serverKey;
  };

  const handleClick = () => {
    if (disabled) return;

    if (players.length === 1) {
      onAddPoint({ side, playerId: players[0]?.playerId });
    } else {
      onAddPoint({ side });
    }
  };

  return (
    <motion.div
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={handleClick}
      className={`
        relative h-full min-h-[280px] flex flex-col justify-between p-6 
        ${colors[color].gradient}
        shadow-2xl
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-3xl"}
        transition-all duration-300 backdrop-blur-sm
      `}
    >
      {/* Players Section */}
      <div className="flex flex-col gap-2 mb-4">
        {players.map((player, idx) => {
          const isServing = isPlayerServing(player);

          return (
            <div
              key={player.playerId ?? idx}
              className={`flex items-center gap-3 ${colors[color].text}`}
            >
              {/* Profile Image */}
              <div className="relative">
                {player.profileImage ? (
                  <Image
                    src={player.profileImage}
                    alt={player.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover ring-2 ring-white/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 
                    flex items-center justify-center font-bold text-sm ring-2 ring-white/30">
                    {getInitials(player.name)}
                  </div>
                )}

                {/* Serving Indicator */}
                {isServing && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute bottom-1 right-0 size-2 
                      ${colors[color].server}
                      rounded-full ring-2 ring-white`}
                  ></motion.div>
                )}
              </div>

              {/* Player Name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm md:text-base truncate tracking-tight">
                  {player.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Display */}
      <div className="flex-1 flex items-center justify-center my-6">
        <motion.div
          key={score}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`font-black tracking-tighter ${colors[color].scoreText}
            text-[4.5rem] sm:text-[6rem] md:text-[8rem] leading-none drop-shadow-2xl`}
        >
          {score}
        </motion.div>
      </div>
    </motion.div>
  );
}