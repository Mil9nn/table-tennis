// components/tournaments/GroupsView.tsx
"use client";

import React, { useState } from "react";
import { Group } from "@/types/tournament.type";
import { EnhancedStandingsTable } from "./EnhancedStandingsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, CheckCircle2 } from "lucide-react";

interface GroupsViewProps {
  groups: Group[];
  advancePerGroup?: number;
  showDetailedStats?: boolean;
}

export function GroupsView({
  groups,
  advancePerGroup = 2,
  showDetailedStats = false,
}: GroupsViewProps) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.groupId || "");

  if (!groups || groups.length === 0) {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-12">
          <div className="text-center text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No groups configured</p>
            <p className="text-sm mt-2">This tournament doesn't use group stages</p>
          </div>
        </div>
      </div>
    );
  }

  const getGroupStatus = (group: Group) => {
    const totalMatches = group.rounds.reduce(
      (sum, round) => sum + round.matches.length,
      0
    );

    const completedRounds = group.rounds.filter((r) => r.completed).length;
    const allCompleted = group.rounds.every((r) => r.completed);

    return {
      totalRounds: group.rounds.length,
      completedRounds,
      allCompleted,
      totalMatches,
    };
  };

  return (
    <div className="space-y-4 p-4">
      {/* Groups Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => {
          const status = getGroupStatus(group);
          const topPlayers = group.standings.slice(0, advancePerGroup);
          
          // Check if any matches have been played in this group
          const hasPlayedMatches = group.standings.some(
            (standing) => standing.played > 0
          );

          // Sort standings by rank (already calculated using ITTF-compliant tiebreaker logic)
          const sortedStandings = [...group.standings].sort((a, b) => a.rank - b.rank);
          const qualifiers = sortedStandings.slice(0, advancePerGroup);

          return (
            <div
              key={group.groupId}
              className={`rounded-xl border bg-card text-card-foreground p-4 shadow cursor-pointer transition-all ${
                selectedGroup === group.groupId
                  ? "ring-2 ring-primary"
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedGroup(group.groupId)}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">{group.groupName}</h2>
                {status.allCompleted && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>

              <div className="space-y-1">
                {/* Players */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Players</span>
                  <Badge variant="secondary">{group.participants.length}</Badge>
                </div>

                {/* Rounds */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rounds</span>
                  <Badge variant="outline">
                    {status.completedRounds} / {status.totalRounds}
                  </Badge>
                </div>

                {/* Advancing */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Advancing</span>
                  <Badge variant="default" className="bg-gray-500">
                    Top {advancePerGroup}
                  </Badge>
                </div>

                {/* Qualifiers - Only show if matches have been played */}
                {hasPlayedMatches && qualifiers.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Trophy className="w-3 h-3" />
                      <span>Qualifiers</span>
                    </div>
                    <div className="space-y-1">
                      {qualifiers.map((standing, index) => (
                        <div
                          key={standing.participant._id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="truncate">
                            {index + 1}.{" "}
                            {standing.participant.fullName ||
                              standing.participant.username}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {standing.points} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
        <TabsList className="w-full justify-start p-0 rounded-none overflow-x-auto">
          {groups.map((group) => (
            <TabsTrigger key={group.groupId} className="rounded-none" value={group.groupId}>
              {group.groupName}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.groupId} value={group.groupId}>
            <div className="space-y-6">
              {/* Standings */}
              <EnhancedStandingsTable
                standings={group.standings}
                showDetailedStats={showDetailedStats}
                highlightTop={advancePerGroup}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
