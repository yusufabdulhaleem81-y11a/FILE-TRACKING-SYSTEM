"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { ServiceError } from "@/lib/errors";
import { departmentSchema } from "@/lib/validation";
import type { ActionResult } from "@/types";
import type { z } from "zod";

export async function saveDepartmentAction(values: z.infer<typeof departmentSchema>): Promise<ActionResult> {
  const admin = await requireRole(["ADMIN"]);

  const parsed = departmentSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  const name = data.name.trim();

  try {
    const [nameTaken, codeTaken] = await Promise.all([
      prisma.department.findUnique({ where: { name } }),
      prisma.department.findUnique({ where: { code: data.code } }),
    ]);
    if (nameTaken && nameTaken.id !== data.id) throw new ServiceError("A department with this name already exists.");
    if (codeTaken && codeTaken.id !== data.id) throw new ServiceError("A department with this code already exists.");

    if (data.id) {
      await prisma.department.update({ where: { id: data.id }, data: { name, code: data.code } });
      await prisma.auditLog.create({
        data: { userId: admin.id, action: "DEPARTMENT_UPDATED", entityType: "Department", entityId: data.id, description: `Updated department ${name}` },
      });
    } else {
      const created = await prisma.department.create({ data: { name, code: data.code } });
      await prisma.auditLog.create({
        data: { userId: admin.id, action: "DEPARTMENT_CREATED", entityType: "Department", entityId: created.id, description: `Created department ${name}` },
      });
    }
    revalidatePath("/departments");
    revalidatePath("/users");
    revalidatePath("/send");
    return { success: data.id ? "Department updated." : "Department created." };
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message };
    throw e;
  }
}

export async function toggleDepartmentActiveAction(departmentId: string): Promise<ActionResult> {
  const admin = await requireRole(["ADMIN"]);

  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!dept) return { error: "Department not found." };

  if (dept.isActive) {
    const activeUsers = await prisma.user.count({ where: { departmentId, isActive: true } });
    if (activeUsers > 0) {
      return { error: `This department still has ${activeUsers} active user${activeUsers === 1 ? "" : "s"}. Reassign or deactivate them first.` };
    }
  }

  const isActive = !dept.isActive;
  await prisma.department.update({ where: { id: departmentId }, data: { isActive } });
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: isActive ? "DEPARTMENT_ACTIVATED" : "DEPARTMENT_DEACTIVATED",
      entityType: "Department", entityId: departmentId,
      description: `${isActive ? "Activated" : "Deactivated"} department ${dept.name}`,
    },
  });
  revalidatePath("/departments");
  revalidatePath("/send");
  return { success: isActive ? "Department activated." : "Department deactivated." };
}