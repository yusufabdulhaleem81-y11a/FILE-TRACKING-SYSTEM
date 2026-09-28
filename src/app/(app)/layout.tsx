// import { requireUser } from "@/lib/auth-guard";
// import { prisma } from "@/lib/prisma";
// import { AppShell } from "@/components/layout/app-shell";
// import type { NotificationItem } from "@/types";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import type { NotificationItem } from "@/types";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  const notifications: NotificationItem[] = rows.map((n) => ({
    id: n.id, type: n.type, title: n.title, message: n.message,
    isRead: n.isRead, fileId: n.fileId, createdAt: n.createdAt.toISOString(),
  }));

  return (
    <AppShell user={user} notifications={notifications} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}