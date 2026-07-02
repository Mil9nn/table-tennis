"use client";

import { Flame } from "lucide-react";
import {
  MOCK_STANDINGS,
  MOCK_STANDINGS_PARTICIPANTS,
} from "@/lib/landing/mockShowcase";
import { AppPreviewFrame } from "./AppPreviewFrame";
import { cn } from "@/lib/utils";

function FormChip({ result }: { result: string }) {
  return (
    <span
      className={cn(
        "flex size-4 items-center justify-center rounded text-[10px] font-semibold",
        result === "W" && "bg-[#DCFCE7] text-[#15803D]",
        result === "L" && "bg-[#FEE2E2] text-[#B91C1C]",
        result !== "W" && result !== "L" && "bg-[#E2E8F0] text-[#475569]"
      )}
    >
      {result}
    </span>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) {
    return <span className="text-[11px] text-[#64748B]">-</span>;
  }
  const win = streak > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
        win
          ? "border-[#DCFCE7] bg-[#F0FDF4] text-[#15803D]"
          : "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C]"
      )}
    >
      <Flame className="size-2.5" />
      {Math.abs(streak)}
      {win ? "W" : "L"}
    </span>
  );
}

function calcStreak(form: string[]) {
  if (!form.length) return 0;
  const latest = form[form.length - 1];
  let streak = 0;
  for (let i = form.length - 1; i >= 0; i -= 1) {
    if (form[i] !== latest) break;
    if (latest === "W") streak += 1;
    if (latest === "L") streak -= 1;
  }
  return streak;
}

export function StandingsPreview() {
  const participantMap = new Map<
    string,
    (typeof MOCK_STANDINGS_PARTICIPANTS)[number]
  >(MOCK_STANDINGS_PARTICIPANTS.map((p) => [p._id, p]));

  return (
    <AppPreviewFrame title="Spring Open" subtitle="Standings">
      <div className="overflow-x-auto">
        <table className="w-max min-w-full border-collapse text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {["Rank", "Player", "MP", "W", "L", "D", "SW", "SL", "Pts", "Win%", "Streak", "Form"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-2 py-2 text-center font-medium text-[#475569] first:text-left"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {MOCK_STANDINGS.map((row) => {
              const p = participantMap.get(
                typeof row.participant === "object" && row.participant && "_id" in row.participant
                  ? String(row.participant._id)
                  : ""
              );
              const highlight = row.rank <= 3;
              const winRate = row.played
                ? Math.round((row.won / row.played) * 100)
                : 0;

              return (
                <tr
                  key={row.rank}
                  className={cn(
                    "border-b border-[#E2E8F0]",
                    highlight ? "bg-[#EEF2FF]" : "bg-white"
                  )}
                >
                  <td className="px-2 py-2 text-center text-[#64748B]">{row.rank}</td>
                  <td className="px-2 py-2">
                    <div className="flex min-w-[140px] items-center gap-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-bold text-[#475569]">
                        {(p?.fullName || "?").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#334155]">
                          {p?.fullName}
                        </p>
                        <p className="truncate text-[11px] text-[#64748B]">@{p?.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-[#334155]">{row.played}</td>
                  <td className="px-2 py-2 text-center font-semibold text-[#16A34A]">
                    {row.won}
                  </td>
                  <td className="px-2 py-2 text-center font-semibold text-[#DC2626]">
                    {row.lost}
                  </td>
                  <td className="px-2 py-2 text-center text-[#64748B]">{row.drawn}</td>
                  <td className="px-2 py-2 text-center text-[#334155]">{row.setsWon}</td>
                  <td className="px-2 py-2 text-center text-[#334155]">{row.setsLost}</td>
                  <td className="px-2 py-2 text-center">
                    <span className="inline-flex min-w-9 justify-center rounded-md bg-[#E0E7FF] px-2 py-0.5 text-[11px] font-bold text-[#4338CA]">
                      {row.points}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center font-semibold text-[#334155]">
                    {winRate}%
                  </td>
                  <td className="px-2 py-2 text-center">
                    <StreakBadge streak={calcStreak(row.form)} />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center gap-1">
                      {row.form.slice(-5).map((r, i) => (
                        <FormChip key={i} result={r} />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppPreviewFrame>
  );
}
