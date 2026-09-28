"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderSync, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, adminNav, type NavItem } from "./nav";
import { logoutAction } from "@/server/actions/auth-actions";
import type { SessionUser } from "@/types";

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href} onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/15 text-white shadow-[inset_2px_0_0_0_var(--color-primary)]"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" /> {item.label}
    </Link>
  );
}

export function SidebarContent({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const visible = (items: NavItem[]) => items.filter((i) => !i.roles || i.roles.includes(user.role));

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <FolderSync className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">File Tracking</p>
          <p className="text-[11px] text-sidebar-foreground/70">System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">Main</p>
        {visible(mainNav).map((i) => <NavLink key={i.href} item={i} pathname={pathname} onNavigate={onNavigate} />)}
        {user.role === "ADMIN" && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">Administration</p>
            {visible(adminNav).map((i) => <NavLink key={i.href} item={i} pathname={pathname} onNavigate={onNavigate} />)}
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-blue-300">
            {user.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/70">{user.departmentName}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" aria-label="Sign out"
              className="rounded-md p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}