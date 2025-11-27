import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { getShotColor, renderCustomLabel } from "@/lib/match-stats-utils";

interface PlayerPieData {
  playerId: string;
  playerName: string;
  data: Array<{ name: string; value: number }>;
}

interface PlayerShotAnalysisProps {
  playerPieData: PlayerPieData[];
}

export function PlayerShotAnalysis({ playerPieData }: PlayerShotAnalysisProps) {
  return (
    <div className="space-y-4 p-2">
      <h3 className="font-semibold text-base mb-1 p-2">Player Shot Analysis</h3>

      {/* Player Cards */}
      {playerPieData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {playerPieData.map((player) => {
            const totalShots = player.data.reduce(
              (sum, item) => sum + item.value,
              0
            );

            return (
              <Card
                key={player.playerId}
                className="rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    {player.playerName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Total shots:&nbsp;
                    <span className="font-medium text-foreground">
                      {totalShots}
                    </span>
                  </p>
                </CardHeader>

                <CardContent>
                  {/* Smaller Chart */}
                  <div className="h-72 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={player.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={85} // reduced size
                          dataKey="value"
                        >
                          {player.data.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={getShotColor(entry.name)}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value: any, name: any) => [
                            `${value} shots`,
                            name,
                          ]}
                        />

                        <Legend
                          wrapperStyle={{ fontSize: "xs" }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Breakdown */}
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-semibold tracking-tight">
                      Top Shots
                    </h4>

                    {player.data
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 3)
                      .map((shot, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="flex items-center gap-2">
                            {shot.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-0.5"
                          >
                            {shot.value}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
