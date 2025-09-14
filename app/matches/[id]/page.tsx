'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, BarChart3, ArrowLeft, Users, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 text-center">Loading match...</div>;
  }

  if (!match) {
    return <div className="container mx-auto py-8 text-center">Match not found</div>;
  }

  const player1Name = match.players?.player1?.name || match.team1?.name || 'Player 1';
  const player2Name = match.players?.player2?.name || match.team2?.name || 'Player 2';

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/matches">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{player1Name} vs {player2Name}</h1>
          <p className="text-gray-600">Match Details</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Match Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Match Information</CardTitle>
                <Badge className={match.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}>
                  {match.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{match.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="capitalize">{match.matchType}</span>
                </div>
                <div>
                  <span>Best of {match.numberOfSets}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players/Teams */}
          <Card>
            <CardHeader>
              <CardTitle>
                {match.matchCategory === 'individual' ? 'Players' : 'Teams'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{player1Name}</h3>
                  {match.matchCategory === 'team' && match.team1?.players && (
                    <ul className="space-y-1 text-sm text-gray-600">
                      {match.team1.players.map((player, index) => (
                        <li key={index}>{player.name} ({player.role})</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{player2Name}</h3>
                  {match.matchCategory === 'team' && match.team2?.players && (
                    <ul className="space-y-1 text-sm text-gray-600">
                      {match.team2.players.map((player, index) => (
                        <li key={index}>{player.name} ({player.role})</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(match.status === 'scheduled' || match.status === 'in_progress') && (
                <Button className="w-full gap-2" asChild>
                  <Link href={`/matches/${matchId}/score`}>
                    <Play className="w-4 h-4" />
                    {match.status === 'scheduled' ? 'Start Match' : 'Continue Match'}
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/matches/${matchId}/stats`}>
                  <BarChart3 className="w-4 h-4" />
                  View Statistics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Current Score */}
          {match.finalScore && (
            <Card>
              <CardHeader>
                <CardTitle>Current Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {match.finalScore.player1Sets}
                    </div>
                    <div className="text-sm text-gray-600">{player1Name}</div>
                  </div>
                  <div className="text-2xl text-gray-400">-</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {match.finalScore.player2Sets}
                    </div>
                    <div className="text-sm text-gray-600">{player2Name}</div>
                  </div>
                </div>
                
                {match.winner && (
                  <div className="mt-4 text-center">
                    <Badge className="bg-green-500">
                      Winner: {match.winner === 'player1' ? player1Name : player2Name}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}