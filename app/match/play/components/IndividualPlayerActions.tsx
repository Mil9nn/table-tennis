"use client";
import { Button } from "@/components/ui/button";
import { useTennisStore } from "@/hooks/useTennisStore";
import { Player } from "../../play/types";

interface Props {
  team1: (Player | null)[];
  team2: (Player | null)[];
}

export default function IndividualPlayerActions({ team1, team2 }: Props) {
  const setShotPicker = useTennisStore((s) => s.setShotPicker);

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-3 text-center">Individual Player Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 text-center">Team 1</h4>
          <div className="flex gap-2">
            {team1.map((p, i) => (
              <Button
                key={p?.userId ?? i}
                onClick={() => p && setShotPicker({ playerId: p.userId, open: true })}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                {p ? p.displayName : "—"}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 text-center">Team 2</h4>
          <div className="flex gap-2">
            {team2.map((p, i) => (
              <Button
                key={p?.userId ?? i}
                onClick={() => p && setShotPicker({ playerId: p.userId, open: true })}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                {p ? p.displayName : "—"}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
