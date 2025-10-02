// components/live-scorer/team/TeamMatchScorer.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Loader2, Users, Trophy, ArrowLeft, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamMatchScorerProps {
  matchId: string;
}

// Simple inline scorer for each submatch game
function SubMatchGameScorer({ 
  matchId, 
  subMatchNumber, 
  currentGame,
  team1Name,
  team2Name,
  onScoreUpdate 
}: any) {
  const [updating, setUpdating] = useState(false);

  const updateScore = async (team: "team1" | "team2", increment: number) => {
    setUpdating(true);
    try {
      const newScore = {
        side1Score: currentGame.team1Score + (team === "team1" ? increment : 0),
        side2Score: currentGame.team2Score + (team === "team2" ? increment : 0),
      };

      await axiosInstance.post(`/matches/team/${matchId}/submatch`, {
        subMatchNumber,
        gameNumber: currentGame.gameNumber,
        ...newScore,
      });

      onScoreUpdate();
      toast.success("Score updated");
    } catch (error) {
      console.error("Score update error:", error);
      toast.error("Failed to update score");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-center text-lg font-semibold mb-6">
        Game {currentGame.gameNumber}
      </h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Team 1 */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">{team1Name}</p>
          <div className="text-6xl font-bold text-blue-600 mb-4">
            {currentGame.team1Score}
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              size="lg"
              onClick={() => updateScore("team1", 1)}
              disabled={updating}
              className="w-20 h-20 text-2xl"
            >
              <Plus className="w-8 h-8" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => updateScore("team1", -1)}
              disabled={updating || currentGame.team1Score === 0}
              className="w-20 h-20 text-2xl"
            >
              <Minus className="w-8 h-8" />
            </Button>
          </div>
        </div>

        {/* Team 2 */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">{team2Name}</p>
          <div className="text-6xl font-bold text-red-600 mb-4">
            {currentGame.team2Score}
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              size="lg"
              onClick={() => updateScore("team2", 1)}
              disabled={updating}
              className="w-20 h-20 text-2xl"
            >
              <Plus className="w-8 h-8" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => updateScore("team2", -1)}
              disabled={updating || currentGame.team2Score === 0}
              className="w-20 h-20 text-2xl"
            >
              <Minus className="w-8 h-8" />
            </Button>
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="mt-6 text-center text-sm text-gray-500">
        {currentGame.completed ? (
          <span className="text-green-600 font-semibold">
            Game Complete - {currentGame.winnerSide === "team1" ? team1Name : team2Name} Won
          </span>
        ) : (
          <span>Game in progress</span>
        )}
      </div>
    </div>
  );
}

export default function TeamMatchScorer({ matchId }: TeamMatchScorerProps) {
  const router = useRouter();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSubMatchIndex, setCurrentSubMatchIndex] = useState(0);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const { data } = await axiosInstance.get(`/matches/team/${matchId}`);
      setMatch(data.match);
      
      // Find the first incomplete submatch
      const firstIncomplete = data.match.subMatches?.findIndex(
        (sm: any) => !sm.completed
      );
      setCurrentSubMatchIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    } catch (error) {
      console.error("Error fetching team match:", error);
      toast.error("Failed to load match");
    } finally {
      setLoading(false);
    }
  };

  const handleSubMatchComplete = async () => {
    await fetchMatch();
    
    // Move to next submatch if available
    if (match && currentSubMatchIndex < match.subMatches.length - 1) {
      setCurrentSubMatchIndex(currentSubMatchIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600">Match not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isMatchComplete = match.status === "completed";
  const currentSubMatch = match.subMatches?.[currentSubMatchIndex];
  const currentGame = currentSubMatch?.games?.find((g: any) => !g.completed) || 
                      currentSubMatch?.games?.[currentSubMatch.games.length - 1];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/matches/${matchId}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {match.team1?.name} vs {match.team2?.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {match.format?.replace(/_/g, " ").toUpperCase()}
              </p>
            </div>

            <div className="w-20" />
          </div>

          {/* Match Score */}
          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-600">{match.team1?.name}</p>
              <p className="text-4xl font-bold text-blue-600">
                {match.finalScore?.team1Matches || 0}
              </p>
            </div>
            <div className="text-2xl text-gray-400">-</div>
            <div className="text-center">
              <p className="text-sm text-gray-600">{match.team2?.name}</p>
              <p className="text-4xl font-bold text-red-600">
                {match.finalScore?.team2Matches || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {isMatchComplete ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Match Complete!</h2>
            <p className="text-gray-600 text-lg">
              Winner: {match.winnerTeam === "team1" ? match.team1?.name : match.team2?.name}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Final Score: {match.finalScore.team1Matches} - {match.finalScore.team2Matches}
            </p>
          </div>
        ) : (
          <>
            {/* SubMatch Navigation */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Sub-Matches
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {match.subMatches?.map((sm: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSubMatchIndex(index)}
                    disabled={sm.completed}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      currentSubMatchIndex === index
                        ? "border-blue-600 bg-blue-50"
                        : sm.completed
                        ? "border-green-200 bg-green-50 cursor-not-allowed"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      Match {sm.subMatchNumber}
                    </div>
                    <div className="font-medium text-sm">
                      {sm.type === "singles" ? "Singles" : "Doubles"}
                    </div>
                    {sm.completed && (
                      <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {sm.winnerSide === "team1" ? "T1" : "T2"} Won
                      </div>
                    )}
                    {!sm.completed && (
                      <div className="text-xs text-gray-500 mt-1">
                        {sm.finalScore.team1Sets} - {sm.finalScore.team2Sets}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Current SubMatch Info */}
            {currentSubMatch && (
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h3 className="font-semibold mb-2">
                  Sub-Match {currentSubMatch.subMatchNumber} - {currentSubMatch.type}
                </h3>
                <div className="text-sm text-gray-600">
                  <div className="flex gap-4">
                    <span>Team 1: {currentSubMatch.team1Players?.map((p: any) => p.fullName || p.username).join(", ")}</span>
                    <span>vs</span>
                    <span>Team 2: {currentSubMatch.team2Players?.map((p: any) => p.fullName || p.username).join(", ")}</span>
                  </div>
                  <div className="mt-2">
                    Sets: {currentSubMatch.finalScore.team1Sets} - {currentSubMatch.finalScore.team2Sets}
                  </div>
                </div>
              </div>
            )}

            {/* Current Game Scorer */}
            {currentSubMatch && currentGame && !currentSubMatch.completed && (
              <SubMatchGameScorer
                matchId={matchId}
                subMatchNumber={currentSubMatch.subMatchNumber}
                currentGame={currentGame}
                team1Name={match.team1?.name}
                team2Name={match.team2?.name}
                onScoreUpdate={fetchMatch}
              />
            )}

            {/* SubMatch Complete Message */}
            {currentSubMatch?.completed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <Trophy className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Sub-Match {currentSubMatch.subMatchNumber} Complete!
                </h3>
                <p className="text-green-700">
                  Winner: {currentSubMatch.winnerSide === "team1" ? match.team1?.name : match.team2?.name}
                </p>
                {currentSubMatchIndex < match.subMatches.length - 1 && (
                  <Button
                    onClick={() => setCurrentSubMatchIndex(currentSubMatchIndex + 1)}
                    className="mt-4"
                  >
                    Next Sub-Match
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}