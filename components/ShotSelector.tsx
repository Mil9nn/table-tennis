import React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import Image from "next/image";
import { shotCategories } from "@/constants/constants";
import { useMatchStore } from "@/hooks/useMatchStore";

const ShotSelector = () => {
  const shotDialogOpen = useMatchStore((state) => state.shotDialogOpen);
  const setShotDialogOpen = useMatchStore((state) => state.setShotDialogOpen);
  const updateScore = useMatchStore((state) => state.updateScore);
  const pendingPlayer = useMatchStore((state) => state.pendingPlayer);
  const setPendingPlayer = useMatchStore((state) => state.setPendingPlayer);

  return (
    <Dialog open={shotDialogOpen} onOpenChange={setShotDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Shot Type</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-96">
          <div className="space-y-4">
            {Object.entries(shotCategories).map(([category, shots]) => (
              <div key={category}>
                <h3 className="font-medium capitalize mb-2">{category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {shots.map((shot) => (
                    <button
                      key={shot.value}
                      onClick={() => {
                        if (pendingPlayer) {
                          // directly call updateScore with shot
                          updateScore(pendingPlayer, 1, shot.value);
                          setPendingPlayer(null);
                        }
                        setShotDialogOpen(false);
                      }}
                      className="flex flex-col items-center border-2 rounded-xl hover:scale-[1.02] active:scale-[0.97] transition ease-in-out"
                    >
                      <Image
                        src="/Backhand Block.png"
                        alt=""
                        width={100}
                        height={100}
                      />
                      {shot.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ShotSelector;
