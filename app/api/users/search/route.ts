import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { escapeRegex } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit/middleware";

// Returns up to 10 results for autocomplete fields.
export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, "GET", "/api/users/search");
  if (rateLimitResponse) return rateLimitResponse;

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
  } catch (err: any) {
    console.error("[users/search] Error:", err);
    return NextResponse.json(
      { 
        message: "Failed to search users",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      },
      { status: 500 }
    );
  }
}