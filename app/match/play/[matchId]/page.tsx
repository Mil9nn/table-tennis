"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, RotateCcw, Play, Pause, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Match {
  _id: string;
  matchCategory: string;
  matchType: string;
  numberOfSets: number;
  city: string;
  status: string;
  players?: {
    player1?: { name: string };
    player2?: { name: string };
    player3?: { name: string };
    player4?: { name: string };
  };
  team1?: { 
    name: string; 
    players: Array<{ name: string; role: string }>;
  };
  team2?: { 
    name: string; 
    players: Array<{ name: string; role: string }>;
  };
  games: Array<{
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner?: string;
    shots: Array<any>;
  }>;
  finalScore?: {
    player1Sets: number;
    player2Sets: number;
  };
  winner?: string;
}

export default function PlayMatch({ params }: { params: { matchId: string } }) {
  const { matchId } = params;
  const router = useRouter();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentGame, setCurrentGame] = useState(1);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [selectedShotType, setSelectedShotType] = useState('');
  const [updating, setUpdating] = useState(false);
  const [currentServer, setCurrentServer] = useState<'player1' | 'player2'>('player1');
  const [serveCount, setServeCount] = useState(0);
  const [isDeuce, setIsDeuce] = useState(false);

  // Shot types for tracking
  const shotTypes = [
    { value: 'serve', label: 'Serve' },
    { value: 'forehand', label: 'Forehand' },
    { value: 'backhand', label: 'Backhand' },
    { value: 'smash', label: 'Smash' },
    { value: 'block', label: 'Block' },
    { value: 'push', label: 'Push' },
    { value: 'loop', label: 'Loop' },
    { value: 'drop', label: 'Drop Shot' },
    { value: 'lob', label: 'Lob' }
  ];

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch match');
      }
      
      const data = await response.json();
      setMatch(data.match);
      
      // Initialize current game scores
      const games = data.match.games || [];
      if (games.length > 0) {
        const latestGame = games[games.length - 1];
        
        // Only set scores if the game is not completed
        if (!latestGame.winner) {
          setCurrentGame(latestGame.gameNumber);
          setPlayer1Score(latestGame.player1Score);
          setPlayer2Score(latestGame.player2Score);
          updateServingLogic(latestGame.player1Score, latestGame.player2Score);
        } else {
          // If latest game is completed, prepare for next game
          const nextGameNumber = latestGame.gameNumber + 1;
          setCurrentGame(nextGameNumber);
          setPlayer1Score(0);
          setPlayer2Score(0);
          setCurrentServer('player1');
          setServeCount(0);
          setIsDeuce(false);
        }
        
        // Set match as active if it's in progress
        if (data.match.status === 'in_progress') {
          setIsMatchActive(true);
        }
      } else {
        // No games yet, start fresh
        setCurrentGame(1);
        setPlayer1Score(0);
        setPlayer2Score(0);
        setCurrentServer('player1');
        setServeCount(0);
        setIsDeuce(false);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  const updateServingLogic = (p1Score: number, p2Score: number) => {
    const totalPoints = p1Score + p2Score;
    
    // Check for deuce (both players at 10 or above and tied, or above 10)
    const newIsDeuce = (p1Score >= 10 && p2Score >= 10);
    setIsDeuce(newIsDeuce);
    
    if (newIsDeuce) {
      // In deuce, serve alternates every point
      setCurrentServer(totalPoints % 2 === 0 ? 'player1' : 'player2');
      setServeCount(0);
    } else {
      // Normal serving: 2 serves each, alternating
      const serveCycle = Math.floor(totalPoints / 2);
      setCurrentServer(serveCycle % 2 === 0 ? 'player1' : 'player2');
      setServeCount(totalPoints % 2);
    }
  };

  const checkGameWon = (p1Score: number, p2Score: number): 'player1' | 'player2' | null => {
    // Standard win: first to 11 points with at least 2 point lead
    if ((p1Score >= 11 || p2Score >= 11) && Math.abs(p1Score - p2Score) >= 2) {
      return p1Score > p2Score ? 'player1' : 'player2';
    }
    return null;
  };

  const updateScore = async (player: 'player1' | 'player2', increment: number) => {
    if (updating) return;
    
    setUpdating(true);
    
    const newPlayer1Score = player === 'player1' ? player1Score + increment : player1Score;
    const newPlayer2Score = player === 'player2' ? player2Score + increment : player2Score;
    
    // Prevent negative scores
    if (newPlayer1Score < 0 || newPlayer2Score < 0) {
      setUpdating(false);
      return;
    }
    
    // Check if game is won
    const gameWinner = checkGameWon(newPlayer1Score, newPlayer2Score);
    
    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameNumber: currentGame,
          player1Score: newPlayer1Score,
          player2Score: newPlayer2Score,
          shotData: selectedShotType && increment > 0 ? {
            player,
            shotType: selectedShotType,
            result: 'winner'
          } : null,
          gameWinner
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update score');
      }
      
      const data = await response.json();
      setMatch(data.match);
      
      // Update local scores
      setPlayer1Score(newPlayer1Score);
      setPlayer2Score(newPlayer2Score);
      
      // Update serving logic
      updateServingLogic(newPlayer1Score, newPlayer2Score);
      
      // If game is won, prepare for next game or end match
      if (gameWinner) {
        if (data.match.status === 'completed') {
          toast.success(`🏆 Match completed! Winner: ${data.match.winner === 'player1' ? getPlayerName('player1') : getPlayerName('player2')}`);
          setIsMatchActive(false);
        } else {
          toast.success(`🎾 Game ${currentGame} won by ${gameWinner === 'player1' ? getPlayerName('player1') : getPlayerName('player2')}`);
          
          // Prepare for next game
          setTimeout(() => {
            setCurrentGame(currentGame + 1);
            setPlayer1Score(0);
            setPlayer2Score(0);
            setCurrentServer('player1');
            setServeCount(0);
            setIsDeuce(false);
          }, 1000);
        }
      }
      
      // Clear shot type after successful point
      if (increment > 0 && selectedShotType) {
        setSelectedShotType('');
      }
      
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Failed to update score');
    } finally {
      setUpdating(false);
    }
  };

  const addPoint = (player: 'player1' | 'player2') => {
    updateScore(player, 1);
  };

  const subtractPoint = (player: 'player1' | 'player2') => {
    updateScore(player, -1);
  };

  const resetGame = () => {
    setPlayer1Score(0);
    setPlayer2Score(0);
    setCurrentServer('player1');
    setServeCount(0);
    setIsDeuce(false);
    toast.success('Game scores reset');
  };

  const startMatch = async () => {
    try {
      if (match?.status === 'scheduled') {
        const response = await fetch(`/api/matches/${matchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' })
        });
        
        if (response.ok) {
          setMatch(prev => prev ? { ...prev, status: 'in_progress' } : null);
        }
      }
      
      setIsMatchActive(true);
      toast.success('🏁 Match started!');
    } catch (error) {
      console.error('Error starting match:', error);
      toast.error('Failed to start match');
    }
  };

  const pauseMatch = () => {
    setIsMatchActive(false);
    toast.success('⏸️ Match paused');
  };

  const getPlayerName = (player: 'player1' | 'player2') => {
    if (!match) return player === 'player1' ? 'Player 1' : 'Player 2';
    
    if (match.matchCategory === 'individual') {
      if (match.matchType === 'singles') {
        return player === 'player1' 
          ? match.players?.player1?.name || 'Player 1'
          : match.players?.player2?.name || 'Player 2';
      } else {
        // Doubles or Mixed Doubles
        return player === 'player1'
          ? `${match.players?.player1?.name || 'P1A'} / ${match.players?.player2?.name || 'P1B'}`
          : `${match.players?.player3?.name || 'P2A'} / ${match.players?.player4?.name || 'P2B'}`;
      }
    } else {
      return player === 'player1'
        ? match.team1?.name || 'Team 1'
        : match.team2?.name || 'Team 2';
    }
  };

  const getMatchTypeDisplay = () => {
    if (!match) return '';
    
    const categoryMap: { [key: string]: string } = {
      'singles': 'Singles',
      'doubles': 'Doubles',
      'mixed_doubles': 'Mixed Doubles',
      'five_singles': '5 Singles',
      'single_double_single': 'SDS Format',
      'extended_format': 'Extended',
      'three_singles': '3 Singles',
      'custom': 'Custom'
    };
    
    return categoryMap[match.matchType] || match.matchType.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Match not found</h2>
          <Link href="/matches">
            <Button>Back to Matches</Button>
          </Link>
        </div>
      </div>
    );
  }

  const setsToWin = Math.ceil(match.numberOfSets / 2);
  const player1Name = getPlayerName('player1');
  const player2Name = getPlayerName('player2');
  const isDoublesFormat = match.matchType === 'doubles' || match.matchType === 'mixed_doubles';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/matches">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Matches
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">
                {isDoublesFormat ? (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {player1Name} vs {player2Name}
                  </div>
                ) : (
                  `${player1Name} vs ${player2Name}`
                )}
              </h1>
              <p className="text-sm text-gray-600">
                {match.city} • {getMatchTypeDisplay()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>
              {match.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {isDeuce && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                DEUCE
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-6">
        
        {/* Match Status Card */}
        {match.status === 'completed' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                🏆 MATCH COMPLETED!
              </h2>
              <p className="text-lg">
                Winner: <strong>{match.winner === 'player1' ? player1Name : player2Name}</strong>
              </p>
              <p className="text-gray-600">
                Final Score: {match.finalScore?.player1Sets} - {match.finalScore?.player2Sets}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Score Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-4">
              <span>Best of {match.numberOfSets} • Game {currentGame}</span>
              {isDeuce && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Deuce - Win by 2
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              
              {/* Player 1 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <h2 className="text-lg font-semibold text-center">
                    {player1Name}
                  </h2>
                  {currentServer === 'player1' && (
                    <div className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Serving"></div>
                  )}
                </div>
                <div className="text-6xl font-bold text-blue-600 mb-4">
                  {player1Score}
                </div>
                <div className="flex justify-center space-x-2 mb-4">
                  <Button 
                    size="lg" 
                    onClick={() => addPoint('player1')}
                    className="bg-green-500 hover:bg-green-600"
                    disabled={!isMatchActive || updating || match.status === 'completed'}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => subtractPoint('player1')}
                    disabled={!isMatchActive || updating || match.status === 'completed'}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  Sets Won: {match.finalScore?.player1Sets || 0}
                </div>
              </div>

              {/* Center Controls */}
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-gray-400">VS</div>
                
                <div className="text-sm text-gray-600">
                  {isDeuce ? (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                      <div className="font-semibold text-yellow-700">DEUCE</div>
                      <div className="text-xs">Alternating serves</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Serving</div>
                      <div className="text-xs">
                        {currentServer === 'player1' ? player1Name.split(' / ')[0] : player2Name.split(' / ')[0]}
                        {!isDeuce && ` (${2 - serveCount} serves left)`}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center space-x-2">
                  {match.status !== 'completed' && (
                    <Button 
                      variant={isMatchActive ? "destructive" : "default"}
                      onClick={isMatchActive ? pauseMatch : startMatch}
                      disabled={updating}
                    >
                      {isMatchActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isMatchActive ? 'Pause' : 'Start'}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={resetGame}
                    disabled={updating || match.status === 'completed'}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  First to {setsToWin} sets wins
                </div>
              </div>

              {/* Player 2 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <h2 className="text-lg font-semibold text-center">
                    {player2Name}
                  </h2>
                  {currentServer === 'player2' && (
                    <div className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Serving"></div>
                  )}
                </div>
                <div className="text-6xl font-bold text-red-600 mb-4">
                  {player2Score}
                </div>
                <div className="flex justify-center space-x-2 mb-4">
                  <Button 
                    size="lg" 
                    onClick={() => addPoint('player2')}
                    className="bg-green-500 hover:bg-green-600"
                    disabled={!isMatchActive || updating || match.status === 'completed'}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => subtractPoint('player2')}
                    disabled={!isMatchActive || updating || match.status === 'completed'}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  Sets Won: {match.finalScore?.player2Sets || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shot Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Shot Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Shot Type (Optional)
                </label>
                <Select value={selectedShotType} onValueChange={setSelectedShotType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose shot type for next point" />
                  </SelectTrigger>
                  <SelectContent>
                    {shotTypes.map((shot) => (
                      <SelectItem key={shot.value} value={shot.value}>
                        {shot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedShotType && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  Next point will be recorded as: <strong>{shotTypes.find(s => s.value === selectedShotType)?.label}</strong>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Games History */}
        {match.games && match.games.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Games History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {match.games.map((game, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-3 border rounded ${
                      game.gameNumber === currentGame && !game.winner ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <span className="font-medium">Game {game.gameNumber}</span>
                    <span className="font-semibold text-lg">
                      {game.player1Score} - {game.player2Score}
                    </span>
                    <div className="flex items-center space-x-2">
                      {game.winner && (
                        <Badge variant="outline" className="text-xs">
                          Won by {game.winner === 'player1' ? player1Name.split(' / ')[0] : player2Name.split(' / ')[0]}
                        </Badge>
                      )}
                      {game.gameNumber === currentGame && !game.winner && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex justify-center space-x-4">
          <Link href={`/matches/${matchId}/stats`}>
            <Button variant="outline">View Statistics</Button>
          </Link>
          <Link href={`/matches/${matchId}`}>
            <Button variant="outline">Match Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}