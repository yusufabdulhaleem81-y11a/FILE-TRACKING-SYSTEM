import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { SendFileForm } from "@/components/files/send-file-form";

export default async function SendPage() {
  const user = await requireRole(["ADMIN", "OFFICER"]);

  const [files, departments] = await Promise.all([
    prisma.file.findMany({
      where: {
        status: { in: ["REGISTERED", "RECEIVED"] },
        ...(user.role === "ADMIN" ? {} : { currentDepartmentId: user.departmentId }),
      },
      orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, trackingNumber: true, title: true, currentDepartment: { select: { name: true } } },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return <SendFileForm files={files} departments={departments} currentDeptId={user.departmentId} />;
}