import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await connectDB();
    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}