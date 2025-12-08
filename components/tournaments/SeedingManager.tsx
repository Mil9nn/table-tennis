"use client";

import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ChevronUp, ChevronDown, Shuffle } from "lucide-react";
import { 
  Participant as TournamentParticipant,
  Seeding as TournamentSeeding,
  isTeamParticipant,
  getParticipantDisplayName,
  getParticipantImage as getParticipantImageUtil,
} from "@/types/tournament.type";

interface SeedingManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  participants: TournamentParticipant[];
  currentSeeding: TournamentSeeding[];
  onUpdate: () => void;
  category?: "individual" | "team";
}

// Local seeding type for component state
interface LocalSeeding {
  participant: TournamentParticipant | string;
  seedNumber: number;
  seedingRank?: number;
  seedingPoints?: number;
}

export function SeedingManager({
  open,
  onOpenChange,
  tournamentId,
  participants,
  currentSeeding,
  onUpdate,
  category = "individual",
}: SeedingManagerProps) {
  const [seeding, setSeeding] = useState<LocalSeeding[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      // Initialize seeding from current seeding or create from participants
      if (currentSeeding && currentSeeding.length > 0) {
        // Convert TournamentSeeding to LocalSeeding
        const converted: LocalSeeding[] = currentSeeding.map((s) => ({
          participant: s.participant,
          seedNumber: s.seedNumber,
          seedingRank: s.seedingRank,
          seedingPoints: s.seedingPoints,
        }));
        setSeeding(converted);
      } else {
        // Create initial seeding with current order
        const initialSeeding: LocalSeeding[] = participants.map((p, index) => ({
          participant: p,
          seedNumber: index + 1,
        }));
        setSeeding(initialSeeding);
      }
      setLoading(false);
    }
  }, [open, participants, currentSeeding]);

  const moveParticipant = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === seeding.length - 1) return;

    const items = Array.from(seeding);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    // Update seed numbers based on new order
    const updatedSeeding = items.map((item, idx) => ({
      ...item,
      seedNumber: idx + 1,
    }));

    setSeeding(updatedSeeding);
  };

  const handleShuffle = () => {
    const shuffled = [...seeding].sort(() => Math.random() - 0.5);
    const updatedSeeding = shuffled.map((item, index) => ({
      ...item,
      seedNumber: index + 1,
    }));
    setSeeding(updatedSeeding);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare seeding data with participant IDs
      const seedingData = seeding.map((s) => ({
        participant: typeof s.participant === "string" ? s.participant : s.participant._id,
        seedNumber: s.seedNumber,
        seedingRank: s.seedingRank,
        seedingPoints: s.seedingPoints,
      }));

      await axiosInstance.put(`/tournaments/${tournamentId}/seeding`, {
        seeding: seedingData,
      });

      toast.success("Seeding updated successfully");
      onUpdate();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error updating seeding:", err);
      toast.error(err.response?.data?.error || "Failed to update seeding");
    } finally {
      setSaving(false);
    }
  };

  const getParticipantName = (participant: TournamentParticipant | string): string => {
    if (typeof participant === "string") return "Unknown";
    return getParticipantDisplayName(participant);
  };

  const getParticipantImage = (participant: TournamentParticipant | string): string | undefined => {
    if (typeof participant === "string") return undefined;
    return getParticipantImageUtil(participant);
  };
  
  // Get subtext for participant (username for users, city/player count for teams)
  const getParticipantSubtext = (participant: TournamentParticipant | string): string | undefined => {
    if (typeof participant === "string") return undefined;
    if (isTeamParticipant(participant)) {
      return participant.city || `${participant.players?.length || 0} players`;
    }
    return `@${participant.username || "unknown"}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Seeding</DialogTitle>
          <DialogDescription>
            Drag and drop participants to reorder seeds. Seed #1 is the top seed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShuffle}
                className="gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </Button>
            </div>

            <div className="space-y-2">
              {seeding.map((item, index) => {
                const participant = item.participant;
                const name = getParticipantName(participant);
                const image = getParticipantImage(participant);

                return (
                  <div
                    key={
                      typeof participant === "string"
                        ? participant
                        : participant._id
                    }
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveParticipant(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveParticipant(index, "down")}
                        disabled={index === seeding.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      {item.seedNumber}
                    </div>

                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                        {name[0]?.toUpperCase() || "?"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      {typeof participant !== "string" && (
                        <p className="text-xs text-gray-500 truncate">
                          {getParticipantSubtext(participant)}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Seed #{item.seedNumber}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Seeding"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

