'use client';

import { useParams } from 'next/navigation';
import LiveScorer from '@/components/LiveScorer';

export default function MatchScorePage() {
  const params = useParams();
  const matchId = params.id;

  return (
    <div className="min-h-screen bg-gray-50">
        <LiveScorer matchId={matchId} />
    </div>
  );
}