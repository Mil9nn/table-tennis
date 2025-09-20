import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const match = await IndividualMatch.findById(params.id)
      .populate("scorer", "username fullName")
      .populate("participants", "username fullName");

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
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const match = await IndividualMatch.findByIdAndUpdate(
      params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await IndividualMatch.findByIdAndDelete(params.id);

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
