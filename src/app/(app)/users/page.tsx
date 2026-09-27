import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { UsersTable } from "@/components/users/users-table";

export default async function UsersPage() {
  const admin = await requireRole(["ADMIN"]);

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      include: { department: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200, // hard cap; add server pagination when the org grows past this
    }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return <UsersTable users={users} departments={departments} currentUserId={admin.id} />;
}