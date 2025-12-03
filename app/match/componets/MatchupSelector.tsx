"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface Player {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    username: string;
    profileImage?: string;
  };
}

interface Match {
  matchNumber: number;
  type: "singles" | "doubles";
  team1Players: string[]; // player IDs
  team2Players: string[];
}

interface MatchupSelectorProps {
  matchFormat: "five_singles" | "single_double_single";
  team1Name: string;
  team2Name: string;
  team1Players: Player[];
  team2Players: Player[];
  matches: Match[];
  onChange: (matches: Match[]) => void;
}

export default function MatchupSelector({
  matchFormat,
  team1Name,
  team2Name,
  team1Players,
  team2Players,
  matches,
  onChange,
}: MatchupSelectorProps) {
  // Generate initial match structure based on format
  const getMatchStructure = (): Match[] => {
    if (matchFormat === "five_singles") {
      return [
        { matchNumber: 1, type: "singles", team1Players: [], team2Players: [] },
        { matchNumber: 2, type: "singles", team1Players: [], team2Players: [] },
        { matchNumber: 3, type: "singles", team1Players: [], team2Players: [] },
        { matchNumber: 4, type: "singles", team1Players: [], team2Players: [] },
        { matchNumber: 5, type: "singles", team1Players: [], team2Players: [] },
      ];
    } else {
      // single_double_single
      return [
        { matchNumber: 1, type: "singles", team1Players: [], team2Players: [] },
        { matchNumber: 2, type: "doubles", team1Players: [], team2Players: [] },
        { matchNumber: 3, type: "singles", team1Players: [], team2Players: [] },
      ];
    }
  };

  // Initialize matches if empty
  React.useEffect(() => {
    if (matches.length === 0) {
      onChange(getMatchStructure());
    }
  }, [matchFormat]);

  const handlePlayerChange = (
    matchIndex: number,
    team: "team1" | "team2",
    playerIndex: number,
    playerId: string
  ) => {
    const newMatches = [...matches];
    const match = newMatches[matchIndex];

    if (team === "team1") {
      const newPlayers = [...match.team1Players];
      newPlayers[playerIndex] = playerId;
      match.team1Players = newPlayers;
    } else {
      const newPlayers = [...match.team2Players];
      newPlayers[playerIndex] = playerId;
      match.team2Players = newPlayers;
    }

    onChange(newMatches);
  };

  const getPlayerName = (players: Player[], playerId: string) => {
    const player = players.find((p) => p.user._id === playerId);
    return player?.user.fullName || "Select Player";
  };

  const getAvailablePlayers = (
    players: Player[],
    currentMatchIndex: number,
    currentTeam: "team1" | "team2",
    currentPlayerIndex: number
  ) => {
    // Get all selected players in other matches
    const selectedInOtherMatches = new Set<string>();
    matches.forEach((match, idx) => {
      if (idx !== currentMatchIndex) {
        if (currentTeam === "team1") {
          match.team1Players.forEach((p) => p && selectedInOtherMatches.add(p));
        } else {
          match.team2Players.forEach((p) => p && selectedInOtherMatches.add(p));
        }
      }
    });

    // Get players selected in current match (except current position)
    const selectedInCurrentMatch = new Set<string>();
    const currentMatch = matches[currentMatchIndex];
    const currentMatchPlayers =
      currentTeam === "team1"
        ? currentMatch.team1Players
        : currentMatch.team2Players;

    currentMatchPlayers.forEach((p, idx) => {
      if (idx !== currentPlayerIndex && p) {
        selectedInCurrentMatch.add(p);
      }
    });

    return players.filter(
      (p) =>
        !selectedInOtherMatches.has(p.user._id) &&
        !selectedInCurrentMatch.has(p.user._id)
    );
  };

  // Check if all matches have complete player selections
  const allMatchesComplete = matches.every((match) => {
    const requiredPlayers = match.type === "singles" ? 1 : 2;
    return (
      match.team1Players.filter((p) => p).length === requiredPlayers &&
      match.team2Players.filter((p) => p).length === requiredPlayers
    );
  });

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Match Schedule & Player Selection</h4>
        {!allMatchesComplete && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="w-3 h-3" />
            <span>Select players for all matches</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {matches.map((match, matchIndex) => {
          const requiredPlayers = match.type === "singles" ? 1 : 2;

          return (
            <div
              key={matchIndex}
              className="p-4 bg-background rounded-lg border space-y-3"
            >
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">
                  Match {match.matchNumber}
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    ({match.type})
                  </span>
                </h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                {/* Team 1 Players */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {team1Name}
                  </p>
                  {Array.from({ length: requiredPlayers }).map((_, playerIdx) => (
                    <Select
                      key={`team1-${playerIdx}`}
                      value={match.team1Players[playerIdx] || ""}
                      onValueChange={(value) =>
                        handlePlayerChange(matchIndex, "team1", playerIdx, value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Player">
                          {match.team1Players[playerIdx]
                            ? getPlayerName(
                                team1Players,
                                match.team1Players[playerIdx]
                              )
                            : "Select Player"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePlayers(
                          team1Players,
                          matchIndex,
                          "team1",
                          playerIdx
                        ).map((player) => (
                          <SelectItem key={player.user._id} value={player.user._id}>
                            {player.user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>

                {/* VS */}
                <div className="flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold">
                    VS
                  </span>
                </div>

                {/* Team 2 Players */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {team2Name}
                  </p>
                  {Array.from({ length: requiredPlayers }).map((_, playerIdx) => (
                    <Select
                      key={`team2-${playerIdx}`}
                      value={match.team2Players[playerIdx] || ""}
                      onValueChange={(value) =>
                        handlePlayerChange(matchIndex, "team2", playerIdx, value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Player">
                          {match.team2Players[playerIdx]
                            ? getPlayerName(
                                team2Players,
                                match.team2Players[playerIdx]
                              )
                            : "Select Player"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePlayers(
                          team2Players,
                          matchIndex,
                          "team2",
                          playerIdx
                        ).map((player) => (
                          <SelectItem key={player.user._id} value={player.user._id}>
                            {player.user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
