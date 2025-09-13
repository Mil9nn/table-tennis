"use client";
import { Button } from "@/components/ui/button";
import { Player } from "../../play/types";
import { useTennisStore } from "@/hooks/useTennisStore";

interface Props {
  representative: Player;
  partner?: Player | null;
  teamLabel?: string;
  highlightColor?: string; // optional styling hint
}

export default function TeamScoreCard({
  representative,
  partner,
  teamLabel = "Team",
  highlightColor,
}: Props) {
  const setShotPicker = useTennisStore((s) => s.setShotPicker);
  const bestOf = useTennisStore((s) => s.bestOf);
  const gamesNeededToWin = Math.ceil(bestOf / 2);

  if (!representative) return null;

  // Determine team gamesWon display - use representative.gamesWon
  return (
    <div className="shadow-md shadow-black/40 flex items-center">
      <div className="w-full">
        <div className="p-4">
          <h2 className="flex xs:flex-row flex-col space-y-2 xs:items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-lg font-semibold">{teamLabel}</span>
              {partner ? (
                <div className="text-sm py-2 text-gray-600">
                  <p>{representative.username}</p>
                  <p>{partner.username}</p>
                </div>
              ) : (
                <span className="text-xl font-semibold">
                  {representative.displayName}
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="bg-yellow-500 w-fit text-white px-3 py-1 rounded-full text-xs font-semibold">
                {representative.serving ? "Serving" : "Not serving"}
              </span>
              {partner && (
                <div className="text-xs text-gray-600 mt-1">
                  {representative.displayName}
                </div>
              )}
            </div>
          </h2>

          <div
            className="text-4xl font-bold mb-2"
            style={{ color: highlightColor || undefined }}
          >
            {representative.currentScore}
          </div>
          <p className="mb-4 text-gray-600">
            Games: {representative.gamesWon}/{gamesNeededToWin}
          </p>
        </div>

        <Button
          onClick={() =>
            setShotPicker({ playerId: representative.userId, open: true })
          }
          className="cursor-pointer py-10 w-full rounded-none text-white"
          style={{ backgroundColor: highlightColor }}
        >
          +1 Point
        </Button>
      </div>
    </div>
  );
}
