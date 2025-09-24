"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import ReactECharts from "echarts-for-react";
import Link from "next/link";
import { Shot } from "@/types/shot.type";

// --- 🔥 Shared color palette ---
const COLORS = {
  winners: "#10B981",
  errors: "#EF4444",
  lets: "#3B82F6",
  strokes: ["#F59E0B", "#8B5CF6", "#14B8A6", "#6366F1", "#EC4899"],
};

// --- 🔥 Helper: compute stats for given shots ---
function computeStats(shots: Shot[]) {
  const winners = { side1: 0, side2: 0 };
  const errors = { side1: 0, side2: 0 };
  const lets = { side1: 0, side2: 0 };
  const errorBreakdown = { net: 0, long: 0, serve: 0 };
  const shotTypes: Record<string, number> = {};

  (shots || []).forEach((s) => {
    if (!s) return;
    const side = s.side;

    if (s.outcome === "winner") {
      winners[side]++;
    } else if (s.outcome === "error") {
      errors[side]++;
      if (s.errorType) errorBreakdown[s.errorType]++;
    } else if (s.outcome === "let") {
      lets[side]++;
    }

    if (s.stroke) {
      shotTypes[s.stroke] = (shotTypes[s.stroke] || 0) + 1;
    }
  });

  return { winners, errors, lets, errorBreakdown, shotTypes };
}

