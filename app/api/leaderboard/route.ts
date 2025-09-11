// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Match from '@/models/match.model';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all matches
    const matches = await Match.find({}).sort({ createdAt: -1 });
    
    // Build player stats from your existing match data
    const playerStats = new Map();

    matches.forEach(match => {
      // Process player 1
      const p1Id = match.player1.userId;
      if (!playerStats.has(p1Id)) {
        playerStats.set(p1Id, {
          userId: p1Id,
          username: match.player1.username,
          displayName: match.player1.displayName,
          totalMatches: 0,
          wins: 0,
          losses: 0,
          totalPoints: 0,
          totalGames: 0,
          gamesWon: 0
        });
      }
      
      const p1Stats = playerStats.get(p1Id);
      p1Stats.totalMatches++;
      if (match.winner.userId === p1Id) {
        p1Stats.wins++;
      } else {
        p1Stats.losses++;
      }
      
      // Use your existing stats structure
      if (match.stats && match.stats.playerStats && match.stats.playerStats[match.player1.username]) {
        const existingStats = match.stats.playerStats[match.player1.username];
        p1Stats.totalPoints += existingStats.totalPoints || 0;
        p1Stats.gamesWon += existingStats.gamesWon || 0;
      }
      p1Stats.totalGames += match.games.length;

      // Process player 2 (same logic)
      const p2Id = match.player2.userId;
      if (!playerStats.has(p2Id)) {
        playerStats.set(p2Id, {
          userId: p2Id,
          username: match.player2.username,
          displayName: match.player2.displayName,
          totalMatches: 0,
          wins: 0,
          losses: 0,
          totalPoints: 0,
          totalGames: 0,
          gamesWon: 0
        });
      }
      
      const p2Stats = playerStats.get(p2Id);
      p2Stats.totalMatches++;
      if (match.winner.userId === p2Id) {
        p2Stats.wins++;
      } else {
        p2Stats.losses++;
      }
      
      if (match.stats && match.stats.playerStats && match.stats.playerStats[match.player2.username]) {
        const existingStats = match.stats.playerStats[match.player2.username];
        p2Stats.totalPoints += existingStats.totalPoints || 0;
        p2Stats.gamesWon += existingStats.gamesWon || 0;
      }
      p2Stats.totalGames += match.games.length;
    });

    // Convert to array and add calculated fields
    let leaderboard = Array.from(playerStats.values()).map(player => ({
      ...player,
      winPercentage: player.totalMatches > 0 ? (player.wins / player.totalMatches) * 100 : 0,
      averagePointsPerGame: player.totalGames > 0 ? player.totalPoints / player.totalGames : 0
    }));

    // Sort by win percentage
    leaderboard.sort((a, b) => b.winPercentage - a.winPercentage);

    // Limit results
    leaderboard = leaderboard.slice(0, limit);

    return NextResponse.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}