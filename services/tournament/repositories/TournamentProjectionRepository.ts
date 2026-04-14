import mongoose, { ClientSession } from "mongoose";
import TournamentGroups from "@/models/TournamentGroups";
import TournamentStandings from "@/models/TournamentStandings";

function toIdString(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value?._id) return value._id.toString();
  if (value?.toString) return value.toString();
  return null;
}

function mapStandingRows(rows: any[] = []) {
  return rows
    .map((row: any) => {
      const participantId = toIdString(row?.participantId ?? row?.participant);
      if (!participantId) return null;
      return {
        participantId: new mongoose.Types.ObjectId(participantId),
        played: row?.played ?? 0,
        won: row?.won ?? 0,
        lost: row?.lost ?? 0,
        drawn: row?.drawn ?? 0,
        setsWon: row?.setsWon ?? 0,
        setsLost: row?.setsLost ?? 0,
        setsDiff: row?.setsDiff ?? 0,
        pointsScored: row?.pointsScored ?? 0,
        pointsConceded: row?.pointsConceded ?? 0,
        pointsDiff: row?.pointsDiff ?? 0,
        points: row?.points ?? 0,
        rank: row?.rank ?? 0,
        form: Array.isArray(row?.form) ? row.form : [],
        headToHead: row?.headToHead ?? {},
      };
    })
    .filter(Boolean);
}

export class TournamentProjectionRepository {
  async upsertStandings(
    tournamentId: string,
    category: "individual" | "team",
    phase: "round_robin" | "knockout" | "transition" | undefined,
    overallStandings: any[],
    groups?: any[],
    session?: ClientSession
  ) {
    const ops: any[] = [
      {
        replaceOne: {
          filter: { tournament: tournamentId, groupId: "__overall__" },
          replacement: {
            tournament: tournamentId,
            category,
            phase,
            groupId: "__overall__",
            rows: mapStandingRows(overallStandings),
          },
          upsert: true,
        },
      },
    ];
    const keepGroupIds = new Set<string>(["__overall__"]);

    if (Array.isArray(groups)) {
      for (const group of groups) {
        if (!group?.groupId) continue;
        keepGroupIds.add(group.groupId);
        ops.push({
          replaceOne: {
            filter: { tournament: tournamentId, groupId: group.groupId },
            replacement: {
              tournament: tournamentId,
              category,
              phase,
              groupId: group.groupId,
              rows: mapStandingRows(group?.standings || []),
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length > 0) {
      await TournamentStandings.bulkWrite(ops, session ? { session } : undefined);
    }

    await TournamentStandings.deleteMany(
      { tournament: tournamentId, groupId: { $nin: Array.from(keepGroupIds) } },
      session ? { session } : undefined
    );
  }

  async upsertGroups(
    tournamentId: string,
    category: "individual" | "team",
    groups: any[],
    session?: ClientSession
  ) {
    const projectedGroups = (Array.isArray(groups) ? groups : []).map((group: any) => ({
      groupId: group.groupId,
      groupName: group.groupName,
      participantIds: Array.isArray(group.participants)
        ? group.participants
            .map((participant: any) => toIdString(participant))
            .filter(Boolean)
            .map((id: string) => new mongoose.Types.ObjectId(id))
        : [],
      rounds: Array.isArray(group.rounds)
        ? group.rounds.map((round: any) => ({
            roundNumber: round.roundNumber,
            matches: Array.isArray(round.matches)
              ? round.matches
                  .map((match: any) => toIdString(match))
                  .filter(Boolean)
                  .map((id: string) => new mongoose.Types.ObjectId(id))
              : [],
            completed: !!round.completed,
            scheduledDate: round.scheduledDate,
            scheduledTime: round.scheduledTime,
          }))
        : [],
    }));

    await TournamentGroups.findOneAndUpdate(
      { tournament: tournamentId },
      {
        tournament: tournamentId,
        category,
        groups: projectedGroups,
      },
      { upsert: true, new: true, ...(session ? { session } : {}) }
    );
  }

  async upsertGroupStandings(
    tournamentId: string,
    category: "individual" | "team",
    phase: "round_robin" | "knockout" | "transition" | undefined,
    groups: any[],
    session?: ClientSession
  ) {
    const groupList = Array.isArray(groups) ? groups : [];
    const activeGroupIds = new Set<string>();
    const ops: any[] = [];

    for (const group of groupList) {
      if (!group?.groupId) continue;
      activeGroupIds.add(group.groupId);
      ops.push({
        replaceOne: {
          filter: { tournament: tournamentId, groupId: group.groupId },
          replacement: {
            tournament: tournamentId,
            category,
            phase,
            groupId: group.groupId,
            rows: mapStandingRows(group?.standings || []),
          },
          upsert: true,
        },
      });
    }

    if (ops.length > 0) {
      await TournamentStandings.bulkWrite(ops, session ? { session } : undefined);
    }

    await TournamentStandings.deleteMany(
      {
        tournament: tournamentId,
        groupId: { $ne: "__overall__", $nin: Array.from(activeGroupIds) },
      },
      session ? { session } : undefined
    );
  }
}

export const tournamentProjectionRepository = new TournamentProjectionRepository();
