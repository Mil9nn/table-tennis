import { default as IndividualMatchModel } from "@/models/IndividualMatch";
import { default as TeamMatchModel } from "@/models/TeamMatch";
import PlayerStats from "@/models/PlayerStats";
import TeamStats from "@/models/TeamStats";
import LeaderboardCache from "@/models/LeaderboardCache";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import Team from "@/models/Team";
import { IndividualMatch, TeamInfo, TeamMatch } from "@/types/match.type";

class StatsService {
  async updateIndividualMatchStats(matchId: string) {
    await connectDB();

    const match = await IndividualMatchModel.findById(matchId)
      .populate("participants", "username fullName profileImage")
      .lean<IndividualMatch | null>();

    if (!match || match.status !== "completed" || !match.winnerSide) {
      return;
    }

    // Determine match type
    const matchType = match.matchType;

    // Determine winners and losers
    const { winners, losers } = this.determineIndividualMatchResult(match);

    // Update each winner's stats
    for (const player of winners) {
      await this.updatePlayerStats(
        player._id.toString(),
        matchType,
        {
          result: "win",
          match: match,
          opponents: losers.map((p: any) => p._id.toString()),
        }
      );
    }

    // Update each loser's stats
    for (const player of losers) {
      await this.updatePlayerStats(
        player._id.toString(),
        matchType,
        {
          result: "loss",
          match: match,
          opponents: winners.map((p: any) => p._id.toString()),
        }
      );
    }

    // Invalidate leaderboard cache for this match type
    await this.invalidateLeaderboardCache(`individual_${matchType}`);
  }

  /**
   * Update stats for a team match that just completed
   */
  async updateTeamMatchStats(matchId: string) {
    await connectDB();

    const match = await TeamMatchModel.findById(matchId)
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .lean<TeamMatch>();

    if (!match || match.status !== "completed") {
      return;
    }

    // Determine result (win, loss, or tie)
    const result = this.determineTeamMatchResult(match);

    // Update team1 stats
    if (match.team1?.name) {
      await this.updateTeamStatsForMatch(
        match.team1,
        result.team1Result,
        match
      );
    }

    // Update team2 stats
    if (match.team2?.name) {
      await this.updateTeamStatsForMatch(
        match.team2,
        result.team2Result,
        match
      );
    }

    // Invalidate team leaderboard cache
    await this.invalidateLeaderboardCache("team");
  }

