"use client";

import React from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon = Trophy,
  title = "No tournaments yet",
  description = "Tournaments you create or join will appear here.",
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div
      className="
        flex flex-col items-center justify-center
        border border-[#E6E8EB]
        bg-[#F9FAFB]
        px-6 py-10
        text-center
        transition-opacity duration-300
        animate-fade-in
      "
    >
      {/* Icon container – slightly more emphasis than profile empty state */}
      <div
        className="
          mb-3 flex h-9 w-9 items-center justify-center
          rounded-sm
          bg-[#E6E8EB]
        "
      >
        <Icon className="h-5 w-5 text-[#3B82F6]" />
      </div>

      <p className="text-sm font-medium text-[#2B2F36] leading-tight">
        {title}
      </p>

      <p className="mt-1 text-xs text-[#2B2F36]/70 max-w-65">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="
            mt-4
            text-xs font-medium
            text-[#3B82F6]
            hover:underline
            underline-offset-4
            transition-colors
          "
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}