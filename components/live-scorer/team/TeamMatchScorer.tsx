import React, { useState, useEffect } from "react";
import { Loader2, Play, CheckCircle, Trophy, ArrowLeft } from "lucide-react";

// Mock axios
const axiosInstance = {
  get: async (url: string) => {
    return {
      data: {
        match: {
          _id: "match123",
          format: "three_singles",
          status: "in_progress",
          team1: {
            name: "Warriors",
            players: [
              { _id: "p1", username: "player1", fullName: "John Doe" },
              { _id: "p2", username: "player2", fullName: "Jane Smith" },
              { _id: "p3", username: "player3", fullName: "Bob Johnson" },
            ]
          },
          team2: {
            name: "Champions",
            players: [
              { _id: "p4", username: "player4", fullName: "Alice Brown" },
              { _id: "p5", username: "player5", fullName: "Charlie Wilson" },
              { _id: "p6", username: "player6", fullName: "Diana Lee" },
            ]
          },
          subMatches: [
            {
              subMatchNumber: 1,
              matchLabel: "Match 1: A vs X",
              type: "singles",
              team1Players: [{ _id: "p1", fullName: "John Doe" }],
              team2Players: [{ _id: "p4", fullName: "Alice Brown" }],
              completed: false,
              finalScore: { team1Sets: 0, team2Sets: 0 },
              games: [{ gameNumber: 1, team1Score: 0, team2Score: 0 }],
              currentGame: 1,
            },
            {
              subMatchNumber: 2,
              matchLabel: "Match 2: B vs Y",
              type: "singles",
              team1Players: [{ _id: "p2", fullName: "Jane Smith" }],
              team2Players: [{ _id: "p5", fullName: "Charlie Wilson" }],
              completed: false,
              finalScore: { team1Sets: 0, team2Sets: 0 },
              games: [{ gameNumber: 1, team1Score: 0, team2Score: 0 }],
              currentGame: 1,
            },
            {
              subMatchNumber: 3,
              matchLabel: "Match 3: C vs Z",
              type: "singles",
              team1Players: [{ _id: "p3", fullName: "Bob Johnson" }],
              team2Players: [{ _id: "p6", fullName: "Diana Lee" }],
              completed: false,
              finalScore: { team1Sets: 0, team2Sets: 0 },
              games: [{ gameNumber: 1, team1Score: 0, team2Score: 0 }],
              currentGame: 1,
            },
          ],
          currentSubMatch: 1,
          finalScore: { team1Matches: 0, team2Matches: 0 },
          numberOfSetsPerSubMatch: 5,
        }
      }
    };
  },
  post: async (url: string, data: any) => {
    console.log("POST", url, data);
    return { data: { match: {}, message: "Score updated" } };
  }
};

type TeamMatchScorerProps = {
  matchId: string;
};

