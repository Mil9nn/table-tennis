"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { IndividualMatch } from "@/types/match.type";
import { getAvatarFallbackStyle } from "@/lib/utils";

function PlayerAvatar({
  name,
  profileImage,
  playerId,
}: {
  name?: string;
  profileImage?: string;
  playerId?: string;
}) {
  const fallbackInitial = name?.charAt(0).toUpperCase() || "?";
  const fallbackStyle = getAvatarFallbackStyle(playerId);

  return profileImage ? (
    <Image
      src={profileImage}
      alt={name || "Player"}
      width={24}
      height={24}
      className="w-6 h-6 rounded-full object-cover bg-white border shrink-0"
    />
  ) : (
    <div
      className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold border shrink-0"
      style={fallbackStyle}
    >
      {fallbackInitial}
    </div>
  );
}

export default function MatchesList({
  matches,
}: {
  matches: IndividualMatch[];
}) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No individual matches found</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-px bg-[#d9d9d9]">
      {matches.map((match) => {
        const isCompleted = match.status === "completed";
        const side1Won = match.winnerSide === "side1";
        const side2Won = match.winnerSide === "side2";
        const isDoubles = match.matchType !== "singles";

        // Get player names for each side
        const side1Name = isDoubles
          ? `${match.participants?.[0]?.fullName || "Player 1"} & ${match.participants?.[1]?.fullName || "Player 2"}`
          : match.participants?.[0]?.fullName || "Player 1";

        const side2Name = isDoubles
          ? `${match.participants?.[2]?.fullName || "Player 3"} & ${match.participants?.[3]?.fullName || "Player 4"}`
          : match.participants?.[1]?.fullName || "Player 2";

        return (
          <Link
            key={match._id}
            href={`/matches/${match._id}`}
            className="group block border border-[#d9d9d9] bg-[#ffffff] p-4 transition-colors hover:bg-[#3c6e71]"
          >
            {/* Line 1: Players & Score */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              {/* Side 1: Avatars + Name */}
              <div className={`flex items-center gap-1.5 min-w-0`}>
                <div className="flex items-center -space-x-1 shrink-0">
                  <PlayerAvatar
                    name={match.participants?.[0]?.fullName}
                    profileImage={match.participants?.[0]?.profileImage}
                    playerId={match.participants?.[0]?._id}
                  />
                  {isDoubles && (
                    <PlayerAvatar
                      name={match.participants?.[1]?.fullName}
                      profileImage={match.participants?.[1]?.profileImage}
                      playerId={match.participants?.[1]?._id}
                    />
                  )}
                </div>
                <span
                  className={`font-medium text-sm transition-colors group-hover:text-[#ffffff] ${
                    side1Won ? "text-green-600 group-hover:text-green-200" : "text-gray-800"
                  }`}
                >
                  {side1Name}
                </span>
              </div>

              {/* Score */}
              {isCompleted && match.finalScore ? (
                <span className="text-xs font-bold text-gray-700 px-1.5 py-0.5 rounded transition-colors group-hover:text-[#ffffff] shrink-0">
                  {match.finalScore.side1Sets} - {match.finalScore.side2Sets}
                </span>
              ) : (
                <span className="text-xs text-gray-400 transition-colors group-hover:text-[#ffffff] shrink-0">vs</span>
              )}

              {/* Side 2: Name + Avatars */}
              <div className={`flex items-center gap-1.5 min-w-0`}>
                <span
                  className={`font-medium text-sm transition-colors group-hover:text-[#ffffff] ${
                    side2Won ? "text-green-600 group-hover:text-green-200" : "text-gray-800"
                  }`}
                >
                  {side2Name}
                </span>
                <div className="flex items-center -space-x-1 shrink-0">
                  {isDoubles ? (
                    <>
                      <PlayerAvatar
                        name={match.participants?.[2]?.fullName}
                        profileImage={match.participants?.[2]?.profileImage}
                        playerId={match.participants?.[2]?._id}
                      />
                      <PlayerAvatar
                        name={match.participants?.[3]?.fullName}
                        profileImage={match.participants?.[3]?.profileImage}
                        playerId={match.participants?.[3]?._id}
                      />
                    </>
                  ) : (
                    <PlayerAvatar
                      name={match.participants?.[1]?.fullName}
                      profileImage={match.participants?.[1]?.profileImage}
                      playerId={match.participants?.[1]?._id}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Line 2: Meta info */}
            <div className="flex flex-wrap items-center gap-1 mt-3 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]">
              {match.tournament?.name && (
                <>
                  <span className="font-semibold text-gray-600">{match.tournament.name}</span>
                  <span>•</span>
                </>
              )}
              <span className="capitalize">
                {match.matchType?.replace("_", " ")}
              </span>
              <span>•</span>
              <span>
                {match.createdAt ? format(new Date(match.createdAt), "dd MMM yyyy") : "—"}
              </span>
              {match.city && (
                <>
                  <span>•</span>
                  <span>{match.city}</span>
                </>
              )}
            </div>
          </Link>
        );
      })}
    </section>
  );
}
