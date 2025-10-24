"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, MoveUp, MoveDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Player {
  _id: string;
  user: {
    _id: string;
    username: string;
    fullName?: string;
  };
}

interface MatchConfig {
  type: "singles" | "doubles";
  team1Players: string[];
  team2Players: string[];
}

interface CustomFormatConfigProps {
  team1Players: Player[];
  team2Players: Player[];
  team1Name: string;
  team2Name: string;
  onChange: (config: { matches: MatchConfig[] }) => void;
}

export default function CustomFormatConfig({
  team1Players,
  team2Players,
  team1Name,
  team2Name,
  onChange,
}: CustomFormatConfigProps) {
  const [matches, setMatches] = useState<MatchConfig[]>([
    {
      type: "singles",
      team1Players: [],
      team2Players: [],
    },
  ]);

  const updateMatches = (newMatches: MatchConfig[]) => {
    setMatches(newMatches);
    onChange({ matches: newMatches });
  };

  // Check if a match is fully configured
  const isMatchComplete = (match: MatchConfig): boolean => {
    const requiredPlayers = match.type === "singles" ? 1 : 2;
    
    const hasTeam1Players = 
      match.team1Players.length === requiredPlayers &&
      match.team1Players.every(p => p && p.trim() !== "");
    
    const hasTeam2Players = 
      match.team2Players.length === requiredPlayers &&
      match.team2Players.every(p => p && p.trim() !== "");

    return hasTeam1Players && hasTeam2Players;
  };

  // Check if we can add a new match
  const canAddMatch = (): boolean => {
    if (matches.length === 0) return true;
    
    // Check if the last match is complete
    const lastMatch = matches[matches.length - 1];
    return isMatchComplete(lastMatch);
  };

  const addMatch = () => {
    if (!canAddMatch()) {
      return;
    }

    updateMatches([
      ...matches,
      {
        type: "singles",
        team1Players: [],
        team2Players: [],
      },
    ]);
  };

  const removeMatch = (index: number) => {
    // Don't allow removing if it's the only match
    if (matches.length === 1) return;
    
    const newMatches = matches.filter((_, i) => i !== index);
    updateMatches(newMatches);
  };

  const moveMatch = (index: number, direction: "up" | "down") => {
    const newMatches = [...matches];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newMatches.length) return;

    [newMatches[index], newMatches[targetIndex]] = [
      newMatches[targetIndex],
      newMatches[index],
    ];

    updateMatches(newMatches);
  };

  const updateMatch = (index: number, field: keyof MatchConfig, value: any) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: value };

    // Reset players when switching type
    if (field === "type") {
      newMatches[index].team1Players = [];
      newMatches[index].team2Players = [];
    }

    updateMatches(newMatches);
  };

  const getPlayerName = (player: Player) => {
    return player.user.fullName || player.user.username;
  };

  // Get available players (not used in previous matches)
  const getAvailablePlayers = (teamPlayers: Player[], currentMatchIndex: number, currentTeam: 'team1' | 'team2') => {
    const usedPlayerIds = new Set<string>();
    
    // Collect all players used in previous matches
    matches.forEach((match, idx) => {
      if (idx < currentMatchIndex) {
        if (currentTeam === 'team1') {
          match.team1Players.forEach(id => usedPlayerIds.add(id));
        } else {
          match.team2Players.forEach(id => usedPlayerIds.add(id));
        }
      }
    });

    return teamPlayers.filter(p => !usedPlayerIds.has(p.user._id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Custom Match Sequence</span>
          <Button 
            onClick={addMatch} 
            size="sm" 
            variant="outline"
            disabled={!canAddMatch()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Match
          </Button>
        </CardTitle>
        {!canAddMatch() && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Complete the current match configuration before adding a new one
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No matches configured. Click "Add Match" to start.
          </p>
        )}

        {matches.map((match, index) => {
          const isComplete = isMatchComplete(match);
          const availableTeam1 = getAvailablePlayers(team1Players, index, 'team1');
          const availableTeam2 = getAvailablePlayers(team2Players, index, 'team2');

          return (
            <Card key={index} className={`border-2 ${isComplete ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Match {index + 1}</Badge>
                    {isComplete && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        Complete
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => moveMatch(index, "up")}
                      disabled={index === 0}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => moveMatch(index, "down")}
                      disabled={index === matches.length - 1}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => removeMatch(index)}
                      disabled={matches.length === 1}
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Match Type Selection - Radio Buttons */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Match Type</Label>
                  <RadioGroup
                    value={match.type}
                    onValueChange={(value: "singles" | "doubles") =>
                      updateMatch(index, "type", value)
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="singles" id={`singles-${index}`} />
                      <Label htmlFor={`singles-${index}`} className="font-normal cursor-pointer">
                        Singles
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="doubles" id={`doubles-${index}`} />
                      <Label htmlFor={`doubles-${index}`} className="font-normal cursor-pointer">
                        Doubles
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Player Selection */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Team 1 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{team1Name}</Label>
                    {match.type === "singles" ? (
                      <Select
                        value={match.team1Players[0] || ""}
                        onValueChange={(value) =>
                          updateMatch(index, "team1Players", [value])
                        }
                      >
                        <SelectTrigger className={match.team1Players[0] ? "border-green-300" : ""}>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeam1.map((p) => (
                            <SelectItem key={p.user._id} value={p.user._id}>
                              {getPlayerName(p)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Select
                          value={match.team1Players[0] || ""}
                          onValueChange={(value) => {
                            const newPlayers = [...match.team1Players];
                            newPlayers[0] = value;
                            updateMatch(index, "team1Players", newPlayers);
                          }}
                        >
                          <SelectTrigger className={match.team1Players[0] ? "border-green-300" : ""}>
                            <SelectValue placeholder="Player 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeam1.map((p) => (
                              <SelectItem key={p.user._id} value={p.user._id}>
                                {getPlayerName(p)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={match.team1Players[1] || ""}
                          onValueChange={(value) => {
                            const newPlayers = [...match.team1Players];
                            newPlayers[1] = value;
                            updateMatch(index, "team1Players", newPlayers);
                          }}
                        >
                          <SelectTrigger className={match.team1Players[1] ? "border-green-300" : ""}>
                            <SelectValue placeholder="Player 2" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeam1
                              .filter((p) => p.user._id !== match.team1Players[0])
                              .map((p) => (
                                <SelectItem key={p.user._id} value={p.user._id}>
                                  {getPlayerName(p)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{team2Name}</Label>
                    {match.type === "singles" ? (
                      <Select
                        value={match.team2Players[0] || ""}
                        onValueChange={(value) =>
                          updateMatch(index, "team2Players", [value])
                        }
                      >
                        <SelectTrigger className={match.team2Players[0] ? "border-green-300" : ""}>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeam2.map((p) => (
                            <SelectItem key={p.user._id} value={p.user._id}>
                              {getPlayerName(p)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Select
                          value={match.team2Players[0] || ""}
                          onValueChange={(value) => {
                            const newPlayers = [...match.team2Players];
                            newPlayers[0] = value;
                            updateMatch(index, "team2Players", newPlayers);
                          }}
                        >
                          <SelectTrigger className={match.team2Players[0] ? "border-green-300" : ""}>
                            <SelectValue placeholder="Player 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeam2.map((p) => (
                              <SelectItem key={p.user._id} value={p.user._id}>
                                {getPlayerName(p)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={match.team2Players[1] || ""}
                          onValueChange={(value) => {
                            const newPlayers = [...match.team2Players];
                            newPlayers[1] = value;
                            updateMatch(index, "team2Players", newPlayers);
                          }}
                        >
                          <SelectTrigger className={match.team2Players[1] ? "border-green-300" : ""}>
                            <SelectValue placeholder="Player 2" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeam2
                              .filter((p) => p.user._id !== match.team2Players[0])
                              .map((p) => (
                                <SelectItem key={p.user._id} value={p.user._id}>
                                  {getPlayerName(p)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Message */}
                {!isComplete && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Please select all players to complete this match
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}

        {matches.length > 0 && (
          <div className="pt-2 text-sm text-muted-foreground space-y-1">
            <p className="font-medium">Match Summary:</p>
            <p>• Total matches: {matches.length}</p>
            <p>• Complete: {matches.filter(isMatchComplete).length}</p>
            <p>• Incomplete: {matches.filter(m => !isMatchComplete(m)).length}</p>
            <p className="text-xs mt-2 italic">
              First team to win {Math.ceil(matches.length / 2)} matches wins the tie
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}