import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    if (!query) {
      return NextResponse.json({ success: true, teams: [] });
    }

    // Search teams by name (case-insensitive)
    const teams = await Team.find({
      name: { $regex: query, $options: "i" },
    })
      .select("_id name city logo captain") // keep lightweight
      .populate("captain", "username fullName")
      .limit(10);

    return NextResponse.json({ success: true, teams });
  } catch (error: any) {
    console.error("Error searching teams:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
