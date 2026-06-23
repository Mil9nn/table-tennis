import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { validateRequest, updateTeamSchema } from "@/lib/validations";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    
    const team = await Team.findById(id)
      .populate("captain", "username fullName profileImage")
      .populate("players.user", "username fullName profileImage");

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    const playersWithAssignments = team.players.map((p: any) => {
      const playerId = p.user._id.toString();
      let assignment = null;
      
      if (team.assignments) {
        if (team.assignments instanceof Map) {
          assignment = team.assignments.get(playerId);
        } else if (typeof team.assignments === 'object') {
          assignment = (team.assignments as any)[playerId];
        }
      }
      
      return {
        ...p.toObject(),
        assignment: assignment || null,
      };
    });

    return NextResponse.json({
      team: { ...team.toObject(), players: playersWithAssignments },
    });
  } catch (error: any) {
    console.error("[teams/[id] GET] Error:", error);
    return NextResponse.json(
      { 
        message: "Failed to fetch team",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Rate limiting
  const { id } = await context.params;
  const rateLimitResponse = await rateLimit(req, "PUT", `/api/teams/${id}`);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    // ✅ Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { id } = await context.params;

    // ✅ Check if team exists
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    // ✅ Ensure both IDs are strings for comparison
    const captainId = team.captain._id?.toString() || team.captain.toString();
    const userId = decoded.userId.toString();

    if (captainId !== userId) {
      return NextResponse.json(
        { message: "Forbidden: Only the team captain can edit the team" },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let bodyPayload: Record<string, unknown> = {};
    let teamImage: Blob | null = null;
    let assignments: Record<string, string> | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const name = formData.get("name");
      const city = formData.get("city");
      const playersJson = formData.get("players") as string | null;
      if (typeof name === "string" && name.length > 0) bodyPayload.name = name;
      if (typeof city === "string") {
        const trimmed = city.trim();
        if (trimmed.length >= 2) bodyPayload.city = trimmed;
      }
      if (playersJson) {
        try {
          bodyPayload.players = JSON.parse(playersJson);
        } catch {
          return NextResponse.json(
            { message: "Invalid players payload" },
            { status: 400 }
          );
        }
      }
      teamImage = formData.get("teamImage") as Blob | null;
    } else {
      const body = await req.json();
      bodyPayload = { ...body };
      assignments = body.assignments;
      delete bodyPayload.assignments;
      if (bodyPayload.city === "") delete bodyPayload.city;
    }

    if (Array.isArray(bodyPayload.players)) {
      const playerIds = bodyPayload.players as string[];
      if (!playerIds.includes(captainId)) {
        bodyPayload.players = [...new Set([captainId, ...playerIds])];
      }
      bodyPayload.captain = captainId;
    }

    if (Object.keys(bodyPayload).length > 0) {
      const validation = validateRequest(updateTeamSchema, bodyPayload);
      if (!validation.success) {
        return validation.error;
      }
      const { data } = validation;
      if (data.name) bodyPayload.name = data.name;
      if (data.city !== undefined) bodyPayload.city = data.city;
      if (data.players) bodyPayload.players = data.players;
    }

    const updateData: Record<string, unknown> = {};

    if (bodyPayload.name) updateData.name = bodyPayload.name;
    if (bodyPayload.city !== undefined) updateData.city = bodyPayload.city;

    if (teamImage && teamImage.size > 0) {
      const buffer = Buffer.from(await teamImage.arrayBuffer());
      const base64Image = `data:${teamImage.type};base64,${buffer.toString("base64")}`;

      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "team_images",
        public_id: `team_${id}_${Date.now()}`,
        overwrite: true,
        resource_type: "image",
      });

      updateData.logo = uploadResult.secure_url;
    }

    if (bodyPayload.players && Array.isArray(bodyPayload.players)) {
      const players = bodyPayload.players as string[];
      const playerDocs = await User.find({ _id: { $in: players } });
      if (playerDocs.length !== players.length) {
        return NextResponse.json(
          { message: "One or more players not found" },
          { status: 400 }
        );
      }

      updateData.players = playerDocs.map((p) => ({
        user: p._id,
        role: p._id.toString() === captainId ? "captain" : "player",
        joinedDate: new Date(),
      }));

      const newPlayerIds = new Set(players);
      if (team.assignments && team.assignments.size > 0) {
        const pruned = new Map<string, string>();
        for (const [playerId, position] of team.assignments.entries()) {
          if (newPlayerIds.has(playerId)) {
            pruned.set(playerId, position);
          }
        }
        updateData.assignments = pruned;
      }
    }

    if (assignments) {
      updateData.assignments = new Map(Object.entries(assignments));
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate("captain", "username fullName profileImage")
      .populate("players.user", "username fullName profileImage");

    return NextResponse.json({ message: "Team updated successfully", team: updatedTeam });
  } catch (error: any) {
    console.error("[teams/[id] PUT] Error:", error);
    return NextResponse.json(
      {
        message: "Failed to update team",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // ✅ Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { id } = await context.params;

    // ✅ Check if team exists
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    // ✅ Ensure both IDs are strings for comparison
    const captainId = team.captain._id?.toString() || team.captain.toString();
    const userId = decoded.userId.toString();

    if (captainId !== userId) {
      return NextResponse.json(
        { message: "Forbidden: Only the team captain can delete the team" },
        { status: 403 }
      );
    }

    await Team.findByIdAndDelete(id);

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error: any) {
    console.error("[teams/[id] DELETE] Error:", error);
    return NextResponse.json(
      { 
        message: "Failed to delete team",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}