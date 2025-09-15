import { NextRequest, NextResponse } from 'next/server';
import Match from '@/models/Match';

// Update match score and add shot
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { 
      gameNumber, 
      player1Score, 
      player2Score, 
      shotData,
      gameWinner 
    } = body;
    
    const { id } = await context.params;
    const match = await Match.findById(id);
    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    // Find or create the current game
    let currentGame = match.games.find(g => g.gameNumber === gameNumber);
    
    if (!currentGame) {
      currentGame = {
        gameNumber,
        player1Score: 0,
        player2Score: 0,
        shots: [],
        startTime: new Date()
      };
      match.games.push(currentGame);
    }
    
    // Update scores
    currentGame.player1Score = player1Score;
    currentGame.player2Score = player2Score;
    
    // Add shot data if provided
    if (shotData) {
      currentGame.shots.push({
        shotNumber: currentGame.shots.length + 1,
        player: shotData.player,
        shotType: shotData.shotType,
        result: shotData.result,
        timestamp: new Date()
      });
      
      // Update match statistics
      match.statistics.totalShots += 1;
      
      // Update player statistics
      if (shotData.player === 'player1') {
        match.statistics.playerStats.player1.shotBreakdown[shotData.shotType] += 1;
        if (shotData.result === 'winner') {
          match.statistics.playerStats.player1.winners += 1;
        } else if (shotData.result === 'error') {
          match.statistics.playerStats.player1.errors += 1;
        }
      } else {
        match.statistics.playerStats.player2.shotBreakdown[shotData.shotType] += 1;
        if (shotData.result === 'winner') {
          match.statistics.playerStats.player2.winners += 1;
        } else if (shotData.result === 'error') {
          match.statistics.playerStats.player2.errors += 1;
        }
      }
    }
    
    // Check if game is won
    if (gameWinner) {
      currentGame.winner = gameWinner;
      currentGame.endTime = new Date();
      currentGame.duration = Math.floor((currentGame.endTime - currentGame.startTime) / 1000);
      
      // Update final score
      if (gameWinner === 'player1') {
        match.finalScore.player1Sets += 1;
      } else {
        match.finalScore.player2Sets += 1;
      }
      
      // Check if match is won
      const setsToWin = Math.ceil(match.numberOfSets / 2);
      if (match.finalScore.player1Sets === setsToWin) {
        match.winner = 'player1';
        match.status = 'completed';
      } else if (match.finalScore.player2Sets === setsToWin) {
        match.winner = 'player2';
        match.status = 'completed';
      }
    }
    
    await match.save();
    
    return NextResponse.json({ 
      match, 
      message: 'Score updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating score:', error);
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
  }
}