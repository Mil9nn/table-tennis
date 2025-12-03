"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Loader2, Trophy, QrCode, ArrowLeft } from "lucide-react";

export default function JoinTournamentPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      toast.error("Please enter a join code");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/tournaments/join", {
        joinCode: joinCode.trim().toUpperCase(),
      });

      toast.success(data.message);
      router.push(`/tournaments/${data.tournament._id}`);
    } catch (err: any) {
      console.error("Error joining tournament:", err);
      toast.error(err.response?.data?.error || "Failed to join tournament");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-slate-600 dark:text-slate-400">
            Enter join code to register for a tournament
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Join Code</CardTitle>
            <CardDescription>
              Ask the tournament organizer for the 6-character join code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Join Code</Label>
                <Input
                  id="joinCode"
                  type="text"
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest uppercase"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || joinCode.trim().length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Tournament"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <QrCode className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Have a QR code?
                  </p>
                  <p className="mt-1">
                    Scan the QR code provided by the organizer to join instantly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/tournaments")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournaments
          </Button>
        </div>
      </div>
    </div>
  );
}
