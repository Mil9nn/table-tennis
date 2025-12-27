"use client";

import Link from "next/link";
import { TeamMatch } from "@/types/match.type";
import { formatDate, getAvatarFallbackStyle } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TeamMatchesListProps {
  matches: TeamMatch[];
}

export default function TeamMatchesList({ matches }: TeamMatchesListProps) {
  if (!matches || matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#d9d9d9', fontSize: '0.875rem' }}>No team matches found</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-px bg-[#d9d9d9] p-1">
      {matches.map((match) => {
        const isCompleted = match.status === "completed";
        const team1Won = match.winnerTeam === "team1";
        const team2Won = match.winnerTeam === "team2";

        return (
          <Link
            key={match._id}
            href={`/matches/${match._id}?category=team`}
            className="group block border border-[#d9d9d9] bg-[#ffffff] p-5 transition-colors hover:bg-[#3c6e71]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center shrink-0">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={match.team1?.logo} alt={match.team1?.name} />
                    <AvatarFallback style={{ fontSize: '0.75rem', fontWeight: '600', ...getAvatarFallbackStyle(match.team1?._id) }}>
                      {match.team1?.name?.charAt(0)?.toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span
                  style={{
                    fontWeight: team1Won ? '600' : '500',
                    fontSize: '0.9375rem',
                    color: team1Won ? '#3c6e71' : '#353535',
                    letterSpacing: '-0.01em'
                  }}
                  className="truncate transition-colors group-hover:text-[#ffffff]"
                >
                  {match.team1?.name || "Team 1"}
                </span>
              </div>

              {isCompleted ? (
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#353535',
                  letterSpacing: '0.02em'
                }} className="transition-colors group-hover:text-[#ffffff]">
                  {match.finalScore?.team1Matches || 0} - {match.finalScore?.team2Matches || 0}
                </span>
              ) : (
                <span style={{ fontSize: '0.875rem', color: '#d9d9d9', fontWeight: '500' }} className="transition-colors group-hover:text-[#ffffff]">vs</span>
              )}

              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span
                  style={{
                    fontWeight: team2Won ? '600' : '500',
                    fontSize: '0.9375rem',
                    color: team2Won ? '#3c6e71' : '#353535',
                    letterSpacing: '-0.01em'
                  }}
                  className="truncate transition-colors group-hover:text-[#ffffff]"
                >
                  {match.team2?.name || "Team 2"}
                </span>
                <div className="flex items-center shrink-0">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={match.team2?.logo} alt={match.team2?.name} />
                    <AvatarFallback style={{ fontSize: '0.75rem', fontWeight: '600', ...getAvatarFallbackStyle(match.team2?._id) }}>
                      {match.team2?.name?.charAt(0)?.toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]" style={{ fontSize: '0.8125rem' }}>
              <span>
                {formatDate(match.createdAt)}
              </span>
              <span>•</span>
              <span>
                {match.city || match.venue || "—"}
              </span>
              {match.status !== "completed" && (
                <>
                  <span>•</span>
                  <div
                    style={{
                      width: '0.375rem',
                      height: '0.375rem',
                      backgroundColor: match.status === "scheduled" ? '#284b63' : match.status === "in_progress" ? '#3c6e71' : '#353535'
                    }}
                    className="rounded-full shrink-0"
                    title={match.status}
                  />
                </>
              )}
            </div>
          </Link>
        );
      })}
    </section>
  );
}
