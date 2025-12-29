import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only scorer can swap
    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can swap sides" },
        { status: 403 }
      );
    }

    // Validate match status
    if (!["in_progress", "scheduled"].includes(match.status)) {
      return NextResponse.json(
        { error: "Cannot swap: match must be in progress or scheduled" },
        { status: 400 }
      );
    }

    // Validate current game score is 0-0
    const currentGameData = match.games?.find(
      (g: any) => g.gameNumber === match.currentGame
    );

    if (currentGameData) {
      const side1Score = currentGameData.side1Score || 0;
      const side2Score = currentGameData.side2Score || 0;

      if (side1Score !== 0 || side2Score !== 0) {
        return NextResponse.json(
          { error: "Cannot swap: current game score must be 0-0" },
          { status: 400 }
        );
      }
    }

    // Determine if singles or doubles
    const isDoubles = match.matchType === "doubles";

    if (isDoubles) {
      // Doubles: swap [p0, p1, p2, p3] → [p2, p3, p0, p1]
      if (match.participants.length !== 4) {
        return NextResponse.json(
          { error: "Invalid doubles match: must have exactly 4 participants" },
          { status: 400 }
        );
      }

      const [p0, p1, p2, p3] = match.participants;
      match.participants = [p2, p3, p0, p1];

      // Update currentServer to follow the actual serving player
      if (match.currentServer) {
        if (match.currentServer === "side1_main") {
          match.currentServer = "side2_main";
        } else if (match.currentServer === "side2_main") {
          match.currentServer = "side1_main";
        } else if (match.currentServer === "side1_partner") {
          match.currentServer = "side2_partner";
        } else if (match.currentServer === "side2_partner") {
          match.currentServer = "side1_partner";
        }
      }

      // Update serverConfig.firstServer to follow the actual player
      if (match.serverConfig?.firstServer) {
        if (match.serverConfig.firstServer === "side1_main") {
          match.serverConfig.firstServer = "side2_main";
        } else if (match.serverConfig.firstServer === "side2_main") {
          match.serverConfig.firstServer = "side1_main";
        } else if (match.serverConfig.firstServer === "side1_partner") {
          match.serverConfig.firstServer = "side2_partner";
        } else if (match.serverConfig.firstServer === "side2_partner") {
          match.serverConfig.firstServer = "side1_partner";
        }
      }

      // Update serverConfig.serverOrder to follow actual players
      if (match.serverConfig?.serverOrder && Array.isArray(match.serverConfig.serverOrder)) {
        match.serverConfig.serverOrder = match.serverConfig.serverOrder.map((key: string) => {
          if (key === "side1_main") return "side2_main";
          if (key === "side2_main") return "side1_main";
          if (key === "side1_partner") return "side2_partner";
          if (key === "side2_partner") return "side1_partner";
          return key;
        });
      }
    } else {
      // Singles: swap participants[0] ↔ participants[1]
      if (match.participants.length !== 2) {
        return NextResponse.json(
          { error: "Invalid singles match: must have exactly 2 participants" },
          { status: 400 }
        );
      }

      const [p0, p1] = match.participants;
      match.participants = [p1, p0];

      // Update serverConfig.firstServer (flip side1 ↔ side2)
      if (match.serverConfig?.firstServer) {
        match.serverConfig.firstServer =
          match.serverConfig.firstServer === "side1" ? "side2" : "side1";
      }

      // Update currentServer (flip side1 ↔ side2)
      if (match.currentServer) {
        match.currentServer =
          match.currentServer === "side1" ? "side2" : "side1";
      }
    }

    await match.save();
    await match.populate("participants", "username fullName");

    return NextResponse.json({ match });
  } catch (err) {
    console.error("Swap error:", err);
    return NextResponse.json(
      { error: "Failed to swap sides" },
      { status: 500 }
    );
  }
}
