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
                  <Badge variant="default" className="bg-green-500">
                    Top {advancePerGroup}
                  </Badge>
                </div>

                {/* Qualifiers */}
                {topPlayers.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <span>Qualifiers</span>
                    </div>
                    <div className="space-y-1">
                      {topPlayers.map((standing, index) => (
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
        <TabsList className="w-full justify-start overflow-x-auto">
          {groups.map((group) => (
            <TabsTrigger key={group.groupId} value={group.groupId}>
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

              {/* Group Info */}
              <div className="rounded-xl border bg-card shadow">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Group Information</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Matches</p>
                      <p className="text-2xl font-bold">
                        {group.rounds.reduce(
                          (sum, round) => sum + round.matches.length,
                          0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rounds Completed</p>
                      <p className="text-2xl font-bold">
                        {group.rounds.filter((r) => r.completed).length} /{" "}
                        {group.rounds.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Participants</p>
                      <p className="text-2xl font-bold">{group.participants.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rounds Summary */}
              <div className="rounded-xl border bg-card shadow">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Rounds Summary</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {group.rounds.map((round) => (
                      <div
                        key={round.roundNumber}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Round {round.roundNumber}</span>
                          {round.completed && (
                            <Badge variant="default" className="bg-green-500 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>

                        <Badge variant="outline">{round.matches.length} matches</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
