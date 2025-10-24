"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const addMatch = () => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Custom Match Sequence</span>
          <Button onClick={addMatch} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Match
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No matches configured. Click "Add Match" to start.
          </p>
        )}

        {matches.map((match, index) => (
          <Card key={index} className="border-2">
            <CardContent className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Match {index + 1}</Badge>
                  <Select
                    value={match.type}
                    onValueChange={(value: "singles" | "doubles") =>
                      updateMatch(index, "type", value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singles">Singles</SelectItem>
                      <SelectItem value="doubles">Doubles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => moveMatch(index, "up")}
                    disabled={index === 0}
                    size="icon"
                    variant="ghost"
                  >
                    <MoveUp className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => moveMatch(index, "down")}
                    disabled={index === matches.length - 1}
                    size="icon"
                    variant="ghost"
                  >
                    <MoveDown className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => removeMatch(index)}
                    disabled={matches.length === 1}
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Player Selection */}
              <div className="grid grid-cols-2 gap-4">
                {/* Team 1 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{team1Name}</label>
                  {match.type === "singles" ? (
                    <Select
                      value={match.team1Players[0] || ""}
                      onValueChange={(value) =>
                        updateMatch(index, "team1Players", [value])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {team1Players.map((p) => (
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
                        <SelectTrigger>
                          <SelectValue placeholder="Player 1" />
                        </SelectTrigger>
                        <SelectContent>
                          {team1Players.map((p) => (
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
                        <SelectTrigger>
                          <SelectValue placeholder="Player 2" />
                        </SelectTrigger>
                        <SelectContent>
                          {team1Players
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
                  <label className="text-sm font-medium">{team2Name}</label>
                  {match.type === "singles" ? (
                    <Select
                      value={match.team2Players[0] || ""}
                      onValueChange={(value) =>
                        updateMatch(index, "team2Players", [value])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {team2Players.map((p) => (
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
                        <SelectTrigger>
                          <SelectValue placeholder="Player 1" />
                        </SelectTrigger>
                        <SelectContent>
                          {team2Players.map((p) => (
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
                        <SelectTrigger>
                          <SelectValue placeholder="Player 2" />
                        </SelectTrigger>
                        <SelectContent>
                          {team2Players
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
            </CardContent>
          </Card>
        ))}

        {matches.length > 0 && (
          <div className="pt-2 text-sm text-muted-foreground">
            <p>Total matches: {matches.length}</p>
            <p className="text-xs mt-1">
              First team to win {Math.ceil(matches.length / 2)} matches wins the tie
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}