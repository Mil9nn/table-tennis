// app/api/tournaments/[id]/toggle-join-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

/**
 * Generate a unique 6-character join code
 */
function generateJoinCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar-looking characters
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Toggle join by code feature for a tournament
 * Generates a unique join code if enabling
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only organizer can toggle join code
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { enable } = await req.json();

    if (enable) {
      // Generate a unique join code
      let joinCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        joinCode = generateJoinCode();
        const existing = await Tournament.findOne({ joinCode });
        if (!existing) {
          isUnique = true;
          tournament.joinCode = joinCode;
        }
        attempts++;
      }

      if (!isUnique) {
        return NextResponse.json(
          { error: "Failed to generate unique join code. Please try again." },
          { status: 500 }
        );
      }

      tournament.allowJoinByCode = true;
    } else {
      // Disable join by code (but keep the code for reference)
      tournament.allowJoinByCode = false;
    }

    await tournament.save();

    return NextResponse.json({
      message: enable
        ? "Join by code enabled"
        : "Join by code disabled",
      joinCode: tournament.joinCode,
      allowJoinByCode: tournament.allowJoinByCode,
    });
  } catch (err: any) {
    console.error("Error toggling join code:", err);
    return NextResponse.json(
      { error: "Failed to toggle join code", details: err.message },
      { status: 500 }
    );
  }
}
