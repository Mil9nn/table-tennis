import { NextResponse } from "next/server";
import { generateToken, setAuthCookie } from "@/lib/jwt";
import { toAuthUserPayload } from "./serialize-user";
import type { AuthUserPayload } from "./types";

type UserLike = Parameters<typeof toAuthUserPayload>[0];

export function createAuthenticatedResponse(
  user: UserLike,
  message: string,
  status = 200
): NextResponse {
  const token = generateToken(String(user._id));
  const response = NextResponse.json(
    {
      message,
      user: toAuthUserPayload(user),
    },
    { status }
  );
  setAuthCookie(response, token);
  return response;
}

export type { AuthUserPayload };
