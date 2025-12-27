// helpers for scoring / winners

export function computeGameWinnerFromScores(scoresObj: Record<string, number>) {
  const entries = Object.entries(scoresObj || {});
  if (entries.length === 0) return null;
  entries.sort((a,b) => b[1] - a[1]);
  const [leaderId, leaderScore] = entries[0];
  const secondScore = entries[1]?.[1] ?? 0;
  if (leaderScore >= 11 && leaderScore - secondScore >= 2) return leaderId;
  return null;
}

export function computeMatchWinner(match: any) {
  const winCounts: Record<string, number> = {};
  for (const g of match.games || []) {
    if (g.winnerId) winCounts[g.winnerId] = (winCounts[g.winnerId] || 0) + 1;
  }
  const required = Math.floor((match.bestOfGames ?? 3) / 2) + 1;
  for (const [id, cnt] of Object.entries(winCounts)) {
    if (cnt >= required) return id;
  }
  return null;
}

// build schedule examples for team formats
export function buildScheduleFor5Singles(teamA: any[], teamB: any[]) {
  // Inputs: arrays of userIds in order A,B,C and X,Y,Z
  // Output pairs length 5: left,right
  // using A,B,C,A,B and X,Y,Z,Y,X mapping requested earlier
  const left = [...teamA, ...teamA].slice(0,5);
  const right = [...teamB, ...teamB].slice(0,5).map((p, i) => teamB[i % teamB.length]);
  return left.map((l, idx) => ({ left: l, right: right[idx] }));
}

export function buildScheduleSingleDoubleSingle(teamA: any[], teamB: any[]) {
  // A, AB, B vs X, XY, Y
  return [
    { left: [teamA[0]], right: [teamB[0]] },
    { left: [teamA[0], teamA[1]], right: [teamB[0], teamB[1]] },
    { left: [teamA[1]], right: [teamB[1]] },
  ];
}

/**
 * Check if a user is a participant in a match
 * @param userId - The user ID to check
 * @param match - The match object (individual or team)
 * @returns true if user is a participant, false otherwise
 */
export function isUserParticipantInMatch(userId: string, match: any): boolean {
  if (!match || !userId) return false;

  // Handle individual matches
  if (match.matchCategory === "individual") {
    const participants = match.participants || [];
    return participants.some((p: any) => {
      const participantId = p._id?.toString() || p.toString();
      return participantId === userId;
    });
  }

  // Handle team matches
  if (match.matchCategory === "team") {
    // Check team1 players
    const team1Players = match.team1?.players || [];
    for (const player of team1Players) {
      const playerId = player.user?._id?.toString() || player.user?.toString() || player.user?._id || player.user;
      if (playerId === userId) return true;
    }

    // Check team2 players
    const team2Players = match.team2?.players || [];
    for (const player of team2Players) {
      const playerId = player.user?._id?.toString() || player.user?.toString() || player.user?._id || player.user;
      if (playerId === userId) return true;
    }

    // Check subMatches players
    const subMatches = match.subMatches || [];
    for (const subMatch of subMatches) {
      const team1SubPlayers = Array.isArray(subMatch.playerTeam1)
        ? subMatch.playerTeam1
        : [subMatch.playerTeam1];
      const team2SubPlayers = Array.isArray(subMatch.playerTeam2)
        ? subMatch.playerTeam2
        : [subMatch.playerTeam2];

      for (const player of [...team1SubPlayers, ...team2SubPlayers]) {
        if (!player) continue;
        const playerId = player._id?.toString() || player.toString() || player._id || player;
        if (playerId === userId) return true;
      }
    }
  }

  return false;
}