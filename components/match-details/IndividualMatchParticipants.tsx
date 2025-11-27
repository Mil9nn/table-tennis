import Image from "next/image";
import { IndividualMatch } from "@/types/match.type";

interface Props {
  match: IndividualMatch;
}

export default function IndividualMatchParticipants({ match }: Props) {
  const isSingles = match.matchType === "singles";

  return (
    <div className="p-5">
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Players
      </h3>
      {isSingles ? (
        <SinglesParticipants match={match} />
      ) : (
        <DoublesParticipants match={match} />
      )}
    </div>
  );
}

function SinglesParticipants({ match }: Props) {
  const players = match.participants?.slice(0, 2);

  return (
    <div className="flex items-center justify-between gap-4">
      <PlayerCard player={players[0]} align="left" />

      <div className="flex-shrink-0">
        <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
          VS
        </span>
      </div>

      <PlayerCard player={players[1]} align="right" />
    </div>
  );
}

function DoublesParticipants({ match }: Props) {
  const teamA = match.participants?.slice(0, 2);
  const teamB = match.participants?.slice(2, 4);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 space-y-3">
        {teamA.map((p: any, i: number) => (
          <PlayerCard key={i} player={p} align="left" />
        ))}
      </div>

      <div className="flex-shrink-0">
        <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
          VS
        </span>
      </div>

      <div className="flex-1 space-y-3">
        {teamB.map((p: any, i: number) => (
          <PlayerCard key={i} player={p} align="right" />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ player, align = "left" }: { player: any; align?: "left" | "right" }) {
  const isRight = align === "right";

  return (
    <div className={`flex items-center gap-3 ${isRight ? "flex-row-reverse" : ""}`}>
      {player?.profileImage ? (
        <Image
          src={player.profileImage}
          alt={player.fullName || "Player"}
          width={44}
          height={44}
          className="w-11 h-11 shrink-0 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
        />
      ) : (
        <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-sm ring-2 ring-zinc-100 dark:ring-zinc-800">
          {(player?.fullName?.[0] || "?").toUpperCase()}
        </div>
      )}

      <p className={`text-sm text-zinc-800 dark:text-zinc-200 font-medium ${isRight ? "text-right" : ""}`}>
        {player?.fullName || "Unnamed"}
      </p>
    </div>
  );
}
