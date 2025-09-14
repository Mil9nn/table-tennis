'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Minus, RotateCcw, Play, Pause } from 'lucide-react';

export default function LiveScorer({ matchId }) {
  const [match, setMatch] = useState(null);
  const [currentGame, setCurrentGame] = useState(1);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [selectedShotType, setSelectedShotType] = useState('');
  const [rallyCount, setRallyCount] = useState(0);

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

  // Load match data
  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);
        
        // Set current scores from latest game
        const latestGame = data.match.games[data.match.games.length - 1];
        if (latestGame) {
          setPlayer1Score(latestGame.player1Score);
          setPlayer2Score(latestGame.player2Score);
          setCurrentGame(latestGame.gameNumber);
        }
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    }
  };

  const updateScore = async (player, points, shotType = null, result = null) => {
    const newPlayer1Score = player === 'player1' ? player1Score + points : player1Score;
    const newPlayer2Score = player === 'player2' ? player2Score + points : player2Score;
    
    // Check if game is won (11 points, must win by 2)
    let gameWinner = null;
    if ((newPlayer1Score >= 11 || newPlayer2Score >= 11) && 
        Math.abs(newPlayer1Score - newPlayer2Score) >= 2) {
      gameWinner = newPlayer1Score > newPlayer2Score ? 'player1' : 'player2';
    }
    
    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameNumber: currentGame,
          player1Score: newPlayer1Score,
          player2Score: newPlayer2Score,
          shotData: shotType ? {
            player,
            shotType,
            result: result || 'in_play'
          } : null,
          gameWinner
        })
      });
      
      if (response.ok) {
        setPlayer1Score(newPlayer1Score);
        setPlayer2Score(newPlayer2Score);
        setRallyCount(rallyCount + 1);
        
        // If game is won, reset for next game
        if (gameWinner) {
          setCurrentGame(currentGame + 1);
          setPlayer1Score(0);
          setPlayer2Score(0);
          setRallyCount(0);
          await fetchMatch(); // Refresh match data
        }
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const addPoint = (player) => {
    updateScore(player, 1, selectedShotType, 'winner');
  };

  const subtractPoint = (player) => {
    if ((player === 'player1' && player1Score > 0) || 
        (player === 'player2' && player2Score > 0)) {
      updateScore(player, -1);
    }
  };

  const resetGame = () => {
    setPlayer1Score(0);
    setPlayer2Score(0);
    setRallyCount(0);
  };

  const startMatch = () => {
    setIsMatchActive(true);
  };

  const pauseMatch = () => {
    setIsMatchActive(false);
  };

  if (!match) {
    return <div className="p-8 text-center">Loading match...</div>;
  }

  const player1Name = match.players?.player1?.name || 'Player 1';
  const player2Name = match.players?.player2?.name || 'Player 2';
  const setsToWin = Math.ceil(match.numberOfSets / 2);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Match Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {match.matchType.toUpperCase()} MATCH
          </CardTitle>
          <div className="text-center text-gray-600">
            {match.city} • Best of {match.numberOfSets}
          </div>
        </CardHeader>
      </Card>

      {/* Score Display */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 items-center">
            
            {/* Player 1 */}
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{player1Name}</h2>
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {player1Score}
              </div>
              <div className="flex justify-center space-x-2 mb-4">
                <Button 
                  size="lg" 
                  onClick={() => addPoint('player1')}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={!isMatchActive}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => subtractPoint('player1')}
                  disabled={!isMatchActive}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                Sets Won: {match.finalScore?.player1Sets || 0}
              </div>
            </div>

            {/* Center Info */}
            <div className="text-center space-y-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Game {currentGame}
              </Badge>
              
              <div className="text-sm text-gray-600">
                Rally: {rallyCount}
              </div>
              
              <div className="flex justify-center space-x-2">
                <Button 
                  variant={isMatchActive ? "destructive" : "default"}
                  onClick={isMatchActive ? pauseMatch : startMatch}
                >
                  {isMatchActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isMatchActive ? 'Pause' : 'Start'}
                </Button>
                
                <Button variant="outline" onClick={resetGame}>
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Player 2 */}
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{player2Name}</h2>
              <div className="text-6xl font-bold text-red-600 mb-4">
                {player2Score}
              </div>
              <div className="flex justify-center space-x-2 mb-4">
                <Button 
                  size="lg" 
                  onClick={() => addPoint('player2')}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={!isMatchActive}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => subtractPoint('player2')}
                  disabled={!isMatchActive}
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
                Select Shot Type
              </label>
              <Select value={selectedShotType} onValueChange={setSelectedShotType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose shot type" />
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
              <div className="text-sm text-gray-600">
                Next point will be recorded as: <strong>{shotTypes.find(s => s.value === selectedShotType)?.label}</strong>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Match Status */}
      {match.status === 'completed' && (
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              MATCH COMPLETED!
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

      {/* Game History */}
      {match.games && match.games.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Games History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {match.games.map((game, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <span>Game {game.gameNumber}</span>
                  <span className="font-semibold">
                    {game.player1Score} - {game.player2Score}
                  </span>
                  {game.winner && (
                    <Badge variant="outline">
                      Won by {game.winner === 'player1' ? player1Name : player2Name}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}