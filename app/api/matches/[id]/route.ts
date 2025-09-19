import { NextRequest, NextResponse } from 'next/server';
import Match from '@/models/Match';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;

    const match = await Match.findById(id)
    .populate('scorer', 'username fullName')
    .populate("participants", "username fullName")
    .populate({ path: "team1", populate: { path: "players.user", select: "username fullName" }})
    .populate({ path: "team2", populate: { path: "players.user", select: "username fullName" }});

    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return NextResponse.json({ match });
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();

    const { id } = await context.params;

    const match = await Match.findByIdAndUpdate(id, { $set: body }, { new: true })
    .populate('scorer', 'username fullName')
    .populate("participants", "username fullName")
    .populate({ path: "team1", populate: { path: "players.user", select: "username fullName" }})
    .populate({ path: "team2", populate: { path: "players.user", select: "username fullName" }});
    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return NextResponse.json({ match, message: 'Match updated successfully' });
    
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}