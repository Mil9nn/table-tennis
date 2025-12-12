import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { env } from "./env";

export const generateToken = (userId: string) => {
    return jwt.sign({ userId }, env.JWT_SECRET, {
        expiresIn: "7d",
    })
};

export const verifyToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        return decoded;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

export const setAuthCookie = (response: NextResponse, token: string) => {
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
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

