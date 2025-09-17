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
        <LiveScorer matchId={matchId} />
    </div>
  );
}