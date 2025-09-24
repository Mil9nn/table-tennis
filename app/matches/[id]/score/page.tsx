'use client';

import { useParams } from 'next/navigation';
import LiveScorer from '@/components/live-scorer/LiveScorer';

export default function MatchScorePage() {
  const params = useParams();
  const matchId = params.id;

  return (
    <div className="bg-gray-50">
        <LiveScorer matchId={matchId} />
    </div>
  );
}