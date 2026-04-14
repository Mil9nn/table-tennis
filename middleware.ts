import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Routes that authenticated users shouldn't access
  const authRoutes = ["/auth/login", "/auth/register"];

  // Routes that require authentication (fully protected)
  const protectedRoutes = [
    "/profile",
    "/complete-profile",
  ];

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    // Check fully protected routes
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    
    // Protected sub-routes that require authentication
    // These are public pages but certain actions require auth
    if (
      pathname.startsWith("/matches/") && pathname.includes("/score") || // Scoring requires auth
      pathname === "/teams/create" || // Creating teams requires auth
      (pathname.startsWith("/teams/") && pathname.includes("/edit")) || // Editing teams requires auth
      (pathname.startsWith("/teams/") && pathname.includes("/assign")) // Assigning players requires auth
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
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
