import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({ message: "Connected to database" });
    } catch (error) {
        return NextResponse.json({ message: "Failed to connect to database", error }, { status: 500 });
    }
}