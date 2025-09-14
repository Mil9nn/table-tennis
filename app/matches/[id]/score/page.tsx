'use client';

import { useParams } from 'next/navigation';
import LiveScorer from '@/components/LiveScorer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default function MatchScorePage() {
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
            <h1 className="text-xl font-semibold">Live Match</h1>
          </div>
          
          <Link href={`/matches/${matchId}/stats`}>
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Scorer */}
      <div className="py-8">
        <LiveScorer matchId={matchId} />
      </div>
    </div>
  );
}