import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { escapeRegex } from "@/lib/utils";

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

    // Escape special regex characters to prevent ReDoS attacks
    const safeQuery = escapeRegex(q);

    // Case-insensitive search on username OR fullName
    const users = await User.find({
      $or: [
        { username: { $regex: safeQuery, $options: "i" } },
        { fullName: { $regex: safeQuery, $options: "i" } },
      ],
    })
      .select("_id username fullName gender profileImage")
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