"use client";

import React from "react";
import { Standing } from "@/types/tournament.type";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface Props {
  standings: Standing[];
  showDetailedStats?: boolean;
  highlightTop?: number;
  groupName?: string;
}

export function EnhancedStandingsTable({
  standings,
  showDetailedStats = true,
  highlightTop = 3,
  groupName,
}: Props) {
  const formChip = (r: string) => {
    const base =
      "text-[10px] w-4 h-4 flex items-center justify-center rounded-[4px] font-medium";

    switch (r) {
      case "W":
        return <div className={`${base} bg-green-100 text-green-700`}>W</div>;
      case "L":
        return <div className={`${base} bg-red-100 text-red-700`}>L</div>;
      default:
        return <div className={`${base} bg-slate-200 text-slate-600`}>D</div>;
    }
  };

  const rankChip = (rank: number) => {

    if (rank <= highlightTop)
      return (
        <div className="text-indigo-600 font-semibold text-[12px]">
          {rank}
        </div>
      );

    return <div className="text-slate-400 text-[12px]">{rank}</div>;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {groupName && (
        <div className="border-b border-slate-200 p-4 bg-slate-50">
          <h3 className="font-semibold text-sm tracking-wide text-slate-700">
            {groupName}
          </h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200">
              <TableHead className="text-center font-medium text-[11px] text-slate-600">
                Rank
              </TableHead>
              <TableHead className="font-medium text-[11px] text-slate-600">
                Player
              </TableHead>
              <TableHead className="text-center font-medium text-[11px] text-slate-600">
                MP
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                W
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                L
              </TableHead>

              {showDetailedStats && (
                <>
                  <TableHead className="text-center text-[11px] text-slate-600">D</TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">SW</TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">SL</TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">SD</TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">PS</TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">PD</TableHead>
                </>
              )}

              <TableHead className="text-center font-semibold text-[11px] text-slate-700">
                Pts
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Form
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {standings.map((s) => {
              const highlight = s.rank <= highlightTop;

              return (
                <TableRow
                  key={s.participant._id}
                  className={`transition-all ${
                    highlight ? "bg-indigo-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Rank */}
                  <TableCell className="text-center">{rankChip(s.rank)}</TableCell>

                  {/* Player */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={s.participant.profileImage}
                          alt={s.participant.fullName}
                        />
                      </Avatar>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-medium text-slate-700">
                          {s.participant.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          @{s.participant.username}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* MP */}
                  <TableCell className="text-center text-slate-700">
                    {s.played}
                  </TableCell>

                  {/* W */}
                  <TableCell className="text-center text-green-600 font-medium">
                    {s.won}
                  </TableCell>

                  {/* L */}
                  <TableCell className="text-center text-red-600 font-medium">
                    {s.lost}
                  </TableCell>

                  {showDetailedStats && (
                    <>
                      <TableCell className="text-center text-slate-500">{s.drawn}</TableCell>
                      <TableCell className="text-center">{s.setsWon}</TableCell>
                      <TableCell className="text-center">{s.setsLost}</TableCell>

                      <TableCell className="text-center">
                        <span
                          className={
                            s.setsDiff > 0
                              ? "text-green-600"
                              : s.setsDiff < 0
                              ? "text-red-600"
                              : "text-slate-500"
                          }
                        >
                          {s.setsDiff > 0 && "+"}
                          {s.setsDiff}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">{s.pointsScored}</TableCell>

                      <TableCell className="text-center">
                        <span
                          className={
                            s.pointsDiff > 0
                              ? "text-green-600"
                              : s.pointsDiff < 0
                              ? "text-red-600"
                              : "text-slate-500"
                          }
                        >
                          {s.pointsDiff > 0 && "+"}
                          {s.pointsDiff}
                        </span>
                      </TableCell>
                    </>
                  )}

                  {/* Points */}
                  <TableCell className="text-center">
                    <Badge className="bg-indigo-100 text-indigo-700 font-semibold text-[11px] px-2 py-0.5 rounded-md">
                      {s.points}
                    </Badge>
                  </TableCell>

                  {/* Form */}
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      {s.form.slice(-5).map((r, i) => (
                        <div key={i}>{formChip(r)}</div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}