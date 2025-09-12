import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({ message: "Database connected" }, { status: 200 });
    } catch (error) {
        console.error("Database connection error:", error);
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
}