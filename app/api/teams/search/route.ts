import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";
import { connectDB } from "@/lib/mongodb";
import { escapeRegex } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    if (!query) {
      return NextResponse.json({ success: true, teams: [] });
    }

    // Escape special regex characters to prevent ReDoS attacks
    const safeQuery = escapeRegex(query);

    // Search teams by name (case-insensitive)
    const teams = await Team.find({
      name: { $regex: safeQuery, $options: "i" },
    })
      .select("_id name city logo captain")
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
