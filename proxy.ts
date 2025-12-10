import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Routes that authenticated users shouldn't access
  const authRoutes = ["/auth/login", "/auth/register"];

  // Routes that require authentication
  const protectedRoutes = [
    "/profile",
    "/tournaments",
    "/matches",
    "/leaderboard",
    "/complete-profile",
  ];

  // If no token and trying to access protected route, redirect to login
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // If token exists and user tries to access auth pages, redirect to home
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
