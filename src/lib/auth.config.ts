import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // providers live in auth.ts (Node-only: bcrypt + Prisma)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as never;
        session.user.departmentId = token.departmentId as string;
        session.user.departmentName = (token.departmentName as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
// session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours