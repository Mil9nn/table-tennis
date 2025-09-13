import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTennisStore } from "@/hooks/useTennisStore";
import { shotCategories } from "@/constants/constants";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface RecentShot {
  shotName: string;
  playerName: string;
  playerId: string;
  timestamp: number;
  gameNumber: number;
}

const ShotSelector = () => {
  const recentShots = useTennisStore((state) => state.recentShots);
  const setRecentShots = useTennisStore((state) => state.setRecentShots);

  const {
    currentMatch,
    players,
    shotPicker,
    setShotPicker,
    handleShotSelect,
  } = useTennisStore();

  const enhancedHandleShotSelect = (shotName: string) => {
    handleShotSelect(shotName);

    // Add to recent shots immediately for instant feedback
    if (shotPicker.playerId) {
      const player = players[shotPicker.playerId];
      if (player) {
        const newShot: RecentShot = {
          shotName,
          playerName: player.displayName,
          playerId: shotPicker.playerId,
          timestamp: Date.now(),
          gameNumber: (currentMatch?.games.length || 0) + 1,
        };

        setRecentShots([newShot, ...recentShots.slice(0, 4)]);
      }
    }
  };

  return (
    <div>
      <Dialog
        open={shotPicker.open}
        onOpenChange={(open) => setShotPicker({ ...shotPicker, open })}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>Select Point Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Special Shots */}
            <div className="flex items-center gap-6">
              {shotCategories.special.map((shot) => (
                <Button
                  key={shot}
                  variant="outline"
                  className="justify-start hover:bg-purple-50"
                  onClick={() => enhancedHandleShotSelect(shot)}
                >
                  {shot}
                </Button>
              ))}
            </div>

            {/* Traditional Shots */}
            <div className="space-y-4">
              <h2 className="font-semibold mb-2 text-gray-700">Shot Type</h2>
              <div className="space-y-6">
                {Object.entries(shotCategories.traditional).map(
                  ([section, shots]) => (
                    <div key={section}>
                      <h3 className="text-sm font-medium text-purple-700 mb-2">
                        {section}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {shots.map((shot) => (
                          <button
                            key={shot}
                            className="flex flex-col items-center justify-center text-sm hover:shadow-md shadow-black/50 rounded-xl"
                            onClick={() => enhancedHandleShotSelect(shot)}
                          >
                            <Image
                              src={`/${shot}.png`}
                              alt={shot}
                              width={100}
                              height={100}
                            />
                            {shot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShotSelector;
