"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTennisStore } from "@/hooks/useTennisStore";

export default function MatchHeader() {
  const router = useRouter();

  const currentMatch = useTennisStore((s) => s.currentMatch);
  const bestOf = useTennisStore((s) => s.bestOf);
  const category = useTennisStore((s) => s.category);
  const playerOrder = useTennisStore((s) => s.playerOrder);
  const gameState = useTennisStore((s) => s.gameState);

  const isDoubles = category === "doubles";
  const gamesNeededToWin = Math.ceil(bestOf / 2);
  const gameNumber = (currentMatch?.games.length || 0) + 1;

  return (
    <div className="mb-6 p-4">
      <Link href="/match">
        <Button variant="outline" size="sm" className="p-2 mr-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </Link>

      <div className="flex items-center mb-2 py-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {currentMatch ? (
              isDoubles ? (
                <span>Match • Doubles</span>
              ) : (
                <span>Match • Singles</span>
              )
            ) : (
              "Match"
            )}
          </h1>
          <p className="text-gray-600">
            Best of {bestOf} • {isDoubles ? "Doubles" : "Singles"} •{" "}
            <span className="text-purple-500 font-semibold rounded-full text-sm px-2 py-1">
              Game {gameNumber}
            </span>
          </p>
          <p className="text-sm text-gray-500 font-semibold">First to {gamesNeededToWin} games wins</p>
        </div>
        {/* Keep End Match control in PlayMatchPage or a MatchControls component */}
      </div>
    </div>
  );
}
