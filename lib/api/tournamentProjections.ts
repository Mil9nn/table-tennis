import TournamentStandings from "@/models/TournamentStandings";
import TournamentGroups from "@/models/TournamentGroups";
import { normalizeStandingRow } from "@/lib/api/doublesPairResolution";

export function applyProjectedTournamentData(tournamentData: any, standingsDocs: any[], groupsDoc: any) {
  const overall = standingsDocs.find((doc: any) => doc.groupId === "__overall__");
  if (overall?.rows) {
    tournamentData.standings = overall.rows.map((row: any) =>
      normalizeStandingRow({
        participant: row.participantId,
        ...row,
      })
    );
  }

  // Only overwrite groups when projection has concrete data.
  // If projection is empty/missing (e.g. stale projection records),
  // preserve groups already present on tournamentData.
  if (
    groupsDoc?.groups &&
    Array.isArray(groupsDoc.groups) &&
    groupsDoc.groups.length > 0
  ) {
    const standingsByGroup = new Map<string, any>(
      standingsDocs
        .filter((doc: any) => doc.groupId && doc.groupId !== "__overall__")
        .map((doc: any) => [doc.groupId, doc])
    );

    tournamentData.groups = groupsDoc.groups.map((group: any) => {
      const groupStandings = standingsByGroup.get(group.groupId);
      return {
        groupId: group.groupId,
        groupName: group.groupName,
        participants: group.participantIds || [],
        rounds: group.rounds || [],
        standings: (groupStandings?.rows || []).map((row: any) =>
          normalizeStandingRow({
            participant: row.participantId,
            ...row,
          })
        ),
      };
    });
  }
}

export async function loadAndApplyProjectedTournamentData(tournamentId: string, tournamentData: any) {
  const [projectedStandings, projectedGroups] = await Promise.all([
    TournamentStandings.find({ tournament: tournamentId }).lean(),
    TournamentGroups.findOne({ tournament: tournamentId }).lean(),
  ]);

  applyProjectedTournamentData(tournamentData, projectedStandings, projectedGroups);
}
