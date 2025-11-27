import { Trophy, TrendingUp, Target, Award, Calendar, MapPin, Percent, PercentCircle } from "lucide-react";
import { format } from "date-fns";

interface TournamentStats {
  overview: {
    totalTournaments: number;
    completedTournaments: number;
    ongoingTournaments: number;
    upcomingTournaments: number;
    tournamentWins: number;
    podiumFinishes: number;
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
  };
  byFormat: {
    round_robin: number;
    knockout: number;
  };
  byCategory: {
    individual: number;
    team: number;
  };
  tournaments: Array<{
    tournament: {
      _id: string;
      name: string;
      format: string;
      category: string;
      matchType: string;
      status: string;
      startDate: string;
      endDate?: string;
      city: string;
      venue?: string;
      totalParticipants: number;
    };
    stats: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
      setsWon: number;
      setsLost: number;
      setsDiff: number;
      pointsScored: number;
      pointsConceded: number;
      pointsDiff: number;
      position: number | string | null;
    };
  }>;
}

interface TournamentTabProps {
  tournamentStats: TournamentStats | null;
}

const TournamentTab = ({ tournamentStats }: TournamentTabProps) => {
  if (!tournamentStats) {
    return (
      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No tournament data available</p>
      </div>
    );
  }

  const { overview, byFormat, byCategory, tournaments } = tournamentStats;

  return (
    <div className="space-y-6">
      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              Tournaments
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            {overview.totalTournaments}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            {overview.completedTournaments} completed
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
              Championships
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {overview.tournamentWins}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
            {overview.podiumFinishes} podiums
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <PercentCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
              Win Rate
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {overview.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {overview.totalWins}W - {overview.totalLosses}L
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <p className="text-xs font-medium text-purple-900 dark:text-purple-100">
              Total Matches
            </p>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {overview.totalMatches}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            In tournaments
          </p>
        </div>
      </div>

      {/* Format & Category Breakdown */}
      <div className="grid md:grid-cols-2 gap-2">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            By Format
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Round Robin
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {byFormat.round_robin}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Knockout
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {byFormat.knockout}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            By Category
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Individual
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {byCategory.individual}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Team
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {byCategory.team}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament History */}
      <div className="bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Tournament History
        </h3>
        {tournaments.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
            No tournament participation yet
          </p>
        ) : (
          <div className="space-y-3">
            {tournaments.map((item) => (
              <div
                key={item.tournament._id}
                className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.tournament.name}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.tournament.status === "completed"
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            : item.tournament.status === "in_progress"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {item.tournament.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.tournament.startDate), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.tournament.city}
                      </span>
                      <span className="capitalize">
                        {item.tournament.format.replace("_", " ")}
                      </span>
                      <span className="capitalize">
                        {item.tournament.matchType.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {item.stats.position && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800">
                      {typeof item.stats.position === "number" &&
                      item.stats.position <= 3 ? (
                        <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : null}
                      <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        {typeof item.stats.position === "number"
                          ? `#${item.stats.position}`
                          : item.stats.position}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Matches
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.stats.matchesPlayed}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Record
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.stats.wins}W - {item.stats.losses}L
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Win Rate
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.stats.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Sets
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.stats.setsWon} - {item.stats.setsLost}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Points
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      +{item.stats.pointsDiff}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentTab;
