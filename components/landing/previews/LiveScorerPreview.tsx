"use client";

import { ArrowRightLeft, RotateCcw, Undo2 } from "lucide-react";
import { MOCK_SCORER } from "@/lib/landing/mockShowcase";
import { AppPreviewFrame } from "./AppPreviewFrame";
import { cn } from "@/lib/utils";

function PlayerPanel({
  name,
  initials,
  score,
  serving,
  accent,
}: {
  name: string;
  initials: string;
  score: number;
  serving?: boolean;
  accent: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-1 flex-col justify-between border-[#E2E8F0] bg-[#F1F5F9] px-4 py-5",
        accent === "left" ? "border-r border-t-4 border-t-[#4F46E5]" : "border-t-4 border-t-[#EF4444]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full border-2 border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#4B5563]">
          {initials}
        </div>
        <div>
          <p className="text-xs font-semibold text-[#111827]">{name}</p>
          {serving ? (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F59E0B]">
              Serving
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-center py-2">
        <span className="text-[3.5rem] font-extrabold leading-none tracking-tighter text-[#111827] tabular-nums">
          {score}
        </span>
        <span className="mt-1 text-[10px] font-medium text-[#6B7280]">
          Tap to add point
        </span>
      </div>
    </div>
  );
}

export function LiveScorerPreview() {
  const { player1, player2, side1Score, side2Score, games, currentGame } =
    MOCK_SCORER;

  return (
    <AppPreviewFrame title="Live Scorer" subtitle="Singles · Round of 16">
      <div className="bg-gradient-to-br from-[#10B9811A] via-white to-[#EF44441A]">
        <div className="flex">
          <PlayerPanel
            name={player1.name}
            initials={player1.initials}
            score={side1Score}
            serving
            accent="left"
          />
          <PlayerPanel
            name={player2.name}
            initials={player2.initials}
            score={side2Score}
            accent="right"
          />
        </div>
      </div>

      <div className="flex justify-between gap-2 bg-white px-3 py-4">
        {[
          { icon: Undo2, label: "Undo", className: "bg-[#10B98150] text-[#0F766E]" },
          { icon: ArrowRightLeft, label: "Swap", className: "bg-[#F8FAFC] text-[#475569]" },
          { icon: RotateCcw, label: "Reset", className: "bg-[#EF444450] text-[#B91C1C]" },
        ].map(({ icon: Icon, label, className }) => (
          <div
            key={label}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[10px] font-medium uppercase shadow-sm",
              className
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </div>
        ))}
      </div>

      <div className="border-t border-[#E2E8F0] px-4 py-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-[#4B5563]">
          Games History
        </p>
        <div className="mb-2 grid grid-cols-3 text-center text-[10px] font-medium uppercase tracking-wide text-[#4B5563]">
          <span>Game</span>
          <span>{player1.name.split(" ")[0]}</span>
          <span>{player2.name.split(" ")[0]}</span>
        </div>
        <div className="space-y-2">
          {games.map((game) => {
            const isCurrent =
              game.gameNumber === currentGame && !game.completed;
            return (
              <div
                key={game.gameNumber}
                className={cn(
                  "grid grid-cols-3 rounded-md px-2 py-2 text-center text-xs",
                  isCurrent ? "bg-[#3B82F630]" : "bg-white"
                )}
              >
                <span className="font-medium text-[#4B5563]">{game.gameNumber}</span>
                <span
                  className={cn(
                    "font-medium",
                    isCurrent ? "text-[#2563EB]" : "text-[#4B5563]"
                  )}
                >
                  {game.side1Score}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    isCurrent ? "text-[#2563EB]" : "text-[#4B5563]"
                  )}
                >
                  {game.side2Score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AppPreviewFrame>
  );
}
