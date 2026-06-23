import React from "react";
import { Trophy } from "lucide-react";

interface TournamentTabProps {
  tournamentStats: any;
}

export default function TournamentTab({ tournamentStats }: TournamentTabProps) {
  const overview = tournamentStats?.overview || {
    totalTournaments: 0,
    tournamentWins: 0,
    finalsReached: 0,
    semifinalsReached: 0,
  };

  if (overview.totalTournaments === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No Tournament History
        </h3>
        <p className="text-gray-600">
          This player hasn't participated in any tournaments yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 mb-1">Tournaments</p>
          <p className="text-2xl font-bold text-blue-700">
            {overview.totalTournaments}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-600 mb-1">Championships</p>
          <p className="text-2xl font-bold text-yellow-700">
            {overview.tournamentWins}
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-600 mb-1">Finals</p>
          <p className="text-2xl font-bold text-purple-700">
            {overview.finalsReached}
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-600 mb-1">Semifinals</p>
          <p className="text-2xl font-bold text-orange-700">
            {overview.semifinalsReached}
          </p>
        </div>
      </div>

      {tournamentStats?.recent && tournamentStats.recent.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Tournaments</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {tournamentStats.recent.map((tournament: any, index: number) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {tournament.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {tournament.location || tournament.city}
                    </p>
                  </div>
                  {tournament.placement && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                      {tournament.placement}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
