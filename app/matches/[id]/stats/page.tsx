'use client';

import { useParams } from 'next/navigation';
import MatchStatistics from '@/components/MatchStatistics';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';

export default function MatchStatsPage() {
  const params = useParams();
  const matchId = params.id;

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
            <h1 className="text-xl font-semibold">Match Statistics</h1>
          </div>
          
          <Link href={`/matches/${matchId}/score`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Play className="w-4 h-4" />
              Live Score
            </Button>
          </Link>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="py-8">
        <MatchStatistics matchId={matchId} />
      </div>
    </div>
  );
}