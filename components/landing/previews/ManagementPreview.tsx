"use client";

import type { ComponentType } from "react";
import {
  ChevronDown,
  GitBranch,
  Grid3X3,
  Settings,
  Shuffle,
  Sprout,
  UserCheck,
  Users,
} from "lucide-react";
import { AppPreviewFrame } from "./AppPreviewFrame";
import { cn } from "@/lib/utils";

function ManagementChip({
  label,
  icon: Icon,
  color,
  filled,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  filled?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[10px] font-medium",
        filled ? "text-white" : "bg-white"
      )}
      style={{
        borderColor: color,
        backgroundColor: filled ? color : undefined,
        color: filled ? "#FFFFFF" : color,
      }}
    >
      <Icon className="size-3.5" />
      {label}
    </div>
  );
}

export function ManagementPreview() {
  return (
    <AppPreviewFrame title="Spring Open 2026" subtitle="Organizer view">
      <div className="p-4">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#EEF2FF]">
              <Settings className="size-4 text-[#4F46E5]" />
            </div>
            <p className="text-xs font-semibold text-[#111827]">
              Management & Actions
            </p>
          </div>
          <ChevronDown className="size-4 rotate-180 text-[#4F46E5]" />
        </div>

        <div className="space-y-4 px-3 pb-3">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#4B5563]">
              Management
            </p>
            <div className="flex flex-wrap gap-2">
              <ManagementChip label="Participants" icon={Users} color="#4F46E5" />
              <ManagementChip label="Groups" icon={Grid3X3} color="#F59E0B" />
              <ManagementChip label="Scorers" icon={UserCheck} color="#10B981" />
              <ManagementChip label="Invite" icon={GitBranch} color="#4B5563" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#4B5563]">
              Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <ManagementChip
                label="Generate Draw"
                icon={Shuffle}
                color="#4F46E5"
                filled
              />
              <ManagementChip label="Seeding" icon={Sprout} color="#F59E0B" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto px-4 pb-1">
        {["Info", "Progress", "Schedule", "Standings"].map((tab, i) => (
          <span
            key={tab}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-semibold",
              i === 1
                ? "bg-[#4F46E5] text-white"
                : "bg-[#F8FAFC] text-[#4B5563]"
            )}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="mx-4 mb-4 rounded-lg border border-[#E2E8F0] p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-[#111827]">Matches: 18 / 24</span>
          <span className="font-semibold text-[#10B981]">75%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
          <div className="h-full w-3/4 rounded-full bg-[#10B981]" />
        </div>
      </div>
    </AppPreviewFrame>
  );
}
