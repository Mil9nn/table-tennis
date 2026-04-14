import TournamentStandings from "@/models/TournamentStandings";
import TournamentGroups from "@/models/TournamentGroups";

export function applyProjectedTournamentData(tournamentData: any, standingsDocs: any[], groupsDoc: any) {
  const overall = standingsDocs.find((doc: any) => doc.groupId === "__overall__");
  if (overall?.rows) {
    tournamentData.standings = overall.rows.map((row: any) => ({
      participant: row.participantId,
      played: row.played ?? 0,
      won: row.won ?? 0,
      lost: row.lost ?? 0,
      drawn: row.drawn ?? 0,
      setsWon: row.setsWon ?? 0,
      setsLost: row.setsLost ?? 0,
      setsDiff: row.setsDiff ?? 0,
      pointsScored: row.pointsScored ?? 0,
      pointsConceded: row.pointsConceded ?? 0,
      pointsDiff: row.pointsDiff ?? 0,
      points: row.points ?? 0,
      rank: row.rank ?? 0,
      form: row.form ?? [],
      headToHead: row.headToHead ?? {},
    }));
  }

  if (groupsDoc?.groups && Array.isArray(groupsDoc.groups)) {
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
        standings: (groupStandings?.rows || []).map((row: any) => ({
          participant: row.participantId,
          played: row.played ?? 0,
          won: row.won ?? 0,
          lost: row.lost ?? 0,
          drawn: row.drawn ?? 0,
          setsWon: row.setsWon ?? 0,
          setsLost: row.setsLost ?? 0,
          setsDiff: row.setsDiff ?? 0,
          pointsScored: row.pointsScored ?? 0,
          pointsConceded: row.pointsConceded ?? 0,
          pointsDiff: row.pointsDiff ?? 0,
          points: row.points ?? 0,
          rank: row.rank ?? 0,
          form: row.form ?? [],
          headToHead: row.headToHead ?? {},
        })),
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
