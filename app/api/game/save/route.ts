import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Game from "@/models/Game";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const token = req.cookies.get("token")?.value; // or however you store it
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token); // decode & verify your JWT
    if (!user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { player1, player2 } = await req.json();

    const game = await Game.create({
      userId: user.id,
      player1,
      player2,
    });

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error("Save game error:", error);
    return NextResponse.json({ success: false, message: "DB Error" }, { status: 500 });
  }
}
