'use client';

import { useParams, useSearchParams } from 'next/navigation';
import LiveScorer from '@/components/live-scorer/LiveScorer';

export default function MatchScorePage() {
  const params = useParams<{ id: string }>();
  const matchId = params.id;

  const searchParams = useSearchParams();
  const category = searchParams.get('category') as 'individual' | 'team' | undefined;

  console.log("Category from URL in matches/[id]/score:", category);

  return (
    <div className="bg-gray-50">
        <LiveScorer matchId={matchId} category={category} />
    </div>
  );
}