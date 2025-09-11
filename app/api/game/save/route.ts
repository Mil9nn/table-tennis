import { NextRequest, NextResponse } from "next/server";
import Game from "@/models/game.model";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { player1, player2 } = await req.json();

    const game = await Game.create({
      userId: decoded.userId,
      player1,
      player2,
    });

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error("Save game error:", error);
    return NextResponse.json({ success: false, message: "DB Error" }, { status: 500 });
  }
}