"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Users, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Flag
} from "lucide-react";

interface Player {
  userId: string;
  username: string;
  displayName: string;
}

interface SubMatch {
  subMatchNumber: number;
  matchType: 'singles' | 'doubles';
  player1: Player;
  player2: Player;
  player3?: Player;
  player4?: Player;
  winner?: Player;
  status: 'pending' | 'in-progress' | 'completed';
  score?: string;
  startTime?: number;
  endTime?: number;
}

interface Team {
  teamName: string;
  players: Player[];
  captain?: Player;
  matchesWon: number;
}

interface TeamMatchProps {
  matchId: string;
  team1: Team;
  team2: Team;
  subMatches: SubMatch[];
  teamFormat: string;
  bestOf: number;
  scorer: Player;
  onSubMatchStart: (subMatchNumber: number) => void;
  onSubMatchComplete: (subMatchNumber: number, winner: Player, score: string) => void;
  onMatchComplete: (winningTeam: Team) => void;
}

const TeamMatchInterface: React.FC<TeamMatchProps> = ({
  matchId,
  team1,
  team2,
  subMatches,
  teamFormat,
  bestOf,
  scorer,
  onSubMatchStart,
  onSubMatchComplete,
  onMatchComplete
}) => {
  const [currentSubMatch, setCurrentSubMatch] = useState<number>(1);
  const [matchProgress, setMatchProgress] = useState(0);

  // Calculate match progress
  useEffect(() => {
    const completedMatches = subMatches.filter(sm => sm.status === 'completed').length;
    const progress = (completedMatches / subMatches.length) * 100;
    setMatchProgress(progress);

    // Check if team match is complete
    const team1Wins = subMatches.filter(sm => 
      sm.status === 'completed' && 
      (sm.winner?.userId === sm.player1.userId || sm.winner?.userId === sm.player3?.userId)
    ).length;
    
    const team2Wins = subMatches.filter(sm => 
      sm.status === 'completed' && 
      (sm.winner?.userId === sm.player2.userId || sm.winner?.userId === sm.player4?.userId)
    ).length;

    const matchesNeeded = Math.ceil(subMatches.length / 2);
    
    if (team1Wins >= matchesNeeded) {
      onMatchComplete({ ...team1, matchesWon: team1Wins });
    } else if (team2Wins >= matchesNeeded) {
      onMatchComplete({ ...team2, matchesWon: team2Wins });
    }
  }, [subMatches, onMatchComplete, team1, team2]);

  const getSubMatchDescription = (subMatch: SubMatch) => {
    if (subMatch.matchType === 'singles') {
      return `${subMatch.player1.username} vs ${subMatch.player2.username}`;
    } else {
      return `${subMatch.player1.username}/${subMatch.player3?.username} vs ${subMatch.player2.username}/${subMatch.player4?.username}`;
    }
  };

  const getSubMatchPlayers = (subMatch: SubMatch) => {
    const team1Players = subMatch.matchType === 'singles' 
      ? [subMatch.player1] 
      : [subMatch.player1, subMatch.player3!];
    
    const team2Players = subMatch.matchType === 'singles' 
      ? [subMatch.player2] 
      : [subMatch.player2, subMatch.player4!];

    return { team1Players, team2Players };
  };

  const handleStartSubMatch = (subMatchNumber: number) => {
    setCurrentSubMatch(subMatchNumber);
    onSubMatchStart(subMatchNumber);
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTeamScore = (teamNumber: 1 | 2) => {
    return subMatches.filter(sm => {
      if (sm.status !== 'completed' || !sm.winner) return false;
      
      if (teamNumber === 1) {
        return sm.winner.userId === sm.player1.userId || sm.winner.userId === sm.player3?.userId;
      } else {
        return sm.winner.userId === sm.player2.userId || sm.winner.userId === sm.player4?.userId;
      }
    }).length;
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      
      {/* Match Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                Team Match - {teamFormat?.toUpperCase()}
              </CardTitle>
              <p className="text-gray-600">Best of {bestOf} games per match</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Scorer: {scorer?.displayName}</p>
              <Badge variant="outline">Match ID: {matchId}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* Team vs Team Header */}
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-blue-600">{team1?.teamName}</h2>
                <div className="text-4xl font-bold">{getTeamScore(1)}</div>
                <p className="text-sm text-gray-500">{team1.players.length} players</p>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-gray-400 font-medium">VS</span>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-red-500 rounded-full mt-2"></div>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600">{team2.teamName}</h2>
                <div className="text-4xl font-bold">{getTeamScore(2)}</div>
                <p className="text-sm text-gray-500">{team2.players.length} players</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Match Progress</span>
                <span>{subMatches.filter(sm => sm.status === 'completed').length}/{subMatches.length} matches completed</span>
              </div>
              <Progress value={matchProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subMatches.map((subMatch) => {
          const { team1Players, team2Players } = getSubMatchPlayers(subMatch);
          
          return (
            <Card 
              key={subMatch.subMatchNumber}
              className={`border-l-4 ${
                subMatch.status === 'completed' 
                  ? 'border-l-green-500 bg-green-50' 
                  : subMatch.status === 'in-progress'
                  ? 'border-l-blue-500 bg-blue-50'
                  : 'border-l-gray-300'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={subMatch.matchType === 'singles' ? 'default' : 'secondary'}>
                      {subMatch.matchType}
                    </Badge>
                    <span className="font-semibold">Match {subMatch.subMatchNumber}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {subMatch.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {subMatch.status === 'in-progress' && (
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-blue-600">LIVE</span>
                      </div>
                    )}
                    {subMatch.status === 'pending' && (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                
                {/* Players Display */}
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="font-semibold text-blue-600 mb-1">
                      {team1Players.map(p => p.username).join(' / ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {team1.teamName}
                    </div>
                  </div>
                  
                  <div className="px-4">
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="text-center flex-1">
                    <div className="font-semibold text-red-600 mb-1">
                      {team2Players.map(p => p.username).join(' / ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {team2.teamName}
                    </div>
                  </div>
                </div>

                {/* Score/Status */}
                {subMatch.status === 'completed' && subMatch.score && (
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">{subMatch.score}</div>
                    <div className="text-sm text-gray-600">
                      <Flag className="w-4 h-4 inline mr-1" />
                      Winner: {subMatch.winner?.username}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(subMatch.startTime)} - {formatTime(subMatch.endTime)}
                    </div>
                  </div>
                )}

                {subMatch.status === 'in-progress' && (
                  <div className="text-center">
                    <div className="animate-pulse text-blue-600 font-semibold">In Progress...</div>
                    <div className="text-xs text-gray-500">
                      Started: {formatTime(subMatch.startTime)}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {subMatch.status === 'pending' && (
                  <Button 
                    onClick={() => handleStartSubMatch(subMatch.subMatchNumber)}
                    className="w-full"
                    disabled={subMatches.some(sm => sm.status === 'in-progress')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Match {subMatch.subMatchNumber}
                  </Button>
                )}

                {subMatch.status === 'in-progress' && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {/* Navigate to match play screen */}}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Continue Playing
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Rosters */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">{team1.teamName} Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {team1.players.map((player, index) => (
                <div key={player.userId} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="font-medium">{player.displayName}</span>
                  <div className="flex items-center gap-2">
                    {team1.captain?.userId === player.userId && (
                      <Badge variant="outline" className="text-xs">Captain</Badge>
                    )}
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{team2.teamName} Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {team2.players.map((player, index) => (
                <div key={player.userId} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="font-medium">{player.displayName}</span>
                  <div className="flex items-center gap-2">
                    {team2.captain?.userId === player.userId && (
                      <Badge variant="outline" className="text-xs">Captain</Badge>
                    )}
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamMatchInterface;