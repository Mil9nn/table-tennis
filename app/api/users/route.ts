import { NextResponse } from "next/server";
import { User } from "@/models/User";

export async function GET() {
  try {
    const users = await User.find().select("username fullName _id");
    return NextResponse.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}
