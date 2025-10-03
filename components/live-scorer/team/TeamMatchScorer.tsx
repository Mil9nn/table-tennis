"use client";

import { useEffect } from "react";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Check, ArrowRight, Play, Loader2 } from "lucide-react";
import { TeamMatch } from "@/types/match.type";
import SubMatchScorer from "./SubMatchScorer";
import { toast } from "sonner";

interface TeamMatchScorerProps {
  match: TeamMatch;
}

export default function TeamMatchScorer({ match }: TeamMatchScorerProps) {
  const {
    match: localMatch,
    currentSubMatchIndex,
    team1Wins,
    team2Wins,
    status,
    isStartingMatch,
    setInitialMatch,
    initializeSubMatches,
    moveToNextSubMatch,
  } = useTeamMatch();

  useEffect(() => {
    if (match) {
      setInitialMatch(match);
    }
  }, [match._id, setInitialMatch]);

  const isInitialized = localMatch?.subMatches && localMatch.subMatches.length > 0;
  const currentSubMatch = isInitialized ? localMatch.subMatches[currentSubMatchIndex] : null;
  const totalSubMatches = localMatch?.subMatches?.length || 0;
  const matchesNeeded = Math.ceil(totalSubMatches / 2);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 flex-shrink-0" />
              <span className="text-lg sm:text-xl">
                {localMatch?.team1.name} vs {localMatch?.team2.name}
              </span>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {localMatch?.format.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around items-center text-center">
            <div className="flex-1">
              <div className="text-5xl font-bold text-emerald-600">
                {team1Wins}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {localMatch?.team1.name}
              </div>
            </div>
            
            <div className="flex flex-col items-center px-4 sm:px-8">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500 mb-2" />
              <div className="text-xs text-gray-500">
                First to {matchesNeeded}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-5xl font-bold text-rose-600">
                {team2Wins}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {localMatch?.team2.name}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Initialize Button */}
      {!isInitialized && status !== "completed" && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-gray-600">
              Initialize the match to start playing individual submatches
            </p>
            <Button 
              onClick={initializeSubMatches} 
              disabled={isStartingMatch}
              size="lg"
              className="gap-2 w-full sm:w-auto"
            >
              {isStartingMatch ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Initialize Match
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current SubMatch Scorer */}
      {isInitialized && currentSubMatch && !currentSubMatch.completed && status !== "completed" && (
        <SubMatchScorer
          match={localMatch!}
          subMatch={currentSubMatch}
          subMatchIndex={currentSubMatchIndex}
        />
      )}

      {/* Completed SubMatch Message */}
      {isInitialized && currentSubMatch?.completed && status !== "completed" && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6 text-center space-y-4">
            <Check className="w-16 h-16 text-green-600 mx-auto" />
            <h3 className="text-2xl font-bold text-green-700">
              {currentSubMatch.matchLabel} Complete!
            </h3>
            <p className="text-lg">
              Winner: {currentSubMatch.winnerSide === "team1" 
                ? localMatch?.team1.name 
                : localMatch?.team2.name}
            </p>
            <p className="text-sm text-gray-600">
              Sets: {currentSubMatch.finalScore.team1Sets} - {currentSubMatch.finalScore.team2Sets}
            </p>
            {currentSubMatchIndex < (localMatch?.subMatches.length || 0) - 1 && (
              <Button 
                onClick={moveToNextSubMatch}
                size="lg" 
                className="gap-2"
              >
                Next Match <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Match Completed */}
      {status === "completed" && (
        <Card className="border-green-500 bg-gradient-to-br from-green-50 to-emerald-100">
          <CardContent className="pt-6 text-center space-y-4">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
            <h2 className="text-3xl font-bold text-green-700">
              MATCH COMPLETED
            </h2>
            <p className="text-2xl">
              Winner: <span className="font-bold">
                {localMatch?.winnerTeam === "team1" 
                  ? localMatch?.team1.name 
                  : localMatch?.team2.name}
              </span>
            </p>
            <p className="text-lg text-gray-700">
              Final Score: {team1Wins} - {team2Wins}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Match Progress */}
      {isInitialized && localMatch && (
        <Card>
          <CardHeader>
            <CardTitle>Match Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {localMatch.subMatches.map((sub, idx) => {
                const isCurrent = idx === currentSubMatchIndex;
                const isPast = idx < currentSubMatchIndex;
                const isFuture = idx > currentSubMatchIndex;
                
                return (
                  <button
                    key={idx}
                    onClick={() => isCurrent && toast.info("This is the current match")}
                    disabled={!isCurrent}
                    className={`w-full flex items-center justify-between p-4 rounded-lg transition ${
                      isCurrent
                        ? "bg-blue-50 border-2 border-blue-400 cursor-default"
                        : sub.completed
                        ? "bg-gray-50 border border-gray-200 cursor-default"
                        : "bg-white border border-gray-200 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          sub.completed
                            ? "bg-green-500 text-white"
                            : isCurrent
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {sub.completed ? <Check className="w-5 h-5" /> : idx + 1}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{sub.matchLabel}</div>
                        <div className="text-xs text-gray-600">
                          {sub.team1Players?.map((p: any) => p.fullName || p.username).join(" & ")} vs{" "}
                          {sub.team2Players?.map((p: any) => p.fullName || p.username).join(" & ")}
                        </div>
                      </div>
                    </div>
                    {sub.completed && (
                      <Badge 
                        variant={sub.winnerSide === "team1" ? "default" : "destructive"}
                        className="text-sm"
                      >
                        {sub.finalScore.team1Sets} - {sub.finalScore.team2Sets}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}