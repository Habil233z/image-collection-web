import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Browsing (home, image pages) is open to guests. Only pages that need a
// user account are gated here.
export function middleware(request: NextRequest) {
  const token = request.cookies.get("image-web-auth_token");

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/liked/:path*", "/image/:id/edit"],
};
