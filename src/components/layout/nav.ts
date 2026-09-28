import {
  LayoutDashboard,
  Search,
  BarChart3,
  Send,
  Inbox,
  Users,
  Building2,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/constants";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

export const mainNav: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["ADMIN", "VIEWER", "OFFICER"],
  },
  {
    href: "/send",
    label: "Send File",
    icon: Send,
    roles: ["ADMIN", "OFFICER"],
  },
  {
    href: "/receive",
    label: "Receive File",
    icon: Inbox,
    roles: ["ADMIN", "OFFICER"],
  },
  {
    href: "/files/new",
    label: "Register File",
    icon: Inbox,
    roles: ["ADMIN", "OFFICER"],
  },
];

export const adminNav: NavItem[] = [
  {
    href: "/users",
    label: "Users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    href: "/departments",
    label: "Departments",
    icon: Building2,
    roles: ["ADMIN"],
  },
];

export function pageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/": "Dashboard",
    "/search": "Search Files",
    "/analytics": "Analytics",
    "/send": "Send File",
    "/receive": "Receive File",
    "/users": "User Management",
    "/departments": "Departments",
    "/files/new": "Register a File",
  };

  if (pathname.startsWith("/files/")) {
    return "File Details";
  }

  return map[pathname] ?? "File Tracking System";
}