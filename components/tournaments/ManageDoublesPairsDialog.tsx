"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import DoublesPairBuilder, {
  DoublesPairData,
} from "./DoublesPairBuilder";

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

interface ManageDoublesPairsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  participants: Participant[];
  existingPairs?: DoublesPairData[];
  onUpdate?: (pairs: DoublesPairData[]) => void;
  disabled?: boolean;
}

/**
 * Dialog for managing doubles pairs before draw generation
 * Wraps DoublesPairBuilder with save functionality
 */
export function ManageDoublesPairsDialog({
  open,
  onOpenChange,
  tournamentId,
  participants,
  existingPairs = [],
  onUpdate,
  disabled = false,
}: ManageDoublesPairsDialogProps) {
  const [pairs, setPairs] = useState<DoublesPairData[]>(existingPairs);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if pairs have changed
  useEffect(() => {
    const pairsChanged =
      JSON.stringify(pairs) !== JSON.stringify(existingPairs);
    setHasChanges(pairsChanged);
  }, [pairs, existingPairs]);

  // Reset pairs when dialog opens or existing pairs change
  useEffect(() => {
    if (open) {
      setPairs(existingPairs);
      setHasChanges(false);
    }
  }, [open, existingPairs]);

  const handleSave = async () => {
    // Validate all players are paired
    const pairedPlayerCount = pairs.length * 2;
    if (pairedPlayerCount !== participants.length) {
      toast.error(
        `All ${participants.length} players must be paired. Currently ${pairedPlayerCount} players are paired.`
      );
      return;
    }

    setSaving(true);
    try {
      // Convert pairs to API format
      const pairsData = pairs.map((pair) => ({
        _id: pair._id,
        player1: pair.player1._id,
        player2: pair.player2._id,
      }));

      const response = await axiosInstance.post(
        `/tournaments/${tournamentId}/doubles-pairs`,
        { pairs: pairsData }
      );

      toast.success(response.data.message);
      
      // Update parent component
      if (onUpdate && response.data.pairs) {
        onUpdate(response.data.pairs);
      }

      setHasChanges(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving pairs:", error);
      toast.error(
        error.response?.data?.error || "Failed to save pairs"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmed) return;
    }
    setPairs(existingPairs);
    setHasChanges(false);
    onOpenChange(false);
  };

  const needsMorePairs = pairs.length * 2 < participants.length;
  const allPaired = pairs.length * 2 === participants.length;

  return (
    <Dialog open={open} onOpenChange={disabled ? undefined : handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Doubles Pairs</DialogTitle>
          <DialogDescription>
            Create pairs for your doubles tournament. All {participants.length}{" "}
            players must be paired before generating the draw.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <DoublesPairBuilder
            participants={participants}
            existingPairs={pairs}
            onPairsChange={setPairs}
            disabled={disabled || saving}
          />
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {needsMorePairs && (
              <span className="text-amber-600 font-medium">
                ⚠️ {participants.length - pairs.length * 2} players still need
                to be paired
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving || disabled}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!allPaired || !hasChanges || saving || disabled}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Pairs"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

