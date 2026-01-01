"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMatchStore } from "@/hooks/useMatchStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { buildDoublesRotation } from "./live-scorer/individual/helpers";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { isTeamMatch, TeamMatch } from "@/types/match.type";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { Check } from "@mui/icons-material";
import { cn } from "@/lib/utils";

interface InitialServerDialogProps {
  matchType: string;
  participants: any[];
  isTeamMatch?: boolean;
  subMatchId?: string;
}

export default function InitialServerDialog({
  matchType,
  participants,
  isTeamMatch,
  subMatchId,
}: InitialServerDialogProps) {
  const isOpen = useMatchStore((s) => s.serverDialogOpen);
  const setOpen = useMatchStore((s) => s.setServerDialogOpen);
  const match = useMatchStore((s) => s.match);
  const setMatch = useMatchStore((s) => s.setMatch);

  const [selectedFirstServer, setSelectedFirstServer] = useState<string | null>(null);
  const [selectedFirstReceiver, setSelectedFirstReceiver] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSingles = matchType === "singles";
  const isDoubles = matchType === "doubles" || matchType === "mixed_doubles";

  const handleSave = async () => {
    if (!selectedFirstServer || !match) {
      toast.error("Please select a first server");
      return;
    }

    if (isDoubles && !selectedFirstReceiver) {
      toast.error("Please select a first receiver");
      return;
    }

    setLoading(true);
    try {
      let serverOrder: string[] | undefined = undefined;

      if (isDoubles && selectedFirstServer && selectedFirstReceiver) {
        serverOrder = buildDoublesRotation(
          selectedFirstServer as any,
          selectedFirstReceiver as any
        );

        if (!serverOrder || serverOrder.length !== 4) {
          toast.error("Failed to build server rotation");
          setLoading(false);
          return;
        }
      }

      const serverConfig = {
        firstServer: selectedFirstServer,
        firstReceiver: isDoubles ? selectedFirstReceiver : null,
        serverOrder: isDoubles ? serverOrder : undefined,
      };

      let endpoint: string;
      if (isTeamMatch && subMatchId) {
        endpoint = `/matches/team/${match._id}/submatch/${subMatchId}/server-config`;
      } else {
        endpoint = `/matches/individual/${match._id}/server-config`;
      }

      const { data } = await axiosInstance.post(endpoint, serverConfig);

      if (data?.match) {

        setMatch(data.match);

        if (!isTeamMatch) {
          useIndividualMatch.getState().setInitialMatch(data.match);
        } else {
          const updatedMatch = data.match as TeamMatch;
          useTeamMatch.getState().setInitialTeamMatch(updatedMatch);
          
          const currentSubMatch = updatedMatch.subMatches[
            (updatedMatch.currentSubMatch || 1) - 1
          ];
        }

        toast.success("Server configuration saved!");
        setOpen(false);
      }
    } catch (err) {
      console.error("Failed to save server config:", err);
      toast.error("Failed to save server configuration");
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (index: number) => {
    const participant = participants?.[index];
    return (
      participant?.fullName || participant?.username || `Player ${index + 1}`
    );
  };

  const getServerOptions = () => {
    if (isSingles) {
      if (isTeamMatch) {
        return [
          { value: "team1", label: getPlayerName(0) },
          { value: "team2", label: getPlayerName(1) },
        ];
      } else {
        return [
          { value: "side1", label: getPlayerName(0) },
          { value: "side2", label: getPlayerName(1) },
        ];
      }
    }

    if (isTeamMatch) {
      return [
        { value: "team1_main", label: `${getPlayerName(0)} (Team 1 Main)` },
        { value: "team1_partner", label: `${getPlayerName(1)} (Team 1 Partner)` },
        { value: "team2_main", label: `${getPlayerName(2)} (Team 2 Main)` },
        { value: "team2_partner", label: `${getPlayerName(3)} (Team 2 Partner)` },
      ];
    } else {
      return [
        { value: "side1_main", label: `${getPlayerName(0)} (Side 1 Main)` },
        { value: "side1_partner", label: `${getPlayerName(1)} (Side 1 Partner)` },
        { value: "side2_main", label: `${getPlayerName(2)} (Side 2 Main)` },
        { value: "side2_partner", label: `${getPlayerName(3)} (Side 2 Partner)` },
      ];
    }
  };

  const getReceiverOptions = () => {
  if (!selectedFirstServer) return [];

  // Determine which team the server belongs to
  let isServerTeam1 = false;
  
  if (isTeamMatch) {
    isServerTeam1 = selectedFirstServer === "team1" || 
                    selectedFirstServer === "team1_main" || 
                    selectedFirstServer === "team1_partner";
  } else {
    isServerTeam1 = selectedFirstServer === "side1" || 
                    selectedFirstServer === "side1_main" || 
                    selectedFirstServer === "side1_partner";
  }

  if (isTeamMatch) {
    // If server is from team1, receiver must be from team2 (indices 2, 3)
    // If server is from team2, receiver must be from team1 (indices 0, 1)
    return [
      {
        value: isServerTeam1 ? "team2_main" : "team1_main",
        label: `${getPlayerName(isServerTeam1 ? 2 : 0)} (Main)`,
      },
      {
        value: isServerTeam1 ? "team2_partner" : "team1_partner",
        label: `${getPlayerName(isServerTeam1 ? 3 : 1)} (Partner)`,
      },
    ];
  } else {
    // Individual doubles logic
    return [
      {
        value: isServerTeam1 ? "side2_main" : "side1_main",
        label: `${getPlayerName(isServerTeam1 ? 2 : 0)} (Main)`,
      },
      {
        value: isServerTeam1 ? "side2_partner" : "side1_partner",
        label: `${getPlayerName(isServerTeam1 ? 3 : 1)} (Partner)`,
      },
    ];
  }
};

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-base">
        Select first server
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-6">
      {/* SERVER SELECTION */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Choose the player who will start serving.
        </p>

        <div className="grid gap-3">
          {getServerOptions().map((option) => {
            const isActive = selectedFirstServer === option.value;

            return (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedFirstServer(option.value);
                  if (isSingles) setSelectedFirstReceiver(null);
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 text-left transition-all",
                  "hover:border-primary/50 hover:shadow-sm",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border"
                )}
              >
                <span className="text-sm font-medium">
                  {option.label}
                </span>

                {isActive && (
                  <Check sx={{ fontSize: 16 }} className="text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RECEIVER SELECTION (DOUBLES ONLY) */}
      {isDoubles && selectedFirstServer && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose the first receiver.
          </p>

          <div className="grid gap-3">
            {getReceiverOptions().map((option) => {
              const isActive = selectedFirstReceiver === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedFirstReceiver(option.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 text-left transition-all",
                    "hover:border-primary/50 hover:shadow-sm",
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border"
                  )}
                >
                  <span className="text-sm font-medium">
                    {option.label}
                  </span>

                  {isActive && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={
            !selectedFirstServer ||
            (isDoubles && !selectedFirstReceiver) ||
            loading
          }
        >
          {loading ? "Saving…" : "Start match"}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

  );
}