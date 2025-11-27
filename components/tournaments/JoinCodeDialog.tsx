"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Copy, Share2, Loader2, QrCode as QrCodeIcon } from "lucide-react";

interface JoinCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  tournamentName: string;
  joinCode?: string;
  allowJoinByCode: boolean;
  onUpdate: (joinCode: string, allowJoinByCode: boolean) => void;
}

export function JoinCodeDialog({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
  joinCode,
  allowJoinByCode,
  onUpdate,
}: JoinCodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(allowJoinByCode);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/tournaments/join?code=${joinCode}`
    : '';

  const handleToggle = async (newEnabled: boolean) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/toggle-join-code`,
        { enable: newEnabled }
      );

      setEnabled(data.allowJoinByCode);
      onUpdate(data.joinCode, data.allowJoinByCode);
      toast.success(data.message);
    } catch (err: any) {
      console.error("Error toggling join code:", err);
      toast.error(err.response?.data?.error || "Failed to update join code");
      setEnabled(enabled); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      toast.success("Join code copied to clipboard!");
    }
  };

  const copyJoinUrl = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinUrl);
      toast.success("Join URL copied to clipboard!");
    }
  };

  const shareJoinCode = async () => {
    if (!joinCode) return;

    const shareData = {
      title: `Join ${tournamentName}`,
      text: `Join the tournament "${tournamentName}" with code: ${joinCode}`,
      url: joinUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      copyJoinUrl();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tournament Join Code</DialogTitle>
          <DialogDescription>
            Share this code or QR code with participants to let them join
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between space-x-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <Label htmlFor="allow-join" className="cursor-pointer flex flex-col">
              <div className="font-medium">Allow Join by Code</div>
            </Label>
            <Switch
              id="allow-join"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>

          {enabled && joinCode && (
            <>
              {/* Join Code */}
              <div className="space-y-2">
                <Label>Join Code</Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                    <div className="text-3xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                      {joinCode}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyJoinCode}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <QrCodeIcon className="w-4 h-4" />
                  QR Code
                </Label>
                <div className="flex justify-center p-6 bg-white dark:bg-slate-800 rounded-lg border">
                  <QRCodeSVG
                    value={joinUrl}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                  Scan to join tournament
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={copyJoinUrl}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={shareJoinCode}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </>
          )}

          {!enabled && (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">
              <p>Enable join by code to generate a unique code and QR code</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
