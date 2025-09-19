'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type MatchType = any;

export default function MatchStatistics({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<MatchType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) fetchMatchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function fetchMatchStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
      } else {
        setMatch(null);
      }
    } catch (err) {
      console.error('Error fetching match stats:', err);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading statistics...</div>;
  if (!match) return <div className="p-8 text-center">Match not found</div>;

  const isTeamMatch = match.matchCategory === 'team';

  // friendly side names
  const side1Name = isTeamMatch ? match.team1?.name ?? 'Team 1' : match.players?.player1?.name ?? 'Side 1';
  const side2Name = isTeamMatch ? match.team2?.name ?? 'Team 2' : match.players?.player2?.name ?? 'Side 2';

  // playerStats may be a Map or a plain object depending on how Mongoose serialized it
  const getPlayerStats = (key: string) => {
    const ps = match.statistics?.playerStats;
    if (!ps) return {};
    if (typeof ps.get === 'function') {
      // Map-like
      return ps.get(key) || {};
    }
    // plain object
    return ps[key] || {};
  };

  const side1Stats: any = getPlayerStats('player1');
  const side2Stats: any = getPlayerStats('player2');

  // Shot types defined in your schema (friendly labels)
  const SHOT_TYPES = [
    { key: 'forehand_drive', label: 'Forehand Drive' },
    { key: 'backhand_drive', label: 'Backhand Drive' },
    { key: 'forehand_topspin', label: 'Forehand Topspin' },
    { key: 'backhand_topspin', label: 'Backhand Topspin' },
    { key: 'forehand_loop', label: 'Forehand Loop' },
    { key: 'backhand_loop', label: 'Backhand Loop' },
    { key: 'forehand_smash', label: 'Forehand Smash' },
    { key: 'backhand_smash', label: 'Backhand Smash' },
    { key: 'forehand_push', label: 'Forehand Push' },
    { key: 'backhand_push', label: 'Backhand Push' },
    { key: 'forehand_chop', label: 'Forehand Chop' },
    { key: 'backhand_chop', label: 'Backhand Chop' },
    { key: 'forehand_flick', label: 'Forehand Flick' },
    { key: 'backhand_flick', label: 'Backhand Flick' },
    { key: 'forehand_block', label: 'Forehand Block' },
    { key: 'backhand_block', label: 'Backhand Block' },
    { key: 'forehand_drop', label: 'Forehand Drop' },
    { key: 'backhand_drop', label: 'Backhand Drop' },
    { key: 'net_point', label: 'Net Point' },
    { key: 'serve_point', label: 'Serve' },
  ];

  // Build shot breakdown data for bar chart (one row per shotType)
  const shotBreakdownData = SHOT_TYPES.map((t) => {
    const s1 = (side1Stats?.detailedShots && side1Stats.detailedShots[t.key]) || 0;
    const s2 = (side2Stats?.detailedShots && side2Stats.detailedShots[t.key]) || 0;
    return { shotType: t.label, [side1Name]: s1, [side2Name]: s2 };
  });

  // Pie data per side (filter out zero entries)
  const buildPieData = (stats: any) => {
    if (!stats?.detailedShots) return [];
    return SHOT_TYPES.map((t) => ({ name: t.label, value: stats.detailedShots[t.key] || 0 })).filter((d) => d.value > 0);
  };
  const side1Pie = buildPieData(side1Stats);
  const side2Pie = buildPieData(side2Stats);

  // Performance (winners / errors / aces)
  const performanceData = [
    { category: 'Winners', [side1Name]: side1Stats.winners || 0, [side2Name]: side2Stats.winners || 0 },
    { category: 'UnforcedErrors', [side1Name]: side1Stats.unforcedErrors || 0, [side2Name]: side2Stats.unforcedErrors || 0 },
    { category: 'Aces', [side1Name]: side1Stats.aces || 0, [side2Name]: side2Stats.aces || 0 },
  ];

  // Game progression (use canonical side1Score/side2Score)
  const gameProgressionData =
    match.games?.map((g: any) => ({
      game: `Game ${g.gameNumber}`,
      [side1Name]: g.side1Score ?? g.player1Score ?? 0,
      [side2Name]: g.side2Score ?? g.player2Score ?? 0,
    })) || [];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

  // Helper to render winner label (supports side1/side2/team1/player1 etc.)
  const winnerLabel = (winner: string | undefined) => {
    if (!winner) return null;
    const w = String(winner).toLowerCase();
    if (w.includes('1')) return side1Name;
    if (w.includes('2')) return side2Name;
    return winner;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {side1Name} vs {side2Name}
          </CardTitle>
          <div className="text-center text-gray-600">{match.city} • {new Date(match.createdAt).toLocaleDateString()}</div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{match.finalScore?.side1Sets || 0}</div>
              <div className="text-lg font-semibold">{side1Name}</div>
              <div className="text-sm text-gray-600">Sets Won</div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <Badge variant={match.status === 'completed' ? 'default' : 'secondary'} className="mb-2">
                {String(match.status).toUpperCase()}
              </Badge>
              {match.winner && <div className="text-green-600 font-semibold">Winner: {winnerLabel(match.winner)}</div>}
            </div>

            <div>
              <div className="text-3xl font-bold text-red-600">{match.finalScore?.side2Sets || 0}</div>
              <div className="text-lg font-semibold">{side2Name}</div>
              <div className="text-sm text-gray-600">Sets Won</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shots">Shot Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          {isTeamMatch && <TabsTrigger value="teams">Team Stats</TabsTrigger>}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{match.statistics?.totalShots || 0}</div>
                <div className="text-sm text-gray-600">Total Shots</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{match.statistics?.totalRallies || 0}</div>
                <div className="text-sm text-gray-600">Total Rallies</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{match.statistics?.longestRally || 0}</div>
                <div className="text-sm text-gray-600">Longest Rally</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{match.matchDuration ? `${Math.floor(match.matchDuration / 60)}m` : '-'}</div>
                <div className="text-sm text-gray-600">Match Duration</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shot Analysis */}
        <TabsContent value="shots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shot Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {shotBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={shotBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shotType" interval={0} angle={-40} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey={side1Name} fill={COLORS[0]} />
                    <Bar dataKey={side2Name} fill={COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-8">No shot data available</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{side1Name} — Shot Share</CardTitle>
              </CardHeader>
              <CardContent>
                {side1Pie.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={side1Pie} dataKey="value" nameKey="name" outerRadius={100} label>
                        {side1Pie.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-8">No detailed shots for {side1Name}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{side2Name} — Shot Share</CardTitle>
              </CardHeader>
              <CardContent>
                {side2Pie.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={side2Pie} dataKey="value" nameKey="name" outerRadius={100} label>
                        {side2Pie.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-8">No detailed shots for {side2Name}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Winners, UnforcedErrors, Aces</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={side1Name} fill={COLORS[0]} />
                  <Bar dataKey={side2Name} fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{side1Name} Stats</CardTitle></CardHeader>
              <CardContent>
                <div className="flex justify-between"><span>Winners</span><strong>{side1Stats.winners || 0}</strong></div>
                <div className="flex justify-between"><span>UnforcedErrors</span><strong>{side1Stats.unforcedErrors || 0}</strong></div>
                <div className="flex justify-between"><span>Aces</span><strong>{side1Stats.aces || 0}</strong></div>
                <div className="pt-2">
                  <div className="text-sm text-gray-600 mb-1">Win Percentage</div>
                  <Progress value={side1Stats.winners ? Math.round((side1Stats.winners / (side1Stats.winners + (side1Stats.unforcedErrors || 0)))*100) : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{side2Name} Stats</CardTitle></CardHeader>
              <CardContent>
                <div className="flex justify-between"><span>Winners</span><strong>{side2Stats.winners || 0}</strong></div>
                <div className="flex justify-between"><span>UnforcedErrors</span><strong>{side2Stats.unforcedErrors || 0}</strong></div>
                <div className="flex justify-between"><span>Aces</span><strong>{side2Stats.aces || 0}</strong></div>
                <div className="pt-2">
                  <div className="text-sm text-gray-600 mb-1">Win Percentage</div>
                  <Progress value={side2Stats.winners ? Math.round((side2Stats.winners / (side2Stats.winners + (side2Stats.unforcedErrors || 0)))*100) : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Games */}
        <TabsContent value="games" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Game Progression</CardTitle></CardHeader>
            <CardContent>
              {gameProgressionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={gameProgressionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey={side1Name} stroke={COLORS[0]} strokeWidth={3} />
                    <Line type="monotone" dataKey={side2Name} stroke={COLORS[1]} strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-8">No game data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Game Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {match.games?.length ? match.games.map((g: any, i: number) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Game {g.gameNumber}</span>
                    {g.winner && <Badge variant="outline">Won by {g.winner === 'side1' ? side1Name : side2Name}</Badge>}
                  </div>
                  <div className="grid grid-cols-3 text-center">
                    <div>
                      <div className="text-xl font-bold text-blue-600">{g.side1Score}</div>
                      <div className="text-sm">{side1Name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">{g.shots?.length || 0} shots</div>
                      <div className="text-xs text-gray-600">{g.duration ? `${Math.floor(g.duration / 60)}m` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-600">{g.side2Score}</div>
                      <div className="text-sm">{side2Name}</div>
                    </div>
                  </div>
                </div>
              )) : <div className="text-center text-gray-500 py-8">No games completed yet</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Stats */}
        {isTeamMatch && (
          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Team Stats</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">{side1Name}</h3>
                  <p>Games Won: {match.statistics?.teamStats?.team1?.gamesWon || 0}</p>
                  <p>Games Lost: {match.statistics?.teamStats?.team1?.gamesLost || 0}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{side2Name}</h3>
                  <p>Games Won: {match.statistics?.teamStats?.team2?.gamesWon || 0}</p>
                  <p>Games Lost: {match.statistics?.teamStats?.team2?.gamesLost || 0}</p>
                </div>
              </CardContent>
            </Card>

            {/* optional: player contributions if available */}
            {match.statistics?.teamStats?.team1?.playerContributions?.length || match.statistics?.teamStats?.team2?.playerContributions?.length ? (
              <Card>
                <CardHeader><CardTitle>Player Contributions</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">{side1Name}</h4>
                      <div className="space-y-2">
                        {match.statistics?.teamStats?.team1?.playerContributions?.map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{p.playerName}</span>
                            <span className="text-sm text-gray-600">{p.gamesWon} wins</span>
                          </div>
                        )) || <div className="text-sm text-gray-500">No data</div>}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">{side2Name}</h4>
                      <div className="space-y-2">
                        {match.statistics?.teamStats?.team2?.playerContributions?.map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{p.playerName}</span>
                            <span className="text-sm text-gray-600">{p.gamesWon} wins</span>
                          </div>
                        )) || <div className="text-sm text-gray-500">No data</div>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
