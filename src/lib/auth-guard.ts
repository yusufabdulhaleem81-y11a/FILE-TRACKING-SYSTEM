import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/constants";
import type { SessionUser } from "@/types";

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user as SessionUser;
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}