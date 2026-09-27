import type { Role } from "@/lib/constants";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  departmentId: string;
  departmentName: string | null;
}

export type ActionState = { error?: string } | undefined;
export type ActionResult = { success?: string; error?: string };

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  fileId: string | null;
  createdAt: string;
}