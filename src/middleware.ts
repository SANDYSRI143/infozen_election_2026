// ============================================================
// Middleware — Route Protection & Security
// ============================================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "antigravity-secret-key-change-in-production"
);

// Routes requiring student auth
const STUDENT_PROTECTED = ["/vote"];

// Routes requiring admin auth
const ADMIN_PROTECTED = [
  "/admin/dashboard",
  "/admin/candidates",
  "/admin/students",
  "/admin/results",
  "/admin/settings",
  "/admin/analytics",
  "/admin/audit-logs",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Check student protected routes
  if (STUDENT_PROTECTED.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get("ag_session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      // Invalid or expired token
      const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
      redirectResponse.cookies.delete("ag_session");
      return redirectResponse;
    }
  }

  // Check admin protected routes
  if (ADMIN_PROTECTED.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get("ag_admin_session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      // Invalid or expired token
      const redirectResponse = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
      redirectResponse.cookies.delete("ag_admin_session");
      return redirectResponse;
    }
  }

  // Redirect unauthorized non-admin users trying to access /admin paths
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !ADMIN_PROTECTED.some((route) => pathname.startsWith(route))
  ) {
    // Catch-all for any /admin/* paths not explicitly protected
    const token = request.cookies.get("ag_admin_session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/vote/:path*",
    "/admin/dashboard/:path*",
    "/admin/candidates/:path*",
    "/admin/students/:path*",
    "/admin/results/:path*",
    "/admin/settings/:path*",
    "/admin/analytics/:path*",
    "/admin/audit-logs/:path*",
  ],
};
