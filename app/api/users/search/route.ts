import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";

// Returns up to 10 results for autocomplete fields.
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    // Prevent expensive regex on empty/short queries
    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Case-insensitive search on username OR fullName
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
      ],
    })
      .select("_id username fullName profileImage")
      .limit(10);

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Error searching users:", err);
    return NextResponse.json(
      { message: "Failed to search users" },
      { status: 500 }
    );
  }
}