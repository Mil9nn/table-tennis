import type { Schema } from "mongoose";

function toIdString(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value?._id) return value._id.toString();
  if (value?.toString) return value.toString();
  return null;
}

function mapStandingRows(standings: any[] = []) {
  return standings
    .map((row: any) => {
      const participantId = toIdString(row?.participantId ?? row?.participant);
      if (!participantId) return null;
      return {
        participantId,
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

function hasAnyProjectedGroupData(groups: any[] = []): boolean {
  return groups.some((group: any) => {
    const participants = Array.isArray(group?.participantIds) ? group.participantIds.length : 0;
    const rounds = Array.isArray(group?.rounds) ? group.rounds.length : 0;
    return participants > 0 || rounds > 0;
  });
}

export async function syncTournamentProjections(tournamentData: any) {
  const [{ default: TournamentStandings }, { default: TournamentGroups }] =
    await Promise.all([
      import("@/models/TournamentStandings"),
      import("@/models/TournamentGroups"),
    ]);

  const tournamentId = tournamentData?._id;
  if (!tournamentId) return;

  const category = tournamentData.category === "team" ? "team" : "individual";
  const phase = tournamentData.currentPhase;
  const groups = Array.isArray(tournamentData.groups) ? tournamentData.groups : [];
  const hasStandingsField = Object.prototype.hasOwnProperty.call(tournamentData, "standings");
  const hasGroupsField = Object.prototype.hasOwnProperty.call(tournamentData, "groups");
  const incomingOverallRows = mapStandingRows(tournamentData.standings || []);
  const incomingProjectedGroups = groups.map((group: any) => ({
    groupId: group.groupId,
    groupName: group.groupName,
    participantIds: Array.isArray(group.participants)
      ? group.participants.map((p: any) => toIdString(p)).filter(Boolean)
      : [],
    rounds: Array.isArray(group.rounds)
      ? group.rounds.map((round: any) => ({
          roundNumber: round.roundNumber,
          matches: Array.isArray(round.matches)
            ? round.matches.map((m: any) => toIdString(m)).filter(Boolean)
            : [],
          completed: !!round.completed,
          scheduledDate: round.scheduledDate,
          scheduledTime: round.scheduledTime,
        }))
      : [],
  }));

  const existingOverallDoc = await TournamentStandings.findOne({
    tournament: tournamentId,
    groupId: "__overall__",
  })
    .select("rows")
    .lean();
  const existingStandingDocs = await TournamentStandings.find({ tournament: tournamentId })
    .select("rows")
    .lean();
  const existingGroupsDoc = await TournamentGroups.findOne({ tournament: tournamentId })
    .select("groups")
    .lean();
  const existingHasOverallRows = Array.isArray(existingOverallDoc?.rows) && existingOverallDoc.rows.length > 0;
  const existingHasAnyStandingRows = existingStandingDocs.some(
    (doc: any) => Array.isArray(doc?.rows) && doc.rows.length > 0
  );
  const existingHasGroupData = hasAnyProjectedGroupData(existingGroupsDoc?.groups || []);
  const incomingHasGroupData = hasAnyProjectedGroupData(incomingProjectedGroups);
  const incomingGroupStandingRowsCount = groups.reduce((acc: number, group: any) => {
    const rows = mapStandingRows(group?.standings || []);
    return acc + rows.length;
  }, 0);
  const shouldSkipStandingsOverwrite =
    hasStandingsField &&
    incomingOverallRows.length === 0 &&
    incomingGroupStandingRowsCount === 0 &&
    (existingHasOverallRows || existingHasAnyStandingRows);
  const shouldSkipGroupsOverwrite = hasGroupsField && !incomingHasGroupData && existingHasGroupData;

  if (hasStandingsField && !shouldSkipStandingsOverwrite) {
    const bulkOps: any[] = [];
    const activeGroupIds = new Set<string>(["__overall__"]);

    bulkOps.push({
      replaceOne: {
        filter: { tournament: tournamentId, groupId: "__overall__" },
        replacement: {
          tournament: tournamentId,
          category,
          phase,
          groupId: "__overall__",
          rows: incomingOverallRows,
        },
        upsert: true,
      },
    });

    if (hasGroupsField) {
      for (const group of groups) {
        if (!group?.groupId) continue;
        activeGroupIds.add(group.groupId);
        bulkOps.push({
          replaceOne: {
            filter: { tournament: tournamentId, groupId: group.groupId },
            replacement: {
              tournament: tournamentId,
              category,
              phase,
              groupId: group.groupId,
              rows: mapStandingRows(group.standings || []),
            },
            upsert: true,
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await TournamentStandings.bulkWrite(bulkOps);
    }

    if (hasGroupsField) {
      await TournamentStandings.deleteMany({
        tournament: tournamentId,
        groupId: { $nin: Array.from(activeGroupIds) },
      });
    }
  }

  if (hasGroupsField && !shouldSkipGroupsOverwrite) {
    await TournamentGroups.findOneAndUpdate(
      { tournament: tournamentId },
      {
        tournament: tournamentId,
        category,
        groups: incomingProjectedGroups,
      },
      { upsert: true, new: true }
    );
  }
}

export async function cleanupTournamentProjections(tournamentId: any) {
  const [{ default: TournamentStandings }, { default: TournamentGroups }] =
    await Promise.all([
      import("@/models/TournamentStandings"),
      import("@/models/TournamentGroups"),
    ]);

  await Promise.all([
    TournamentStandings.deleteMany({ tournament: tournamentId }),
    TournamentGroups.deleteOne({ tournament: tournamentId }),
  ]);
}

export function attachTournamentProjectionHooks(schema: Schema) {
  schema.pre("updateOne", async function () {
    try {
      const ids = await (this as any).model.find(this.getFilter()).select("_id").lean();
      (this as any)._projectionSyncIds = ids.map((doc: any) => doc._id);
    } catch (error) {
      console.error("[TournamentProjectionSync] pre-updateOne id capture failed:", error);
    }
  });

  schema.pre("updateMany", async function () {
    try {
      const ids = await (this as any).model.find(this.getFilter()).select("_id").lean();
      (this as any)._projectionSyncIds = ids.map((doc: any) => doc._id);
    } catch (error) {
      console.error("[TournamentProjectionSync] pre-updateMany id capture failed:", error);
    }
  });

  schema.post("save", async function (doc: any) {
    try {
      await syncTournamentProjections(doc);
    } catch (error) {
      console.error("[TournamentProjectionSync] save sync failed:", error);
    }
  });

  schema.post("findOneAndDelete", async function (doc: any) {
    if (!doc?._id) return;
    try {
      await cleanupTournamentProjections(doc._id);
    } catch (error) {
      console.error("[TournamentProjectionSync] delete sync failed:", error);
    }
  });

  schema.post("findOneAndUpdate", async function (doc: any) {
    if (!doc?._id) return;
    try {
      // Ensure we sync with the latest stored state after atomic updates.
      const latestDoc = await (this as any).model.findById(doc._id).lean();
      if (latestDoc) {
        await syncTournamentProjections(latestDoc);
      }
    } catch (error) {
      console.error("[TournamentProjectionSync] findOneAndUpdate sync failed:", error);
    }
  });

  schema.post("updateOne", async function () {
    const ids = ((this as any)._projectionSyncIds || []) as any[];
    if (ids.length === 0) return;

    try {
      const latestDocs = await (this as any).model.find({ _id: { $in: ids } }).lean();
      await Promise.all(latestDocs.map((doc: any) => syncTournamentProjections(doc)));
    } catch (error) {
      console.error("[TournamentProjectionSync] updateOne sync failed:", error);
    }
  });

  schema.post("updateMany", async function () {
    const ids = ((this as any)._projectionSyncIds || []) as any[];
    if (ids.length === 0) return;

    try {
      const latestDocs = await (this as any).model.find({ _id: { $in: ids } }).lean();
      await Promise.all(latestDocs.map((doc: any) => syncTournamentProjections(doc)));
    } catch (error) {
      console.error("[TournamentProjectionSync] updateMany sync failed:", error);
    }
  });

  schema.post("deleteOne", { document: true, query: false }, async function () {
    const tournamentId = (this as any)?._id;
    if (!tournamentId) return;
    try {
      await cleanupTournamentProjections(tournamentId);
    } catch (error) {
      console.error("[TournamentProjectionSync] delete sync failed:", error);
    }
  });
}
