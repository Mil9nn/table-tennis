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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function MatchStatistics({ matchId }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) {
      fetchMatchStats();
    }
  }, [matchId]);

  const fetchMatchStats = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);
      }
    } catch (error) {
      console.error('Error fetching match stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading statistics...</div>;
  }

  if (!match) {
    return <div className="p-8 text-center">Match not found</div>;
  }

  const player1Name = match.players?.player1?.name || 'Player 1';
  const player2Name = match.players?.player2?.name || 'Player 2';
  
  const player1Stats = match.statistics?.playerStats?.player1 || {};
  const player2Stats = match.statistics?.playerStats?.player2 || {};

  // Prepare shot breakdown data for charts
  const shotBreakdownData = [
    {
      shotType: 'Forehand',
      [player1Name]: player1Stats.shotBreakdown?.forehand || 0,
      [player2Name]: player2Stats.shotBreakdown?.forehand || 0,
    },
    {
      shotType: 'Backhand',
      [player1Name]: player1Stats.shotBreakdown?.backhand || 0,
      [player2Name]: player2Stats.shotBreakdown?.backhand || 0,
    },
    {
      shotType: 'Smash',
      [player1Name]: player1Stats.shotBreakdown?.smash || 0,
      [player2Name]: player2Stats.shotBreakdown?.smash || 0,
    },
    {
      shotType: 'Serve',
      [player1Name]: player1Stats.shotBreakdown?.serve || 0,
      [player2Name]: player2Stats.shotBreakdown?.serve || 0,
    },
  ];

  // Winner vs Error data
  const performanceData = [
    {
      category: 'Winners',
      [player1Name]: player1Stats.winners || 0,
      [player2Name]: player2Stats.winners || 0,
    },
    {
      category: 'Errors',
      [player1Name]: player1Stats.errors || 0,
      [player2Name]: player2Stats.errors || 0,
    },
    {
      category: 'Aces',
      [player1Name]: player1Stats.aces || 0,
      [player2Name]: player2Stats.aces || 0,
    },
  ];

  // Game progression data
  const gameProgressionData = match.games?.map((game, index) => ({
    game: `Game ${game.gameNumber}`,
    [player1Name]: game.player1Score,
    [player2Name]: game.player2Score,
  })) || [];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      
      {/* Match Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Match Statistics: {player1Name} vs {player2Name}
          </CardTitle>
          <div className="text-center text-gray-600">
            {match.city} • {new Date(match.createdAt).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {match.finalScore?.player1Sets || 0}
              </div>
              <div className="text-lg font-semibold">{player1Name}</div>
              <div className="text-sm text-gray-600">Sets Won</div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <Badge 
                variant={match.status === 'completed' ? 'default' : 'secondary'}
                className="mb-2"
              >
                {match.status.toUpperCase()}
              </Badge>
              {match.winner && (
                <div className="text-green-600 font-semibold">
                  Winner: {match.winner === 'player1' ? player1Name : player2Name}
                </div>
              )}
            </div>
            
            <div>
              <div className="text-3xl font-bold text-red-600">
                {match.finalScore?.player2Sets || 0}
              </div>
              <div className="text-lg font-semibold">{player2Name}</div>
              <div className="text-sm text-gray-600">Sets Won</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shots">Shot Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="games">Game Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {match.statistics?.totalShots || 0}
                </div>
                <div className="text-sm text-gray-600">Total Shots</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {match.statistics?.longestRally || 0}
                </div>
                <div className="text-sm text-gray-600">Longest Rally</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {match.games?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Games Played</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {match.matchDuration ? `${Math.floor(match.matchDuration / 60)}m` : '-'}
                </div>
                <div className="text-sm text-gray-600">Match Duration</div>
              </CardContent>
            </Card>
          </div>

          {/* Player Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">{player1Name} Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Winners:</span>
                  <span className="font-semibold">{player1Stats.winners || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors:</span>
                  <span className="font-semibold">{player1Stats.errors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aces:</span>
                  <span className="font-semibold">{player1Stats.aces || 0}</span>
                </div>
                <div className="pt-2">
                  <div className="text-sm text-gray-600 mb-1">Win Percentage</div>
                  <Progress 
                    value={player1Stats.winners ? (player1Stats.winners / (player1Stats.winners + player1Stats.errors) * 100) : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">{player2Name} Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Winners:</span>
                  <span className="font-semibold">{player2Stats.winners || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors:</span>
                  <span className="font-semibold">{player2Stats.errors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aces:</span>
                  <span className="font-semibold">{player2Stats.aces || 0}</span>
                </div>
                <div className="pt-2">
                  <div className="text-sm text-gray-600 mb-1">Win Percentage</div>
                  <Progress 
                    value={player2Stats.winners ? (player2Stats.winners / (player2Stats.winners + player2Stats.errors) * 100) : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shot Analysis Tab */}
        <TabsContent value="shots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shot Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shotBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="shotType" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={player1Name} fill="#3b82f6" />
                  <Bar dataKey={player2Name} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Winners vs Errors Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={player1Name} fill="#10b981" />
                  <Bar dataKey={player2Name} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Progression</CardTitle>
            </CardHeader>
            <CardContent>
              {gameProgressionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={gameProgressionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey={player1Name} stroke="#3b82f6" strokeWidth={3} />
                    <Line type="monotone" dataKey={player2Name} stroke="#ef4444" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No game data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Game Details */}
          <Card>
            <CardHeader>
              <CardTitle>Game Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {match.games?.map((game, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Game {game.gameNumber}</span>
                      {game.winner && (
                        <Badge variant="outline">
                          Won by {game.winner === 'player1' ? player1Name : player2Name}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {game.player1Score}
                        </div>
                        <div className="text-sm">{player1Name}</div>
                      </div>
                      
                      <div className="flex flex-col justify-center">
                        <div className="text-xs text-gray-600">
                          {game.duration ? `${Math.floor(game.duration / 60)}:${(game.duration % 60).toString().padStart(2, '0')}` : '-'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {game.shots?.length || 0} shots
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {game.player2Score}
                        </div>
                        <div className="text-sm">{player2Name}</div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-8">
                    No games completed yet
                  </div>
                )}
              </div> 
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}