// components/weaknesses-analysis/ZoneSectorWeaknessTable.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoneSectorWeakness } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { RecommendationText } from "./RecommendationText";

interface ZoneSectorWeaknessTableProps {
  weaknesses: ZoneSectorWeakness[];
  showAll?: boolean; // Show all 9 or just top vulnerable
}

export function ZoneSectorWeaknessTable({
  weaknesses,
  showAll = false,
}: ZoneSectorWeaknessTableProps) {
  // Filter to show only zones with data, or all 9
  const displayWeaknesses = showAll
    ? weaknesses
    : weaknesses.filter((w) => w.totalShots >= 3);

  // Return null if no displayable data
  if (displayWeaknesses.length === 0) {
    return null;
  }

  // Group by zone for better visualization
  const zones: Array<"short" | "mid" | "deep"> = ["short", "mid", "deep"];
  // ABSOLUTE SECTORS (perspective-independent table locations)
  const sectors: Array<"top" | "middle" | "bottom"> = [
    "top",      // Y 0-33.33 (backhand side for left-side players)
    "middle",   // Y 33.33-66.67 (crossover/center)
    "bottom",   // Y 66.67-100 (forehand side for left-side players)
  ];

  // Map absolute sectors to user-friendly labels
  const sectorLabels: Record<"top" | "middle" | "bottom", string> = {
    "top": "Top Sector (BH)",
    "middle": "Middle Sector",
    "bottom": "Bottom Sector (FH)",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Zone-Sector Analysis</CardTitle>
        <p className="text-sm text-gray-500">
          Performance across 9 table zones (3 zones × 3 sectors)
        </p>
        {displayWeaknesses.some((w) => w.totalShots > 0 && w.totalShots < 3) && (
          <p className="text-xs text-gray-400 mt-2 pt-2 border-t">
            * Zones with fewer than 3 shots are marked with reduced opacity (insufficient data for reliable analysis)
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Table format: Rows = Zones, Columns = Sectors */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                 <th className="p-2 text-left text-sm font-semibold">Zone</th>
                 {sectors.map((sector) => (
                   <th
                     key={sector}
                     className="p-2 text-center text-sm font-semibold"
                   >
                     {sectorLabels[sector]}
                   </th>
                 ))}
               </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone} className="border-b">
                  <td className="p-2 font-semibold capitalize text-sm">{zone}</td>
                  {sectors.map((sector) => {
                    const weakness = weaknesses.find(
                      (w) => w.zone === zone && w.sector === sector
                    );

                    if (!weakness || weakness.totalShots === 0) {
                      return (
                        <td key={sector} className="p-2 text-center text-gray-400 text-xs">
                          No data
                        </td>
                      );
                    }

                    // Check if data is insufficient (below minimum threshold)
                    const isInsufficientData = weakness.totalShots > 0 && weakness.totalShots < 3;

                    const bgColor =
                      weakness.vulnerability === "high"
                        ? "bg-red-100"
                        : weakness.vulnerability === "medium"
                        ? "bg-yellow-100"
                        : "bg-green-100";

                    const textColor =
                      weakness.vulnerability === "high"
                        ? "text-red-800"
                        : weakness.vulnerability === "medium"
                        ? "text-yellow-800"
                        : "text-green-800";

                    return (
                      <td key={sector} className="shadow-sm">
                        <div className={`p-2 ${bgColor} ${textColor} ${isInsufficientData ? 'opacity-60' : ''}`}>
                          <div className="text-sm font-semibold">
                            {weakness.winRate.toFixed(0)}%
                            {isInsufficientData && (
                              <span className="text-xs ml-1 opacity-75">*</span>
                            )}
                          </div>
                          <div className="text-xs">
                            {weakness.wins}W / {weakness.losses}L
                            {isInsufficientData && (
                              <span className="text-xs ml-1 opacity-75">({weakness.totalShots} shots)</span>
                            )}
                          </div>
                          {weakness.dominantStroke && (
                            <div className="text-xs mt-1 truncate">
                              {formatStrokeName(weakness.dominantStroke)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendations for top 3 vulnerable */}
         {displayWeaknesses
           .filter((w) => w.totalShots >= 5 && w.vulnerability === "high")
           .slice(0, 3)
           .map((w, idx) => (
             <div
               key={idx}
               className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800"
             >
               <RecommendationText text={w.recommendation} />
             </div>
           ))}
      </CardContent>
    </Card>
  );
}
