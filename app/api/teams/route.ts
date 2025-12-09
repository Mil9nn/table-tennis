import { NextResponse, NextRequest } from "next/server";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit/middleware";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    let query = Team.find()
      .populate("captain", "username fullName profileImage")
      .populate("players.user", "username fullName profileImage")
      .sort({ name: 1 });

    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);

    const teams = await query.exec();

    const formatted = teams.map((t) => {
      const playersWithAssignments = t.players.map((p: any) => ({
        ...p.toObject(),
        assignment: t.assignments?.get(p.user._id.toString()) || null,
      }));

      // Check if team has any assignments
      const hasAssignments = t.assignments && t.assignments.size > 0;

      return { 
        ...t.toObject(), 
        players: playersWithAssignments,
        hasAssignments, // ✅ Add this flag for frontend
      };
    });

    // Get total count for pagination
    const totalCount = await Team.countDocuments();
    const hasMore = skip + teams.length < totalCount;

    return NextResponse.json({
      teams: formatted,
      pagination: {
        total: totalCount,
        skip,
        limit: limit > 0 ? limit : totalCount,
        hasMore,
      },
    });
  } catch (error: any) {
    console.error("[teams GET] Error:", error);
    return NextResponse.json(
      { 
        message: "Failed to fetch teams",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, "POST", "/api/teams");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    // Parse multipart/form-data
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const city = formData.get("city") as string;
    const captain = formData.get("captain") as string;
    const playersJson = formData.get("players") as string;
    const teamImage = formData.get("teamImage") as Blob | null;

    

    // Parse players array
    const players = playersJson ? JSON.parse(playersJson) : [];

    // Validate required fields
    if (!name || !captain || !players || players.length < 2) {
      return NextResponse.json(
        { message: "Name, captain, and at least 2 players are required" },
        { status: 400 }
      );
    }

    // ✅ Verify that the authenticated user is the captain
    if (captain !== auth.userId) {
      return NextResponse.json(
        { message: "You can only create a team where you are the captain" },
        { status: 403 }
      );
    }

    // Check if team name exists
    const existing = await Team.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { message: "Team name already exists" },
        { status: 400 }
      );
    }

    // Validate captain exists
    const captainUser = await User.findById(captain);
    if (!captainUser) {
      return NextResponse.json(
        { message: "Captain not found" },
        { status: 400 }
      );
    }

    // Validate all players exist
    const playerDocs = await User.find({ _id: { $in: players } });
    if (playerDocs.length !== players.length) {
      return NextResponse.json(
        { message: "One or more players not found" },
        { status: 400 }
      );
    }

    // Upload team image to Cloudinary if provided
    let logoUrl: string | undefined;
    if (teamImage && teamImage.size > 0) {
      
      const buffer = Buffer.from(await teamImage.arrayBuffer());
      const base64Image = `data:${teamImage.type};base64,${buffer.toString("base64")}`;

      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "team_images",
        public_id: `team_${Date.now()}`,
        overwrite: true,
        resource_type: "image",
      });

      logoUrl = uploadResult.secure_url;
      
    } else {
      
    }

    // Format players for schema
    const formattedPlayers = playerDocs.map((p) => ({
      user: p._id,
      role: "player",
    }));

    const team = new Team({
      name,
      city,
      captain: captainUser._id,
      players: formattedPlayers,
      logo: logoUrl, // Include logo URL if image was uploaded
      assignments: new Map(), // Initialize empty assignments
    });

    
    await team.save();

    // Populate for response
    await team.populate([
      { path: "captain", select: "username fullName profileImage" },
      { path: "players.user", select: "username fullName profileImage" },
    ]);

    return NextResponse.json(
      {
        message: "Team created successfully. Don't forget to assign player positions!",
        ...team.toObject(),
        needsAssignments: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[teams POST] Error:", error);
    return NextResponse.json(
      { 
        message: "Failed to create team",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}