export default function TeamMatchScorer({ matchId }: TeamMatchScorerProps) {
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const { data } = await axiosInstance.get(`/matches/team/${matchId}`);
      setMatch(data.match);
    } catch (error) {
      console.error("Failed to fetch match:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMatch = async () => {
    try {
      setUpdating(true);
      const { data } = await axiosInstance.post(`/matches/team/${matchId}/initialize`, {});
      setMatch(data.match);
    } catch (error: any) {
      console.error("Failed to initialize:", error);
      alert(error.response?.data?.error || "Failed to initialize match");
    } finally {
      setUpdating(false);
    }
  };

  const updateScore = async (subMatchNumber: number, side: "team1" | "team2", delta: number) => {
    const subMatch = match.subMatches.find((sm: any) => sm.subMatchNumber === subMatchNumber);
    if (!subMatch || subMatch.completed) return;

    const currentGame = subMatch.games[subMatch.currentGame - 1];
    if (!currentGame) return;

    const newScore = side === "team1" 
      ? Math.max(0, currentGame.team1Score + delta)
      : Math.max(0, currentGame.team2Score + delta);

    try {
      setUpdating(true);
      await axiosInstance.post(`/matches/team/${matchId}/submatch`, {
        subMatchNumber,
        [`${side === "team1" ? "side1" : "side2"}Score`]: newScore,
        gameNumber: subMatch.currentGame,
      });
      
      // Refetch match to get updated state
      await fetchMatch();
    } catch (error) {
      console.error("Failed to update score:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Match not found</p>
      </div>
    );
  }

  // If match not initialized
  if (!match.subMatches || match.subMatches.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Play className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
            <p className="text-gray-600">
              {match.team1.name} vs {match.team2.name}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Format: {match.format.replace(/_/g, " ").toUpperCase()}
            </p>
          </div>

          <button
            onClick={initializeMatch}
            disabled={updating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Initialize Match
              </>
            )}
          </button>

          <p className="text-xs text-gray-500">
            Make sure both teams have assigned player positions before starting
          </p>
        </div>
      </div>
    );
  }

  const currentSubMatch = match.subMatches.find(
    (sm: any) => sm.subMatchNumber === match.currentSubMatch
  ) || match.subMatches[0];

  const currentGame = currentSubMatch.games[currentSubMatch.currentGame - 1];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold">
              {match.team1.name} vs {match.team2.name}
            </h1>
            <p className="text-sm text-gray-600">
              {match.format.replace(/_/g, " ").toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              {match.finalScore.team1Matches} - {match.finalScore.team2Matches}
            </p>
            <p className="text-xs text-gray-600">Overall Score</p>
          </div>
        </div>

        {/* Match Status */}
        {match.status === "completed" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-bold text-green-900">
              Match Completed! Winner: {match.winnerTeam === "team1" ? match.team1.name : match.team2.name}
            </p>
          </div>
        )}
      </div>

      {/* Current SubMatch Scorer */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-center mb-1">
            {currentSubMatch.matchLabel}
          </h2>
          <p className="text-sm text-center text-gray-600">
            Game {currentSubMatch.currentGame} • Best of {match.numberOfSetsPerSubMatch}
          </p>
          <div className="flex justify-center gap-8 mt-2">
            <span className="text-sm">
              Sets: <strong>{currentSubMatch.finalScore.team1Sets}</strong> - <strong>{currentSubMatch.finalScore.team2Sets}</strong>
            </span>
          </div>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Team 1 Side */}
          <div className="text-center">
            <div className="mb-2">
              {currentSubMatch.team1Players.map((p: any, idx: number) => (
                <p key={idx} className="font-medium text-sm">
                  {p.fullName || p.username}
                </p>
              ))}
            </div>
            <div className="text-6xl font-bold text-emerald-600 mb-4">
              {currentGame?.team1Score || 0}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => updateScore(currentSubMatch.subMatchNumber, "team1", 1)}
                disabled={updating || currentSubMatch.completed}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                +1
              </button>
              <button
                onClick={() => updateScore(currentSubMatch.subMatchNumber, "team1", -1)}
                disabled={updating || currentSubMatch.completed}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg disabled:opacity-50"
              >
                -1
              </button>
            </div>
          </div>

          {/* Team 2 Side */}
          <div className="text-center">
            <div className="mb-2">
              {currentSubMatch.team2Players.map((p: any, idx: number) => (
                <p key={idx} className="font-medium text-sm">
                  {p.fullName || p.username}
                </p>
              ))}
            </div>
            <div className="text-6xl font-bold text-rose-600 mb-4">
              {currentGame?.team2Score || 0}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => updateScore(currentSubMatch.subMatchNumber, "team2", 1)}
                disabled={updating || currentSubMatch.completed}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                +1
              </button>
              <button
                onClick={() => updateScore(currentSubMatch.subMatchNumber, "team2", -1)}
                disabled={updating || currentSubMatch.completed}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg disabled:opacity-50"
              >
                -1
              </button>
            </div>
          </div>
        </div>

        {currentSubMatch.completed && (
          <div className="text-center py-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-900">
              SubMatch Completed! Winner: {currentSubMatch.winnerSide === "team1" ? "Team 1" : "Team 2"}
            </p>
          </div>
        )}
      </div>

      {/* All SubMatches Overview */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-bold mb-4">Match Progress</h3>
        <div className="space-y-2">
          {match.subMatches.map((sm: any) => (
            <div
              key={sm.subMatchNumber}
              className={`p-3 rounded-lg border-2 ${
                sm.subMatchNumber === currentSubMatch.subMatchNumber
                  ? "border-blue-500 bg-blue-50"
                  : sm.completed
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{sm.matchLabel}</p>
                  <p className="text-xs text-gray-600">
                    {sm.team1Players.map((p: any) => p.fullName || p.username).join(" & ")}
                    {" vs "}
                    {sm.team2Players.map((p: any) => p.fullName || p.username).join(" & ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {sm.finalScore.team1Sets} - {sm.finalScore.team2Sets}
                  </p>
                  {sm.completed && (
                    <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}