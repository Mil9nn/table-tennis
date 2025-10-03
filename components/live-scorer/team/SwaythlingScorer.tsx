"use client";
import TeamMatchScorer from "./TeamMatchScorer";
import { TeamMatch } from "@/types/match.type";

export default function SwaythlingScorer({ match }: { match: TeamMatch }) {
  return <TeamMatchScorer match={match} />;
}