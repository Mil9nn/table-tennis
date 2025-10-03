// components/live-scorer/team/ExtendedScorer.tsx
"use client";
import TeamMatchScorer from "./TeamMatchScorer";
import { TeamMatch } from "@/types/match.type";

export default function ExtendedScorer({ match }: { match: TeamMatch }) {
  return <TeamMatchScorer match={match} />;
}