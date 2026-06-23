"use client";

import Link from "next/link";
import React from "react";
import { formatDateShort } from "@/lib/utils";
import { getParticipantDisplayName } from "@/types/tournament.type";

export type TournamentCardProps = {
  tournament: {
    _id: string;
    name: string;
    format: string;
    category?: string;
    matchType?: string;
    startDate: string;
    endDate?: string;
    status: string;
    city: string;
    venue?: string;
    participants: any[];
    organizer?: any;
    maxParticipants?: number;
    standings?: Array<{
      participant: any;
      rank: number;
    }>;
    bracket?: {
      completed?: boolean;
      rounds?: Array<{
        roundNumber: number;
        matches?: Array<{
          participant1?: any;
          participant2?: any;
          winner?: string;
        }>;
      }>;
    };
    knockoutStatistics?: {
      outcome?: {
        champion?: {
          participantId: string;
          participantName: string;
        };
      };
    };
  };
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const getTournamentTypeLabel = () => {
    // For team tournaments, show "Team"
    if (tournament.category === "team") {
      return "Team";
    }
    // For individual tournaments, show matchType (Singles/Doubles)
    if (tournament.matchType) {
      return tournament.matchType.charAt(0).toUpperCase() + tournament.matchType.slice(1);
    }
    // Fallback to "Singles" if no matchType specified
    return "Singles";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "upcoming":
        return "text-orange-500";
      case "cancelled":
        return "text-red-500";
      case "draft":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const tournamentTypeLabel = getTournamentTypeLabel();
  const formatLabel = tournament.format === "hybrid"
    ? "Hybrid"
    : tournament.format.replace(/_/g, " ");
  const statusLabel = tournament.status.replace(/_/g, " ");
  const statusColor = getStatusColor(tournament.status);

  // Get winner for completed tournaments
  const getWinnerName = () => {
    // Only check for completed tournaments
    if (tournament.status !== "completed") {
      return null;
    }

    // Priority 1: Check knockoutStatistics (most reliable for completed knockout/hybrid tournaments)
    if (tournament.knockoutStatistics?.outcome?.champion?.participantName) {
      return tournament.knockoutStatistics.outcome.champion.participantName;
    }

    // Priority 2: For knockout/hybrid tournaments, check bracket for winner
    if ((tournament.format === "knockout" || tournament.format === "hybrid") && tournament.bracket) {
      if (tournament.bracket.completed && tournament.bracket.rounds && tournament.bracket.rounds.length > 0) {
        const finalRound = tournament.bracket.rounds[tournament.bracket.rounds.length - 1];
        if (finalRound.matches && finalRound.matches.length > 0) {
          const finalMatch = finalRound.matches[0];
          if (finalMatch.winner) {
            // Find the winner participant in the participants array
            const winnerId = finalMatch.winner.toString();
            const winnerParticipant = tournament.participants.find((p: any) => {
              const pId = p._id?.toString() || p.toString();
              return pId === winnerId;
            });
            if (winnerParticipant) {
              return getParticipantDisplayName(winnerParticipant);
            }
            // If participant not found in array, try to get from bracket match
            if (finalMatch.participant1 && finalMatch.participant1.toString() === winnerId) {
              return getParticipantDisplayName(finalMatch.participant1);
            }
            if (finalMatch.participant2 && finalMatch.participant2.toString() === winnerId) {
              return getParticipantDisplayName(finalMatch.participant2);
            }
          }
        }
      }
    }

    // Priority 3: For round-robin tournaments, check standings for rank 1
    if (tournament.format === "round_robin" && tournament.standings && tournament.standings.length > 0) {
      const winner = tournament.standings.find((s) => s.rank === 1);
      if (winner && winner.participant) {
        return getParticipantDisplayName(winner.participant);
      }
    }

    // Fallback: Check standings for any tournament format (in case hybrid has standings)
    if (tournament.standings && tournament.standings.length > 0) {
      const winner = tournament.standings.find((s) => s.rank === 1);
      if (winner && winner.participant) {
        return getParticipantDisplayName(winner.participant);
      }
    }

    return null;
  };

  const winnerName = getWinnerName();

  return (
    <Link
      href={`/tournaments/${tournament._id}`}
      className="group block border border-[#d9d9d9] bg-[#ffffff] p-4 transition-colors hover:bg-[#3c6e71]"
    >
      {/* Line 1: Tournament name */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-sm text-gray-800 group-hover:text-[#ffffff] transition-colors">
          {tournament.name}
        </h3>
      </div>

      {/* Line 2: Meta info - Status/Type/Format/Participants */}
      <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]">
        <>
          <span className={`capitalize ${statusColor} group-hover:text-[#ffffff] transition-colors`}>{statusLabel}</span>
          <span>•</span>
          <span className="capitalize">{tournamentTypeLabel}</span>
          <span>•</span>
          <span className="capitalize">{formatLabel}</span>
          <span>•</span>
          <span>
            {tournament.participants.length}
            {tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""} players
          </span>
        </>
      </div>

      {/* Line 3: Meta info - Date, City, Venue */}
      <div className="flex flex-wrap items-center gap-1 mt-2 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]">
        <span>{formatDateShort(tournament.startDate)}</span>
        {(tournament.city || tournament.venue) && (
          <>
            <span>•</span>
            <span>
              {tournament.city && tournament.venue ? `${tournament.city}, ${tournament.venue}` : 
               tournament.city || tournament.venue}
            </span>
          </>
        )}
        {winnerName && (
          <>
            <span>•</span>
            <span className={`font-semibold group-hover:text-[#ffffff] transition-colors`}>{winnerName}</span>
          </>
        )}
      </div>
    </Link>
  );
}

export default TournamentCard;
