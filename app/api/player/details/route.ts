import { NextRequest, NextResponse } from 'next/server';
import Match from '@/models/match.model';

export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all matches with populated user data
    const matches = await Match.find({})
      .populate('player1', 'username fullName email profileImage')
      .populate('player2', 'username fullName email profileImage')
      .populate('winner', 'username fullName email')
      .sort({ createdAt: -1 });
    
    // Build comprehensive player stats
    const playerStats = new Map();

    matches.forEach(match => {
      const processPlayer = (playerField: string, isWinner: boolean) => {
        const player = match[playerField];
        if (!player) return;

        const playerId = player._id.toString();
        
        if (!playerStats.has(playerId)) {
          playerStats.set(playerId, {
            userId: playerId,
            username: player.username,
            displayName: player.fullName,
            email: player.email,
            profileImage: player.profileImage,
            totalMatches: 0,
            wins: 0,
            losses: 0,
            totalPoints: 0,
            totalGames: 0,
            gamesWon: 0,
            totalShots: 0,
            totalPlayTime: 0,
            recentMatches: []
          });
        }
        
        const stats = playerStats.get(playerId);
        stats.totalMatches++;
        
        if (isWinner) {
          stats.wins++;
        } else {
          stats.losses++;
        }
        
        // Process games for this match
        match.games.forEach((game: any) => {
          stats.totalGames++;
          
          const playerScore = playerField === 'player1' ? game.player1Score : game.player2Score;
          const opponentScore = playerField === 'player1' ? game.player2Score : game.player1Score;
          
          stats.totalPoints += playerScore;
          
          if (game.winner && game.winner.toString() === playerId) {
            stats.gamesWon++;
          }
          
          // Count shots
          stats.totalShots += game.shots.filter((shot: any) =>
            shot.player && shot.player.toString() === playerId
          ).length;
        });
        
        // Calculate play time
        if (match.endTime && match.startTime) {
          stats.totalPlayTime += Math.floor((match.endTime - match.startTime) / 60000); // in minutes
        }
        
        // Add to recent matches (limit to 10)
        if (stats.recentMatches.length < 10) {
          const opponent = match.player1._id.toString() === playerId ? match.player2 : match.player1;
          stats.recentMatches.push({
            opponent: opponent.fullName,
            result: isWinner ? 'WIN' : 'LOSS',
            date: match.createdAt,
            duration: match.endTime && match.startTime ? 
              Math.floor((match.endTime - match.startTime) / 60000) : 0
          });
        }
      };

      const winnerId = match.winner?._id?.toString();
      processPlayer('player1', winnerId === match.player1._id.toString());
      processPlayer('player2', winnerId === match.player2._id.toString());
    });

    // Convert to array and add calculated fields
    let leaderboard = Array.from(playerStats.values()).map(player => {
      const winPercentage = player.totalMatches > 0 ? (player.wins / player.totalMatches) * 100 : 0;
      const gameWinPercentage = player.totalGames > 0 ? (player.gamesWon / player.totalGames) * 100 : 0;
      const avgPointsPerGame = player.totalGames > 0 ? player.totalPoints / player.totalGames : 0;
      const avgPointsPerMatch = player.totalMatches > 0 ? player.totalPoints / player.totalMatches : 0;
      const avgGameDuration = player.totalGames > 0 ? player.totalPlayTime / player.totalGames : 0;
      
      // Get recent form (last 5 matches)
      const recentForm = player.recentMatches
        .slice(0, 5)
        .map((match: any) => match.result === 'WIN' ? 'W' : 'L');

      return {
        ...player,
        winPercentage,
        gameWinPercentage,
        avgPointsPerGame,
        avgPointsPerMatch,
        avgGameDuration,
        recentForm,
        // Add placeholder data for detailed stats
        favoriteShot: 'Forehand Drive', // You can calculate this from shot data
        favoriteShotCount: Math.floor(player.totalShots * 0.3),
        leastUsedShot: 'Backhand Loop',
        leastUsedShotCount: Math.floor(player.totalShots * 0.05),
        bestOpponents: [],
        worstOpponents: [],
        shotBreakdown: [],
        matchHistory: player.recentMatches.map((match: any) => ({
          ...match,
          score: '3-1', // You can calculate actual scores
          totalPoints: Math.floor(Math.random() * 50) + 20
        }))
      };
    });

    // Sort by win percentage, then by total matches
    leaderboard.sort((a, b) => {
      if (Math.abs(a.winPercentage - b.winPercentage) < 0.1) {
        return b.totalMatches - a.totalMatches;
      }
      return b.winPercentage - a.winPercentage;
    });

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