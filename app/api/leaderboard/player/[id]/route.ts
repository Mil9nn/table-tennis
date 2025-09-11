import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Match from '@/models/match.model';
import { User } from '@/models/user.model';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const userId = params.id;
    
    // Get user basic info
    const user = await User.findById(userId).select('username email');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get all matches for this user
    const matches = await Match.find({
      $or: [{ player1: userId }, { player2: userId }]
    }).sort({ createdAt: -1 });

    // Calculate detailed stats (implement your logic here)
    const detailedStats = {
      id: userId,
      username: user.username,
      email: user.email,
      totalMatches: matches.length,
      wins: matches.filter(m => m.winner === userId).length,
      losses: matches.filter(m => m.winner !== userId).length,
      winPercentage: 0, // Calculate based on wins/total
      totalPoints: 0, // Sum from all matches
      totalGames: 0, // Sum all games
      // ... add other stats
    };

    return NextResponse.json({
      success: true,
      player: detailedStats
    });

  } catch (error) {
    console.error('Player details error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch player details' },
      { status: 500 }
    );
  }
}