"use client";

import React from "react";
import { Trophy, Users, Target, Zap } from "lucide-react";

interface LeaderboardEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  type?: "singles" | "doubles" | "mixed_doubles" | "teams" | "tournaments";
  showSubtext?: boolean;
}

const emptyStateConfig = {
  singles: {
    icon: Target,
    title: "No singles rankings yet",
    description: "Start competing in singles matches to climb the leaderboard.",
    subtext: "Win matches to earn points and improve your ranking.",
  },
  doubles: {
    icon: Users,
    title: "No doubles rankings yet",
    description: "Team up and compete in doubles matches.",
    subtext: "Build chemistry with your partner to dominate the leaderboard.",
  },
  mixed_doubles: {
    icon: Users,
    title: "No mixed doubles rankings yet",
    description: "Compete in mixed doubles matches.",
    subtext: "Win matches to earn points and improve your ranking.",
  },
  teams: {
    icon: Trophy,
    title: "No team rankings yet",
    description: "Create or join a team to start competing.",
    subtext: "Team victories will determine your ranking position.",
  },
  tournaments: {
    icon: Trophy,
    title: "No tournament rankings yet",
    description: "Participate in tournaments to earn tournament points.",
    subtext: "Tournament results will be reflected in your profile.",
  },
};

export function LeaderboardEmptyState({
  title,
  description,
  icon: CustomIcon,
  type = "singles",
  showSubtext = true,
}: LeaderboardEmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = CustomIcon || config.icon;
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;

  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      style={{
        backgroundColor: 'rgba(60, 110, 113, 0.02)',
        borderTop: '1px solid #d9d9d9',
        borderBottom: '1px solid #d9d9d9',
      }}
    >
      {/* Icon Container */}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-lg mb-4 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(60, 110, 113, 0.08)',
        }}
      >
        <Icon className="h-8 w-8" style={{ color: '#3c6e71' }} />
      </div>

      {/* Title */}
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: '#353535' }}
      >
        {finalTitle}
      </h3>

      {/* Description */}
      <p
        className="text-sm max-w-sm mb-1"
        style={{ color: '#d9d9d9' }}
      >
        {finalDescription}
      </p>

      {/* Subtext */}
      {showSubtext && (
        <p
          className="text-xs mt-2 max-w-sm"
          style={{ color: 'rgba(217, 217, 217, 0.7)' }}
        >
          {config.subtext}
        </p>
      )}
    </div>
  );
}
