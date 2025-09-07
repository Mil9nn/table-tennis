import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Game from "@/models/Game";
import { getServerSession } from "next-auth";

export async function GET() {
  await connectDB();

  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await Game.find({ userId: session.user.id }).sort({ createdAt: -1 });

  return NextResponse.json(games);
}
