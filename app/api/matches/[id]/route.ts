import { NextRequest, NextResponse } from "next/server";
import Match from "@/models/match.model";

console.log("Route: app/api/matches/[id]/route.ts");

// GET request → return raw match
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const match = await Match.findById(id).lean();

    if (!match) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, match }, { status: 200 });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST request → update match
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updatedMatch = await Match.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedMatch) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        match: updatedMatch,
        message: "Match updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE request → delete match
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const deleted = await Match.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Match deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
