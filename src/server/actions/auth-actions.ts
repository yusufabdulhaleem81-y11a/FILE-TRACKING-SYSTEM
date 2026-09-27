"use server";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import type { ActionState } from "@/types";

// In-memory limiter: per-server-process only. Swap for Redis/Upstash in multi-instance production.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(key: string): boolean {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || rec.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  rec.count += 1;
  return rec.count <= MAX_LOGIN_ATTEMPTS;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Please enter a valid email and password." };

  if (!checkLoginRateLimit(parsed.data.email.toLowerCase())) {
    return { error: "Too many sign-in attempts. Please try again in 15 minutes." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error; // NEXT_REDIRECT is control flow — must propagate
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}