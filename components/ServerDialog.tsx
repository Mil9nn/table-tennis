"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMatchStore } from "@/hooks/useMatchStore";
import type { PlayerKey, DoublesPlayerKey } from "@/components/live-scorer/individual/helpers";

interface InitialServerDialogProps {
  matchType: "singles" | "doubles" | "mixed_doubles";
  participants: any[];
}

export default function InitialServerDialog({ matchType, participants }: InitialServerDialogProps) {
  const open = useMatchStore((s) => s.serverDialogOpen);
  const setOpen = useMatchStore((s) => s.setServerDialogOpen);
  const match = useMatchStore((s) => s.match);
  const setMatch = useMatchStore((s) => s.setMatch);

  const [firstServer, setFirstServer] = useState<PlayerKey | DoublesPlayerKey | null>(null);
  const [firstReceiver, setFirstReceiver] = useState<DoublesPlayerKey | null>(null);

  useEffect(() => {
    if (!open) {
      setFirstServer(null);
      setFirstReceiver(null);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!match) return;

    const updatedMatch = {
      ...match,
      serverConfig: {
        firstServer,
        firstReceiver: matchType !== "singles" ? firstReceiver : null,
      },
    };

    setMatch(updatedMatch);
    setOpen(false);
  };

  const getLabel = (i: number) =>
    participants?.[i]?.fullName || participants?.[i]?.username || `Player ${i + 1}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Pick First Server {matchType !== "singles" && " & Receiver"}
          </DialogTitle>
          <DialogDescription>
            Please select who will serve first in the match.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* First Server */}
          <div>
            <p className="text-sm font-medium mb-2">First Server</p>
            <div className="grid grid-cols-2 gap-2">
              {matchType === "singles" ? (
                <>
                  <Button
                    variant={firstServer === "side1" ? "default" : "outline"}
                    onClick={() => setFirstServer("side1")}
                  >
                    {getLabel(0)}
                  </Button>
                  <Button
                    variant={firstServer === "side2" ? "default" : "outline"}
                    onClick={() => setFirstServer("side2")}
                  >
                    {getLabel(1)}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={firstServer === "side1_main" ? "default" : "outline"}
                    onClick={() => setFirstServer("side1_main")}
                  >
                    {getLabel(0)}
                  </Button>
                  <Button
                    variant={firstServer === "side1_partner" ? "default" : "outline"}
                    onClick={() => setFirstServer("side1_partner")}
                  >
                    {getLabel(1)}
                  </Button>
                  <Button
                    variant={firstServer === "side2_main" ? "default" : "outline"}
                    onClick={() => setFirstServer("side2_main")}
                  >
                    {getLabel(2)}
                  </Button>
                  <Button
                    variant={firstServer === "side2_partner" ? "default" : "outline"}
                    onClick={() => setFirstServer("side2_partner")}
                  >
                    {getLabel(3)}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* First Receiver (only doubles/mixed) */}
          {matchType !== "singles" && (
            <div>
              <p className="text-sm font-medium mb-2">First Receiver</p>
              <div className="grid grid-cols-2 gap-2">
                {["side1_main", "side1_partner", "side2_main", "side2_partner"].map((key, i) => (
                  <Button
                    key={key}
                    variant={firstReceiver === key ? "default" : "outline"}
                    onClick={() => setFirstReceiver(key as DoublesPlayerKey)}
                    disabled={firstServer?.toString().startsWith(key.split("_")[0])} // disable same side
                  >
                    {getLabel(i)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={!firstServer || (matchType !== "singles" && !firstReceiver)}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}