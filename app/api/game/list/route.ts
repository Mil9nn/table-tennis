import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import Game from "@/models/game.model";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const decoded = verifyToken(token);
  if (!decoded?.userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const games = await Game.find({ userId: decoded.userId }).sort({ createdAt: -1 });
  return NextResponse.json(games);
}
