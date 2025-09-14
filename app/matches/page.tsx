'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, BarChart3, Calendar } from 'lucide-react';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches');
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Table Tennis Matches</h1>
          <p className="text-gray-600">Manage your matches and tournaments</p>
        </div>
        
        <Link href="/matches/create">
          <Button size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Match
          </Button>
        </Link>
      </div>

      {/* Matches Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <Card key={match._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {match.matchCategory === 'individual' ? (
                    `${match.players?.player1?.name || 'Player 1'} vs ${match.players?.player2?.name || 'Player 2'}`
                  ) : (
                    `${match.team1?.name || 'Team 1'} vs ${match.team2?.name || 'Team 2'}`
                  )}
                </CardTitle>
                <Badge className={`${getStatusColor(match.status)} text-white`}>
                  {match.status}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(match.createdAt).toLocaleDateString()}
                </div>
                <div>{match.city}</div>
                <div className="capitalize">{match.matchType}</div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Score Display */}
              {match.finalScore && (
                <div className="flex justify-center items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {match.finalScore.player1Sets}
                    </div>
                    <div className="text-xs text-gray-600">Sets</div>
                  </div>
                  <div className="text-xl text-gray-400">-</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {match.finalScore.player2Sets}
                    </div>
                    <div className="text-xs text-gray-600">Sets</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center">
                {match.status === 'scheduled' || match.status === 'in_progress' ? (
                  <Link href={`/matches/${match._id}/score`}>
                    <Button size="sm" className="gap-1">
                      <Play className="w-3 h-3" />
                      {match.status === 'scheduled' ? 'Start' : 'Continue'}
                    </Button>
                  </Link>
                ) : null}
                
                <Link href={`/matches/${match._id}/stats`}>
                  <Button size="sm" variant="outline" className="gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Stats
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {matches.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-gray-600 mb-4">Create your first match to get started</p>
            <Link href="/matches/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Match
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}