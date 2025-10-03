// components/live-scorer/team/ThreeSinglesScorer.tsx
"use client";
import TeamMatchScorer from "./TeamMatchScorer";
import { TeamMatch } from "@/types/match.type";

export default function ThreeSinglesScorer({ match }: { match: TeamMatch }) {
  return <TeamMatchScorer match={match} />;
}