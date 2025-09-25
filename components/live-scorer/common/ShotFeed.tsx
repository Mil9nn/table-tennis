"use client";

import { Shot } from "@/types/shot.type";

interface ShotFeedProps {
  games: { gameNumber: number; shots: Shot[] }[];
  currentGame: number;
  participants: { _id: string; fullName?: string; username?: string }[];
}

function formatShotType(stroke?: string | null) {
  if (!stroke) return "—"; // fallback when no stroke recorded
  return stroke
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
      <h3 className="font-semibold">Rally Feed</h3>
      <ul className="space-y-1 p-2 border-2 max-h-60 overflow-y-auto pr-2">
        {shots.map((shot, i) => {
          const player = participants.find((p) => p._id === shot.player._id);
          const playerName =
            player?.fullName ||
            player?.username ||
            shot.player.fullName ||
            shot.player.username ||
            "Unknown Player";

          let displayText: string;
          let outcomeClass = "";

          if (shot.outcome === "error") {
            displayText = `${shot.errorType || "Unforced"}`;
          } else if (shot.outcome === "winner") {
            displayText = `${formatShotType(shot.stroke)}`;
          } else {
            // Normal rally shot (no direct winner/error yet)
            displayText = formatShotType(shot.stroke);
            outcomeClass = "text-gray-600";
          }

          return (
            <li
              key={shot._id ?? i}
              className="text-sm w-full p-2 flex justify-between items-center border-b last:border-0"
            >
              <span className="">
                <strong>{playerName}</strong> ({shot.side}) → {displayText}
              </span>
              <span className={`font-semibold ${outcomeClass}`}>
                {shot.outcome.charAt(0).toUpperCase() + shot.outcome.slice(1)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
