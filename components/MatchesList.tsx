"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { IndividualMatch } from "@/types/match.type";
import MatchStatusBadge from "./MatchStatusBadge";

function PlayerAvatar({
  name,
  profileImage,
}: {
  name?: string;
  profileImage?: string;
}) {
  const fallbackInitial = name?.charAt(0).toUpperCase() || "?";

  return profileImage ? (
    <Image
      src={profileImage}
      alt={name || "Player"}
      width={24}
      height={24}
      className="w-6 h-6 rounded-full object-cover bg-white border shrink-0"
    />
  ) : (
    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold border shrink-0">
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
    <div className="divide-y divide-gray-100">
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
            className="block px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            {/* Line 1: Players & Score */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Side 1: Avatars + Name */}
              <div className={`flex items-center gap-1.5`}>
                <div className="flex items-center -space-x-1 shrink-0">
                  <PlayerAvatar
                    name={match.participants?.[0]?.fullName}
                    profileImage={match.participants?.[0]?.profileImage}
                  />
                  {isDoubles && (
                    <PlayerAvatar
                      name={match.participants?.[1]?.fullName}
                      profileImage={match.participants?.[1]?.profileImage}
                    />
                  )}
                </div>
                <span
                  className={`font-medium text-sm truncate ${
                    side1Won ? "text-green-600" : "text-gray-800"
                  }`}
                >
                  {side1Name}
                </span>
              </div>

              {/* Score */}
              {isCompleted && match.finalScore ? (
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                  {match.finalScore.side1Sets} - {match.finalScore.side2Sets}
                </span>
              ) : (
                <span className="text-xs text-gray-400">vs</span>
              )}

              {/* Side 2: Avatars + Name */}
              <div className={`flex items-center gap-1.5 ${side2Won ? "ring-2 ring-green-500 rounded-full pr-2" : ""}`}>
                <div className="flex items-center -space-x-1 shrink-0">
                  {isDoubles ? (
                    <>
                      <PlayerAvatar
                        name={match.participants?.[2]?.fullName}
                        profileImage={match.participants?.[2]?.profileImage}
                      />
                      <PlayerAvatar
                        name={match.participants?.[3]?.fullName}
                        profileImage={match.participants?.[3]?.profileImage}
                      />
                    </>
                  ) : (
                    <PlayerAvatar
                      name={match.participants?.[1]?.fullName}
                      profileImage={match.participants?.[1]?.profileImage}
                    />
                  )}
                </div>
                <span
                  className={`font-medium text-sm truncate ${
                    side2Won ? "text-green-600" : "text-gray-800"
                  }`}
                >
                  {side2Name}
                </span>
              </div>
            </div>

            {/* Line 2: Meta info + Status */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 capitalize">
                  {match.matchType?.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-400">
                  {match.createdAt ? format(new Date(match.createdAt), "dd MMM yyyy") : "—"}
                </span>
                {match.city && (
                  <>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{match.city}</span>
                  </>
                )}
              </div>
              <MatchStatusBadge status={match.status} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
