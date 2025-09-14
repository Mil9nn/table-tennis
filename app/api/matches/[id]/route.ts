import { NextRequest, NextResponse } from 'next/server';
import Match from '@/models/Match';

// Get single match
export async function GET(request: NextRequest, { params }) {
  try {
    
    const match = await Match.findById(params.id).populate('scorer', 'username');
    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return NextResponse.json({ match });
    
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

// Update match
export async function PUT(request: NextRequest, { params }) {
  try {
    
    const body = await request.json();
    const match = await Match.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    );
    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return NextResponse.json({ match, message: 'Match updated successfully' });
    
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}