export default function MatchStatsPage() {
  const params = useParams();
  const matchId = params.id;
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatch = async () => {
    try {
      let response = await fetch(`/api/matches/individual/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch({ ...data.match, matchCategory: "individual" });
        return;
      }

      response = await fetch(`/api/matches/team/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch({ ...data.match, matchCategory: "team" });
        return;
      }

      setMatch(null);
    } catch (error) {
      console.error("Error fetching match stats:", error);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center gap-2">
        <Loader2 className="animate-spin size-4" />
        <span className="text-sm">Loading stats...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-8 text-center">Match not found</div>
    );
  }

  // --- 🔥 Side naming ---
  const isSingles =
    match.matchCategory === "individual" && match.participants?.length === 2;
  const isDoubles =
    match.matchCategory === "individual" && match.participants?.length === 4;

  const side1Name = isSingles
    ? match.participants?.[0]?.fullName ||
      match.participants?.[0]?.username ||
      "Player 1"
    : isDoubles
    ? "Side 1"
    : match.team1?.name || "Team 1";

  const side2Name = isSingles
    ? match.participants?.[1]?.fullName ||
      match.participants?.[1]?.username ||
      "Player 2"
    : isDoubles
    ? "Side 2"
    : match.team2?.name || "Team 2";

  // --- 🔥 Match-level stats ---
  const shots = match.games?.flatMap((g: any) => g.shots || []) || [];
  const { winners, errors, lets, errorBreakdown, shotTypes } =
    computeStats(shots);

  const totalShots = shots.length;

  const winnerErrorData = [
    { name: side1Name, Winners: winners.side1, Errors: errors.side1 },
    { name: side2Name, Winners: winners.side2, Errors: errors.side2 },
  ];

  const errorData = Object.entries(errorBreakdown).map(([type, value]) => ({
    name: type,
    value,
  }));

  const strokeData = Object.entries(shotTypes).map(([type, value]) => ({
    name: type,
    value,
  }));

  // --- 🔥 Modern Pie Chart options ---
  const errorOptions = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "horizontal", bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 2 },
        label: {
          show: true,
          position: "inside",
          formatter: "{b}\n{d}%",
          fontSize: 12,
          fontWeight: "bold",
        },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: "bold" },
        },
        labelLine: { show: false },
        data: errorData.map((item, i) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: COLORS.strokes[i % COLORS.strokes.length] },
        })),
      },
    ],
  };

  return (
    <div className="px-4 py-8 space-y-10">
      {/* Go Back */}
      <Link href={`/matches/${matchId}`} className="flex items-center gap-2 text-sm hover:bg-blue-300 w-fit rounded-full px-3 py-1 bg-blue-100 text-blue-800 transition-all">
        <ArrowLeftCircle />
        <span className="font-semibold">Go back</span>
      </Link>
      {/* Header */}
      <section className="border text-center rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">
          {match.matchCategory === "individual" ? "Players" : "Teams"}
        </h2>
        {match.matchCategory === "individual" ? (
          <div className="grid grid-cols-2 gap-6">
            <ul className="space-y-1 text-sm font-semibold text-gray-600">
              {match.participants?.slice(0, 2).map((p: any, i: number) => (
                <li key={i}>{p.fullName || p.username || "Unknown"}</li>
              ))}
            </ul>
            <ul className="space-y-1 text-sm font-semibold text-gray-600">
              {match.participants?.slice(2, 4).map((p: any, i: number) => (
                <li key={i}>{p.fullName || p.username || "Unknown"}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{side1Name}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {match.team1?.players?.map((player: any, idx: number) => (
                  <li key={idx}>
                    {player.user?.fullName ||
                      player.user?.username ||
                      "Unnamed"}
                    {player.role ? ` (${player.role})` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{side2Name}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {match.team2?.players?.map((player: any, idx: number) => (
                  <li key={idx}>
                    {player.user?.fullName ||
                      player.user?.username ||
                      "Unnamed"}
                    {player.role ? ` (${player.role})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* --- MATCH LEVEL --- */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Overall Match Stats</h2>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around text-lg font-semibold">
            {/* <span>Total Shots: {totalShots}</span> */}
            <span>
              Winners: {winners.side1 + winners.side2} / Errors:{" "}
              {errors.side1 + errors.side2}
            </span>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Winners vs Errors */}
          <Card>
            <CardHeader>
              <CardTitle>Winners vs Errors</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winnerErrorData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Winners" fill={COLORS.winners} />
                  <Bar dataKey="Errors" fill={COLORS.errors} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Error Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Error Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ReactECharts
                option={errorOptions}
                style={{ height: "100%", width: "100%" }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Shot Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Shot Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strokeData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={COLORS.lets}>
                  {strokeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS.strokes[i % COLORS.strokes.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* --- PER GAME LEVEL --- */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Per Game Stats</h2>
        {match.games?.map((game: any, idx: number) => {
          const { winners, errors, lets, errorBreakdown, shotTypes } =
            computeStats(game.shots || []);

          const gWinnerErrorData = [
            { name: side1Name, Winners: winners.side1, Errors: errors.side1 },
            { name: side2Name, Winners: winners.side2, Errors: errors.side2 },
          ];

          const gErrorData = Object.entries(errorBreakdown).map(
            ([name, value]) => ({ name, value })
          );

          const gStrokeData = Object.entries(shotTypes).map(
            ([name, value]) => ({
              name,
              value,
            })
          );

          const gErrorOptions = {
            ...errorOptions,
            series: [
              {
                ...errorOptions.series[0],
                data: gErrorData.map((item, i) => ({
                  value: item.value,
                  name: item.name,
                  itemStyle: {
                    color: COLORS.strokes[i % COLORS.strokes.length],
                  },
                })),
              },
            ],
          };

          return (
            <Card key={idx} className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                Game {game.gameNumber || idx + 1}{" "}
                <span className="text-indigo-500 text-sm">
                  ({game.side1Score}-{game.side2Score})
                </span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={gWinnerErrorData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Winners" fill={COLORS.winners} />
                    <Bar dataKey="Errors" fill={COLORS.errors} />
                  </BarChart>
                </ResponsiveContainer>

                <ReactECharts
                  option={gErrorOptions}
                  style={{ height: 250, width: "100%" }}
                />
              </div>

              {gStrokeData.length > 0 && (
                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gStrokeData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill={COLORS.lets}>
                        {gStrokeData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={COLORS.strokes[i % COLORS.strokes.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
