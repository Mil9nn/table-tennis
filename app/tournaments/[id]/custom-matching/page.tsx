"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tournament, isUserParticipant, isTeamParticipant } from "@/types/tournament.type";
import CustomKnockoutMatcher from "@/components/tournaments/CustomKnockoutMatcher";

export default function CustomMatchingPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(1);

  const fetchTournament = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
      setTournament(data.tournament);
    } catch (err) {
      toast.error("Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  const handleSuccess = () => {
    toast.success("Custom matchups saved!");
    fetchTournament();
    router.push(`/tournaments/${tournamentId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p>Tournament not found</p>
      </div>
    );
  }

  // Check if tournament has a knockout bracket (either pure knockout or hybrid in knockout phase)
  const hasKnockoutBracket =
    tournament.bracket &&
    (tournament.format === "knockout" ||
      (tournament.format === "hybrid" &&
        tournament.currentPhase === "knockout"));

  if (!hasKnockoutBracket) {
    return (
      <div className="text-center py-12">
        <p>This tournament does not have a knockout bracket</p>
        {tournament.format === "hybrid" && (
          <div className="text-sm text-gray-500 mt-2 space-y-1">
            {tournament.currentPhase !== "knockout" && (
              <p>Please complete the round-robin phase and transition to knockout phase first.</p>
            )}
            {tournament.currentPhase === "knockout" && !tournament.bracket && (
              <p>The bracket structure has not been created. Please try transitioning again or contact support.</p>
            )}
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => router.push(`/tournaments/${tournamentId}`)}
          className="mt-4"
        >
          Back to Tournament
        </Button>
      </div>
    );
  }

  const currentRound = tournament.bracket?.rounds.find(
    (r) => r.roundNumber === selectedRound
  );

  const isRoundLocked =
    currentRound?.completed ||
    currentRound?.matches?.some((m: any) => m.completed);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-zinc-50 to-zinc-100/60">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-5 space-y-5">
          {/* Title Row */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-700" />
            </button>

            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                Custom Bracket Matching
              </h1>
              <p className="text-sm text-zinc-500">{tournament.name}</p>
            </div>
          </div>

          {/* Round Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tournament.bracket?.rounds.map((round) => {
              const hasCompleted = round.matches?.some(
                (match: any) => match.completed
              );
              const locked = round.completed || hasCompleted;

              return (
                <button
                  key={round.roundNumber}
                  disabled={locked}
                  onClick={() => setSelectedRound(round.roundNumber)}
                  className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-200
                ${
                  locked
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                    : selectedRound === round.roundNumber
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-white border border-zinc-300 hover:border-zinc-400 hover:shadow-sm"
                }
              `}
                >
                  {round.roundName}
                  {locked && <span className="ml-1 text-xs">LOCKED</span>}
                </button>
              );
            })}
          </div>

          {/* Locked Warning */}
          {isRoundLocked && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <p className="text-sm font-medium">
                This round has already started and cannot be modified.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto">
        <div className="p-4 animate-[fadeIn_0.25s_ease-out]">
          <CustomKnockoutMatcher
            tournamentId={tournamentId}
            bracket={tournament.bracket!}
            isTeamTournament={tournament.category === "team"}
            participants={
              tournament.format === "hybrid" &&
              tournament.currentPhase === "knockout" &&
              tournament.qualifiedParticipants
                ? tournament.qualifiedParticipants
                : tournament.participants
            }
            qualifiedParticipantIds={
              tournament.format === "hybrid" &&
              tournament.currentPhase === "knockout" &&
              tournament.qualifiedParticipants
                ? new Set(
                    tournament.qualifiedParticipants.map(
                      (p: any) => p._id?.toString() || p.toString()
                    )
                  )
                : new Set(
                    tournament.participants.map(
                      (p: any) => p._id?.toString() || p.toString()
                    )
                  )
            }
            currentRound={selectedRound}
            onSuccess={handleSuccess}
            matchType={tournament.matchType}
            existingPairs={tournament.doublesPairs}
          />
        </div>
      </main>
    </div>
  );
}
