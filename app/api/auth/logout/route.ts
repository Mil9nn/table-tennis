import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit/middleware";

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/logout");
  if (rateLimitResponse) return rateLimitResponse;

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