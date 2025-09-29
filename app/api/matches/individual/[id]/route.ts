import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;

    const match = await IndividualMatch.findById(id)
      .populate("scorer", "username fullName")
      .populate("participants", "username fullName")
      .populate("games.shots.player", "username fullName")
      .select("+serverConfig");

    if (!match) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error fetching individual match:", error);
    return NextResponse.json(
      { error: "Failed to fetch individual match" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();

    const { id } = await context.params;

    const match = await IndividualMatch.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    )
      .populate("scorer", "username fullName")
      .populate("participants", "username fullName");

    if (!match) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      match,
      message: "Individual match updated successfully",
    });
  } catch (error) {
    console.error("Error updating individual match:", error);
    return NextResponse.json(
      { error: "Failed to update individual match" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await IndividualMatch.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Individual match deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting individual match:", error);
    return NextResponse.json(
      { error: "Failed to delete individual match" },
      { status: 500 }
    );
  }
}
