"use client";

import { useState } from "react";
import { PerformanceMetrics } from "@/types/knockoutStatistics.type";
import { TrendingUp, ChevronUp, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PerformanceMetricsSectionProps {
  metrics: PerformanceMetrics[];
}

type SortKey = "participantName" | "avgPointsPerSet" | "avgPointsConcededPerSet";

export function PerformanceMetricsSection({ metrics }: PerformanceMetricsSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>("avgPointsPerSet");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedMetrics = [...metrics].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;
    if (sortKey === "participantName") return factor * a.participantName.localeCompare(b.participantName);
    return factor * ((a[sortKey] as number) - (b[sortKey] as number));
  });

  const handleSort = (key: SortKey) => {
    setSortOrder(sortKey === key && sortOrder === "desc" ? "asc" : "desc");
    setSortKey(key);
  };

  return (
    <div className="w-full flex flex-col border border-slate-200 bg-white rounded-sm overflow-hidden shadow-sm">
      {/* Header: Minimalist & Fixed */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white z-20">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-slate-900" />
          <h2 className="text-[10px] font-black uppercase tracking-tighter text-slate-800">Performance Metrics</h2>
        </div>
      </div>

      {/* Responsive Container: Scrollable horizontally on mobile, fixed height option */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
        <Table className="border-collapse min-w-150 lg:min-w-full">
          <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent border-b">
              {/* Sticky Column for Participant Name */}
              <TableHead 
                className="sticky left-0 bg-slate-50 z-10 h-7 px-3 text-[9px] font-bold uppercase cursor-pointer text-slate-500 border-r"
                onClick={() => handleSort("participantName")}
              >
                Participant {sortKey === "participantName" && (sortOrder === "desc" ? "↓" : "↑")}
              </TableHead>
              <TableHead 
                className="h-7 px-2 text-center text-[9px] font-bold uppercase cursor-pointer text-slate-500"
                onClick={() => handleSort("avgPointsPerSet")}
              >
                PTS/Set
              </TableHead>
              <TableHead 
                className="h-7 px-2 text-center text-[9px] font-bold uppercase cursor-pointer text-slate-500"
                onClick={() => handleSort("avgPointsConcededPerSet")}
              >
                CON/Set
              </TableHead>
              <TableHead className="h-7 px-3 text-[9px] font-bold uppercase text-slate-500">
                Peak Win vs
              </TableHead>
              <TableHead className="h-7 px-3 text-[9px] font-bold uppercase text-slate-500">
                Round
              </TableHead>
              <TableHead className="h-7 px-3 text-right text-[9px] font-bold uppercase text-slate-500">
                Margin
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMetrics.map((p) => (
              <TableRow key={p.participantId} className="group border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                <TableCell className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 py-1.5 px-3 border-r">
                  <span className="text-[11px] font-bold text-slate-900 whitespace-nowrap">
                    {p.participantName}
                  </span>
                </TableCell>
                
                <TableCell className="py-1.5 px-2 text-center font-mono text-[11px] font-semibold text-blue-600">
                  {p.avgPointsPerSet.toFixed(1)}
                </TableCell>

                <TableCell className="py-1.5 px-2 text-center font-mono text-[11px] font-semibold text-slate-600">
                  {p.avgPointsConcededPerSet.toFixed(1)}
                </TableCell>

                <TableCell className="py-1.5 px-3">
                  <span className="text-[10px] font-medium text-slate-700 whitespace-nowrap">
                    {p.biggestWin.opponentName !== "N/A" ? p.biggestWin.opponentName : "—"}
                  </span>
                </TableCell>

                <TableCell className="py-1.5 px-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    {p.biggestWin.roundName || "—"}
                  </span>
                </TableCell>

                <TableCell className="py-1.5 px-3 text-right font-mono text-[11px]">
                  <div className="flex flex-col items-end">
                    <span className="font-black text-slate-900 leading-none">
                      {p.biggestWin.setScore !== "N/A" ? p.biggestWin.setScore : "—"}
                    </span>
                    {p.biggestWin.pointMargin && (
                      <span className="text-[9px] font-bold text-emerald-600">
                        +{p.biggestWin.pointMargin}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
