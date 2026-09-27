import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (!isLoggedIn) return Response.json({ error: "Unauthorized" }, { status: 401 });
    return;
  }
  if (!isLoggedIn) return Response.redirect(new URL("/login", req.url));
  if (pathname === "/login") return Response.redirect(new URL("/", req.url));
});

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};