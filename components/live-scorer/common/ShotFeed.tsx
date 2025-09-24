"use client";

import { Shot } from "@/types/shot.type";

interface ShotFeedProps {
  games: { gameNumber: number; shots: Shot[] }[];
  currentGame: number;
  participants: { _id: string; fullName?: string; username?: string }[];
}

function formatShotType(shotType?: string | null) {
  if (!shotType) return "—"; // fallback when no stroke recorded
  return shotType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ShotFeed({
  games,
  currentGame,
  participants,
}: ShotFeedProps) {
  const currentGameObj = games?.find((g) => g.gameNumber === currentGame);
  const shots = currentGameObj?.shots || [];

  if (!shots.length) {
    return (
      <div className="text-center text-gray-500 italic mt-6">
        No rallies recorded yet...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold">Header text</h3>
      <ul className="space-y-1 max-h-48 overflow-y-auto pr-2">
        {shots.map((shot, i) => {
          const player = participants.find((p) => p._id === shot.player._id);
          const playerName =
            player?.fullName ||
            player?.username ||
            shot.player.fullName ||
            shot.player.username ||
            "Unknown Player";

          return (
            <li
              key={shot._id ?? i} // prefer shot._id, fallback to index
              className="text-sm w-full p-2 flex justify-between items-center"
            >
              <span>
                <strong>{playerName}</strong> ({shot.side}) →{" "}
                {formatShotType(shot.shotType)}
              </span>
              <span
                className={`font-semibold ${
                  shot.outcome === "winner"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {shot.outcome === "winner" ? "Winner" : "Error"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}