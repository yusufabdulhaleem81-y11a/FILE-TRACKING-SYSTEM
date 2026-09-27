import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role; departmentId: string; departmentName: string | null }
      & DefaultSession["user"];
  }
  interface User {
    id?: string; role?: Role; departmentId?: string; departmentName?: string | null;
  }
}