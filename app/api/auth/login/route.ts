
import { User } from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {

    const { email, password } = await request.json();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const hashedPassword = user.password;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Successful login
    return NextResponse.json({ message: "Login successful", user: { email: user.email, name: user.username}}, { status: 200 });
}