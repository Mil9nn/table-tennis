import { NextResponse, NextRequest } from "next/server";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { logError } from "@/lib/error-logger";
import { validateQueryParams, searchTeamsQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // Validate query parameters
    const validation = validateQueryParams(searchTeamsQuerySchema, searchParams);
    if (!validation.success) {
      return validation.error;
    }

    const { search, city, sortBy, sortOrder, limit, skip } = validation.data;

    // Build filter object
    const filter: any = {};

    // City filter
    if (city && city !== "all") {
      filter.city = city;
    }

    // Search filter - search by team name, captain, or players
    // We need to use aggregation for searching in populated fields
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      
      // Find matching user IDs (for captain/player search)
      const matchingUsers = await User.find({
        $or: [
          { fullName: searchRegex },
          { username: searchRegex }
        ]
      }).select("_id");
      
      const userIds = matchingUsers.map(u => u._id);
      
      // Build search conditions
      const searchConditions: any[] = [
        { name: searchRegex }
      ];
      
      if (userIds.length > 0) {
        searchConditions.push({ captain: { $in: userIds } });
        searchConditions.push({ "players.user": { $in: userIds } });
      }
      
      filter.$or = searchConditions;
    }

    // Build sort object
    let sortObject: any = {};
    if (sortBy === "name") {
      sortObject.name = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "createdAt") {
      sortObject.createdAt = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "wins" || sortBy === "players") {
      // These require aggregation, fall back to name for now
      // Will be sorted in memory after fetch
      sortObject.name = 1;
    } else {
      sortObject.name = sortOrder === "asc" ? 1 : -1;
    }

    let query = Team.find(filter)
      .populate("captain", "username fullName profileImage")
      .populate("players.user", "username fullName profileImage")
      .sort(sortObject);

    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);

    let teams = await query.exec();

    // Format teams with assignments
    let formatted = teams.map((t) => {
      const playersWithAssignments = t.players.map((p: any) => ({
        ...p.toObject(),
        assignment: t.assignments?.get(p.user._id.toString()) || null,
      }));

      const hasAssignments = t.assignments && t.assignments.size > 0;

      return { 
        ...t.toObject(), 
        players: playersWithAssignments,
        hasAssignments,
      };
    });

    // Sort by wins or players in memory (since these are computed/array fields)
    if (sortBy === "wins") {
      formatted = formatted.sort((a: any, b: any) => {
        const aWins = a.record?.wins || 0;
        const bWins = b.record?.wins || 0;
        return sortOrder === "asc" ? aWins - bWins : bWins - aWins;
      });
    } else if (sortBy === "players") {
      formatted = formatted.sort((a: any, b: any) => {
        const aPlayers = a.players?.length || 0;
        const bPlayers = b.players?.length || 0;
        return sortOrder === "asc" ? aPlayers - bPlayers : bPlayers - aPlayers;
      });
    }

    // Get total count for pagination
    const totalCount = await Team.countDocuments(filter);
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
    logError(error, {
      tags: { feature: "team", action: "fetch", endpoint: "GET /api/teams" },
    });

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

    // Basic validation (Zod validation for FormData is complex, so we do basic checks here)
    if (!name || !captain || !players || players.length < 2) {
      return NextResponse.json(
        { message: "Name, captain, and at least 2 players are required" },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length < 3 || name.trim().length > 100) {
      return NextResponse.json(
        { message: "Team name must be between 3 and 100 characters" },
        { status: 400 }
      );
    }

    // Validate captain is in players list
    if (!players.includes(captain)) {
      return NextResponse.json(
        { message: "Captain must be one of the team players" },
        { status: 400 }
      );
    }

    // Check for duplicate players
    const uniquePlayers = new Set(players);
    if (uniquePlayers.size !== players.length) {
      return NextResponse.json(
        { message: "Duplicate players are not allowed" },
        { status: 400 }
      );
    }

    // Validate image file if provided
    if (teamImage && teamImage.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(teamImage.type)) {
        return NextResponse.json(
          { message: "Only JPEG, PNG, GIF, and WebP images are allowed" },
          { status: 400 }
        );
      }

      if (teamImage.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "Image file size must not exceed 5MB" },
          { status: 400 }
        );
      }
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
    logError(error, {
      tags: { feature: "team", action: "create", endpoint: "POST /api/teams" },
      extra: { teamName: name },
    });

    return NextResponse.json(
      {
        message: "Failed to create team",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}