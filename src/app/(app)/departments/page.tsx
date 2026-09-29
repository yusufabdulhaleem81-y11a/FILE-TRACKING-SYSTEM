import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { DepartmentsManager } from "@/components/departments/departments-manager";

export default async function DepartmentsPage() {
  await requireRole(["ADMIN"]);

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, currentFiles: true } } },
  });

  return <DepartmentsManager departments={departments} />;
}