  /**
   * Update a single player's stats document
   */
  private async updatePlayerStats(
    userId: string,
    matchType: string,
    matchData: {
      result: "win" | "loss";
      match: any;
      opponents: string[];
    }
  ) {
    await connectDB();

    // Find or create PlayerStats document
    let stats = await PlayerStats.findOne({ user: userId, matchType });
    if (!stats) {
      stats = new PlayerStats({ user: userId, matchType });
    }

    // Update match counts
    stats.totalMatches += 1;

    if (matchData.result === "win") {
      stats.wins += 1;
      // Update win streak
      if (stats.currentStreak >= 0) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }
      stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentStreak);
    } else {
      stats.losses += 1;
      // Update loss streak
      if (stats.currentStreak <= 0) {
        stats.currentStreak -= 1;
      } else {
        stats.currentStreak = -1;
      }
      stats.worstLoseStreak = Math.min(stats.worstLoseStreak, stats.currentStreak);
    }

    // Update win rate
    stats.winRate = (stats.wins / stats.totalMatches) * 100;

    // Update sets/points from match data
    const userSide = this.getUserSide(matchData.match, userId);
    if (matchData.match.finalScore) {
      const userSets = userSide === "side1"
        ? matchData.match.finalScore.side1Sets || 0
        : matchData.match.finalScore.side2Sets || 0;
      const opponentSets = userSide === "side1"
        ? matchData.match.finalScore.side2Sets || 0
        : matchData.match.finalScore.side1Sets || 0;

      stats.setsWon += userSets;
      stats.setsLost += opponentSets;
      stats.setWinRate = stats.setsWon / (stats.setsWon + stats.setsLost) * 100;
    }

    // Update shot statistics
    const shots = this.extractPlayerShots(matchData.match, userId);
    this.mergeShots(stats.shots, shots);

    // Update head-to-head records
    for (const opponentId of matchData.opponents) {
      let h2h = stats.headToHead.get(opponentId);
      if (!h2h) {
        h2h = { matches: 0, wins: 0, losses: 0 };
        stats.headToHead.set(opponentId, h2h);
      }
      h2h.matches += 1;
      if (matchData.result === "win") {
        h2h.wins += 1;
      } else {
        h2h.losses += 1;
      }
      stats.headToHead.set(opponentId, h2h);
    }

    // Update recent matches (keep last 10)
    const opponentNames = await this.getOpponentNames(matchData.opponents);
    stats.recentMatches.unshift({
      matchId: matchData.match._id,
      opponent: opponentNames,
      result: matchData.result,
      score: this.formatIndividualMatchScore(matchData.match),
      date: matchData.match.createdAt || new Date(),
    });
    stats.recentMatches = stats.recentMatches.slice(0, 10);

    stats.lastMatchDate = new Date();
    await stats.save();
  }

  /**
   * Update team stats for a completed match
   */
  private async updateTeamStatsForMatch(
    teamInfo: any,
    result: "win" | "loss" | "tie",
    match: any
  ) {
    await connectDB();

    // Find or create TeamStats document (we need to find the Team document first)
    const team = await Team.findOne({ name: teamInfo.name }).lean<TeamInfo>();
    if (!team) return;

    let stats = await TeamStats.findOne({ team: team._id });
    if (!stats) {
      stats = new TeamStats({ team: team._id });
    }

    // Update match counts
    stats.totalMatches += 1;

    if (result === "win") {
      stats.wins += 1;
      // Update win streak
      if (stats.currentStreak >= 0) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }
      stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentStreak);
    } else if (result === "loss") {
      stats.losses += 1;
      // Update loss streak
      if (stats.currentStreak <= 0) {
        stats.currentStreak -= 1;
      } else {
        stats.currentStreak = -1;
      }
    } else {
      stats.ties += 1;
      stats.currentStreak = 0;
    }

    // Update win rate
    stats.winRate = stats.totalMatches > 0
      ? (stats.wins / stats.totalMatches) * 100
      : 0;

    // Update submatch stats and player contributions
    const isTeam1 = match.team1.name === teamInfo.name;
    if (match.subMatches && match.subMatches.length > 0) {
      match.subMatches.forEach((subMatch: any) => {
        stats.subMatchesPlayed += 1;

        // Determine if this team won the submatch
        const teamWon = (isTeam1 && subMatch.winnerSide === "team1") ||
                       (!isTeam1 && subMatch.winnerSide === "team2");

        if (teamWon) {
          stats.subMatchesWon += 1;
        } else {
          stats.subMatchesLost += 1;
        }

        // Update player contributions
        const teamPlayers = isTeam1 ? subMatch.playerTeam1 : subMatch.playerTeam2;
        const playerIds = Array.isArray(teamPlayers) ? teamPlayers : [teamPlayers];

        playerIds.forEach((playerId: any) => {
          const pId = playerId.toString();
          let contribution = stats.playerContributions.get(pId);
          if (!contribution) {
            contribution = {
              subMatchesPlayed: 0,
              subMatchesWon: 0,
              subMatchesLost: 0,
              winRate: 0,
            };
          }

          contribution.subMatchesPlayed += 1;
          if (teamWon) {
            contribution.subMatchesWon += 1;
          } else {
            contribution.subMatchesLost += 1;
          }
          contribution.winRate = contribution.subMatchesPlayed > 0
            ? (contribution.subMatchesWon / contribution.subMatchesPlayed) * 100
            : 0;

          stats.playerContributions.set(pId, contribution);
        });
      });
    }

    // Update recent matches (keep last 10)
    const opponentName = isTeam1 ? match.team2.name : match.team1.name;
    stats.recentMatches.unshift({
      matchId: match._id,
      opponent: opponentName,
      result: result,
      score: `${match.finalScore?.team1Matches || 0}-${match.finalScore?.team2Matches || 0}`,
      date: match.createdAt || new Date(),
    });
    stats.recentMatches = stats.recentMatches.slice(0, 10);

    stats.lastMatchDate = new Date();
    await stats.save();
  }

  /**
   * Generate and cache leaderboard rankings
   */
  async generateLeaderboardCache(type: string) {
    await connectDB();

    let rankings: any[] = [];

    if (type.startsWith("individual_")) {
      const matchType = type.replace("individual_", "");
      const stats = await PlayerStats.find({
        matchType,
        totalMatches: { $gte: 1 },
      })
        .populate("user", "fullName username profileImage")
        .sort({ wins: -1, winRate: -1 })
        .limit(100)
        .lean();

      rankings = stats.map((stat: any, index: number) => ({
        rank: index + 1,
        entityId: stat.user._id,
        entityName: stat.user.fullName || stat.user.username,
        profileImage: stat.user.profileImage,
        matches: stat.totalMatches,
        wins: stat.wins,
        losses: stat.losses,
        winRate: stat.winRate,
        setsWon: stat.setsWon,
        setsLost: stat.setsLost,
        streak: stat.currentStreak,
        lastMatchDate: stat.lastMatchDate,
      }));
    } else if (type === "team") {
      const stats = await TeamStats.find({
        totalMatches: { $gte: 1 },
      })
        .populate("team", "name")
        .sort({ wins: -1, winRate: -1 })
        .limit(50)
        .lean();

      rankings = stats.map((stat: any, index: number) => ({
        rank: index + 1,
        entityId: stat.team._id,
        entityName: stat.team.name,
        matches: stat.totalMatches,
        wins: stat.wins,
        losses: stat.losses,
        ties: stat.ties,
        winRate: stat.winRate,
        streak: stat.currentStreak,
        lastMatchDate: stat.lastMatchDate,
      }));
    }

    // Save cache with 1 hour expiration
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    await LeaderboardCache.create({
      type,
      rankings,
      generatedAt: new Date(),
      expiresAt,
    });

    return rankings;
  }

  /**
   * Invalidate (delete) leaderboard cache
   */
  async invalidateLeaderboardCache(type: string) {
    await connectDB();
    await LeaderboardCache.deleteMany({ type });
  }

  // ========== HELPER METHODS ==========

  /**
   * Determine winners and losers from an individual match
   */
  private determineIndividualMatchResult(match: any): {
    winners: any[];
    losers: any[];
  } {
    const participants = match.participants || [];
    const isSingles = match.matchType === "singles";

    // Safely access participants with null checks
    const side1Players = isSingles
      ? [participants[0]].filter(Boolean)
      : [participants[0], participants[1]].filter(Boolean);
    const side2Players = isSingles
      ? [participants[1]].filter(Boolean)
      : [participants[2], participants[3]].filter(Boolean);

    const winners = match.winnerSide === "side1" ? side1Players : side2Players;
    const losers = match.winnerSide === "side1" ? side2Players : side1Players;

    return { winners, losers };
  }

  /**
   * Determine team match result
   */
  private determineTeamMatchResult(match: any): {
    team1Result: "win" | "loss" | "tie";
    team2Result: "win" | "loss" | "tie";
  } {
    const team1Matches = match.finalScore?.team1Matches || 0;
    const team2Matches = match.finalScore?.team2Matches || 0;

    if (team1Matches > team2Matches) {
      return { team1Result: "win", team2Result: "loss" };
    } else if (team2Matches > team1Matches) {
      return { team1Result: "loss", team2Result: "win" };
    } else {
      return { team1Result: "tie", team2Result: "tie" };
    }
  }

  /**
   * Get which side the user is on
   */
  private getUserSide(match: any, userId: string): "side1" | "side2" {
    const participants = match.participants || [];
    const isSingles = match.matchType === "singles";
    if (isSingles) {
      return participants[0]?._id?.toString() === userId ? "side1" : "side2";
    } else {
      // Doubles: side1 is players 0,1 and side2 is players 2,3
      const isInSide1 =
        participants[0]?._id?.toString() === userId ||
        participants[1]?._id?.toString() === userId;
      return isInSide1 ? "side1" : "side2";
    }
  }

  /**
   * Extract shot statistics for a player from a match
   */
  private extractPlayerShots(match: any, userId: string): any {
    const shots = {
      forehand: { total: 0, winners: 0, errors: 0 },
      backhand: { total: 0, winners: 0, errors: 0 },
      serve: { total: 0, winners: 0, errors: 0 },
      // Track serve types that fetched points
      serveTypes: { side_spin: 0, top_spin: 0, back_spin: 0, mix_spin: 0, no_spin: 0 },
      offensive: 0,
      defensive: 0,
      neutral: 0,
      detailed: {} as Record<string, number>,
    };

    if (!match.games) return shots;

    match.games.forEach((game: any) => {
      if (!game.shots) return;

      game.shots.forEach((shot: any) => {
        if (shot.player?.toString() !== userId.toString()) return;

        if (!shot.stroke) return;

        // Update detailed shot counts
        if (!shots.detailed[shot.stroke]) {
          shots.detailed[shot.stroke] = 0;
        }
        shots.detailed[shot.stroke] += 1;

        // Serve-specific handling
        if (shot.stroke === "serve_point") {
          shots.serve.total += 1;

          // If serveType present, increment corresponding counter
          if (shot.serveType) {
            const key = shot.serveType as keyof typeof shots.serveTypes;
            if (shots.serveTypes[key] !== undefined) {
              shots.serveTypes[key] += 1;
            }
          }
        }

        // Update forehand/backhand
        if (shot.stroke.startsWith("forehand")) {
          shots.forehand.total += 1;
        } else if (shot.stroke.startsWith("backhand")) {
          shots.backhand.total += 1;
        }

        // Update offensive/defensive/neutral
        if (
          shot.stroke.includes("smash") ||
          shot.stroke.includes("loop") ||
          shot.stroke.includes("topspin")
        ) {
          shots.offensive += 1;
        } else if (
          shot.stroke.includes("push") ||
          shot.stroke.includes("block") ||
          shot.stroke.includes("chop")
        ) {
          shots.defensive += 1;
        } else {
          shots.neutral += 1;
        }
      });
    });

    return shots;
  }

  /**
   * Merge new shot data into existing stats
   */
  private mergeShots(existingShots: any, newShots: any) {
    existingShots.forehand.total += newShots.forehand.total;
    existingShots.forehand.winners += newShots.forehand.winners;
    existingShots.forehand.errors += newShots.forehand.errors;

    existingShots.backhand.total += newShots.backhand.total;
    existingShots.backhand.winners += newShots.backhand.winners;
    existingShots.backhand.errors += newShots.backhand.errors;

    existingShots.serve.total += newShots.serve.total;
    existingShots.serve.winners += newShots.serve.winners;
    existingShots.serve.errors += newShots.serve.errors;

    // Merge serveTypes
    for (const k of Object.keys(newShots.serveTypes || {})) {
      if (!existingShots.serveTypes[k]) existingShots.serveTypes[k] = 0;
      existingShots.serveTypes[k] += (newShots.serveTypes as any)[k];
    }

    existingShots.offensive += newShots.offensive;
    existingShots.defensive += newShots.defensive;
    existingShots.neutral += newShots.neutral;

    // Merge detailed shots
    for (const [stroke, count] of Object.entries(newShots.detailed)) {
      if (!existingShots.detailed[stroke]) {
        existingShots.detailed[stroke] = 0;
      }
      existingShots.detailed[stroke] += count as number;
    }
  }

  /**
   * Get opponent names from IDs
   */
  private async getOpponentNames(opponentIds: string[]): Promise<string> {
    const opponents = await User.find({ _id: { $in: opponentIds } })
      .select("fullName username")
      .lean();

    return opponents
      .map((opp: any) => opp.fullName || opp.username)
      .join(", ");
  }

  /**
   * Format match score string
   */
  private formatIndividualMatchScore(match: any): string {
    const side1Sets = match.finalScore?.side1Sets || 0;
    const side2Sets = match.finalScore?.side2Sets || 0;
    return `${side1Sets}-${side2Sets}`;
  }
}

export const statsService = new StatsService();
