import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
    await connectDB();

    const { username, email, password } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Creae new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // Token generation with JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    // Set token in HTTP-only cookie
    const response = NextResponse.json({ message: "User registered successfully" }, { status: 201 });
    response.cookies.set("token", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 });
    return response;
}