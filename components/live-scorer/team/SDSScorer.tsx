// components/live-scorer/team/SDSScorer.tsx
"use client";
import TeamMatchScorer from "./TeamMatchScorer";
import { TeamMatch } from "@/types/match.type" ;

export default function SDSScorer({ match }: { match: TeamMatch }) {
  return <TeamMatchScorer match={match} />;
}