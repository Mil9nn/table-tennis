// components/tournaments/GroupsView.tsx
"use client";

import React, { useState } from "react";
import { Group } from "@/types/tournament.type";
import { EnhancedStandingsTable } from "./EnhancedStandingsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, CheckCircle2 } from "lucide-react";

import GroupsIcon from '@mui/icons-material/Groups';

interface GroupsViewProps {
  groups: Group[];
  advancePerGroup?: number;
  showDetailedStats?: boolean;
  category?: "individual" | "team";
}

export function GroupsView({
  groups,
  advancePerGroup = 2,
  showDetailedStats = false,
  category = "individual",
}: GroupsViewProps) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.groupId || "");

  if (!groups || groups.length === 0) {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-12">
          <div className="text-center text-muted-foreground">
            <GroupsIcon className="size-20 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">No groups yet</p>
            <p className="text-sm mt-2">Create groups to start Round Robin matches and standings.</p>
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
    <div className="">
      {/* Tabs */}
      <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
        <TabsList className="w-full justify-start p-0 rounded-none overflow-x-auto">
          {groups.map((group) => {
            const status = getGroupStatus(group);
            return (
              <TabsTrigger 
                key={group.groupId} 
                className="rounded-none" 
                value={group.groupId}
              >
                <div className="flex items-center gap-2">
                  <span>{group.groupName}</span>
                  {status.allCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.groupId} value={group.groupId}>
            <div className="space-y-6">
              {/* Standings */}
              <EnhancedStandingsTable
                standings={group.standings}
                showDetailedStats={showDetailedStats}
                highlightTop={advancePerGroup}
                category={category}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
