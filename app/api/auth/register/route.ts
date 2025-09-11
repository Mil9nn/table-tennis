import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User } from "@/models/user.model";
import { generateToken, setAuthCookie } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { username, fullName, email, password } = await request.json();

    if (!username || !fullName || !email || !password) {
      return new Response(
        JSON.stringify({ messsage: "All fields are required." }),
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "User already exists." }), {
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = generateToken(newUser._id.toString());

    const response = NextResponse.json(
      {
        message: "User registered successfully.",
        user: {
          _id: newUser._id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
        },
      },
      { status: 201 }
    );

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}