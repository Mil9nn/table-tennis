import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { isIndividualMatch, Match } from "@/types/match.type";

interface Props {
  match: Match;
}

export default function MatchScore({ match }: Props) {
  if (isIndividualMatch(match)) {
    return <IndividualMatchScore match={match} />;
  }
  return <TeamMatchScore match={match} />;
}

function IndividualMatchScore({ match }: { match: any }) {
  if (!match.finalScore) return null;

  const isDoubles = match.matchType === "doubles";
  const side1Won = match.winnerSide === "side1";
  const side2Won = match.winnerSide === "side2";
  const isCompleted = match.status === "completed";

  // For singles: show single player names
  // For doubles: show both players on each side
  const side1Players = isDoubles
    ? [
        match.participants?.[0]?.fullName || "Player 1",
        match.participants?.[1]?.fullName || "Player 2"
      ]
    : [match.participants?.[0]?.fullName || "Player 1"];

  const side2Players = isDoubles
    ? [
        match.participants?.[2]?.fullName || "Player 3",
        match.participants?.[3]?.fullName || "Player 4"
      ]
    : [match.participants?.[1]?.fullName || "Player 2"];

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 text-center">
      <div className="flex items-center justify-center gap-8">
        {/* Side 1 */}
        <div className="flex-1 text-right">
          <div className={`text-sm font-medium mb-2 ${
            side1Won ? "text-emerald-400" : "text-zinc-400"
          }`}>
            {side1Players.map((name, idx) => (
              <p key={idx} className="truncate">
                {name}
              </p>
            ))}
          </div>
          <span className={`text-4xl sm:text-5xl font-bold tabular-nums ${
            side1Won ? "text-emerald-400" : "text-white"
          }`}>
            {match.finalScore.side1Sets}
          </span>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl text-zinc-500 font-light">:</span>
        </div>

        {/* Side 2 */}
        <div className="flex-1 text-left">
          <div className={`text-sm font-medium mb-2 ${
            side2Won ? "text-emerald-400" : "text-zinc-400"
          }`}>
            {side2Players.map((name, idx) => (
              <p key={idx} className="truncate">
                {name}
              </p>
            ))}
          </div>
          <span className={`text-4xl sm:text-5xl font-bold tabular-nums ${
            side2Won ? "text-emerald-400" : "text-white"
          }`}>
            {match.finalScore.side2Sets}
          </span>
        </div>
      </div>
    </div>
  );
}

function TeamMatchScore({ match }: { match: any }) {
  const team1Won = match.winnerTeam === "team1";
  const team2Won = match.winnerTeam === "team2";
  const isCompleted = match.status === "completed";

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 text-center">
      <div className="flex items-center justify-center gap-6">
        {/* Team 1 */}
        <div className="flex-1 text-right">
          <p className={`text-sm font-medium mb-2 truncate ${
            team1Won ? "text-emerald-400" : "text-zinc-400"
          }`}>
            {match.team1.name}
          </p>
          <span className={`text-4xl sm:text-5xl font-bold tabular-nums ${
            team1Won ? "text-emerald-400" : "text-white"
          }`}>
            {match.finalScore.team1Matches}
          </span>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl text-zinc-500 font-light">:</span>
        </div>

        {/* Team 2 */}
        <div className="flex-1 text-left">
          <p className={`text-sm font-medium mb-2 truncate ${
            team2Won ? "text-emerald-400" : "text-zinc-400"
          }`}>
            {match.team2.name}
          </p>
          <span className={`text-4xl sm:text-5xl font-bold tabular-nums ${
            team2Won ? "text-emerald-400" : "text-white"
          }`}>
            {match.finalScore.team2Matches}
          </span>
        </div>
      </div>

      {isCompleted && match.winnerTeam && (
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
            <Trophy className="w-4 h-4" />
            {match.winnerTeam === "team1" ? match.team1.name : match.team2.name} wins
          </div>
        </div>
      )}
    </div>
  );
}