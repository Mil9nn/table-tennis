import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const generateToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
    })
};

export const verifyToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
        return decoded;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

export const setAuthCookie = (response: NextResponse, token: string) => {
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return response;
}

export function getTokenFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookiesArr = cookieHeader.split(";").map((c) => c.trim());
  const tokenCookie = cookiesArr.find((c) => c.startsWith("token="));
  return tokenCookie ? tokenCookie.split("=")[1] : null;
}

