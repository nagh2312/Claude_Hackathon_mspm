import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.next();

  const path = req.nextUrl.pathname;
  const token = await getToken({ req, secret });

  if (path.startsWith("/login")) {
    if (token) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!token && (path.startsWith("/home") || path.startsWith("/settings") || path.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/settings/:path*", "/onboarding", "/login"],
};
