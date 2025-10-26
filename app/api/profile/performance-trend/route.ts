// app/api/profile/performance-trend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import IndividualMatch from "@/models/IndividualMatch";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const matches = await IndividualMatch.find({
      participants: decoded.userId,
      status: "completed",
    })
      .sort({ createdAt: 1 })
      .lean();

    // Group by month
    const monthlyData: Record<string, { wins: number; total: number }> = {};

    matches.forEach((match: any) => {
      const date = new Date(match.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { wins: 0, total: 0 };
      }

      const userIndex = match.participants.findIndex(
        (p: any) => p.toString() === decoded.userId
      );
      const userSide = userIndex < 2 ? "side1" : "side2";

      monthlyData[monthKey].total++;
      if (match.winnerSide === userSide) {
        monthlyData[monthKey].wins++;
      }
    });

    const trend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      winRate: (data.wins / data.total) * 100,
      wins: data.wins,
      losses: data.total - data.wins,
    }));

    return NextResponse.json({ success: true, trend });
  } catch (err) {
    console.error("Error fetching performance trend:", err);
    return NextResponse.json({ error: "Failed to fetch trend" }, { status: 500 });
  }
}