"use server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { ServiceError } from "@/lib/errors";
import { userSchema } from "@/lib/validation";
import type { ActionResult } from "@/types";
import type { z } from "zod";

export async function saveUserAction(values: z.infer<typeof userSchema>): Promise<ActionResult> {
  const admin = await requireRole(["ADMIN"]);

  const parsed = userSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  try {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken && emailTaken.id !== data.id)
      throw new ServiceError("A user with this email already exists.");

    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new ServiceError("Department not found.");

    if (data.id) {
      const existing = await prisma.user.findUnique({ where: { id: data.id } });
      if (!existing) throw new ServiceError("User not found.");

      if (existing.id === admin.id && data.role !== "ADMIN")
        throw new ServiceError("You cannot remove your own administrator role.");

      await prisma.user.update({
        where: { id: data.id },
        data: {
          name: data.name.trim(),
          email,
          role: data.role,
          departmentId: data.departmentId,
          ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
        },
      });
      await prisma.auditLog.create({
        data: {
          userId: admin.id, action: "USER_UPDATED", entityType: "User", entityId: data.id,
          description: `Updated user ${email} (role: ${data.role})`,
        },
      });
      revalidatePath("/users");
      return { success: "User updated." };
    }

    const created = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        role: data.role,
        departmentId: data.departmentId,
        passwordHash: await bcrypt.hash(data.password!, 10),
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.id, action: "USER_CREATED", entityType: "User", entityId: created.id,
        description: `Created user ${email} (role: ${data.role})`,
      },
    });
    revalidatePath("/users");
    return { success: "User created." };
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message };
    throw e;
  }
}

export async function toggleUserActiveAction(userId: string): Promise<ActionResult> {
  const admin = await requireRole(["ADMIN"]);
  if (userId === admin.id) return { error: "You cannot deactivate your own account." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  const isActive = !user.isActive;
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entityType: "User", entityId: userId,
      description: `${isActive ? "Activated" : "Deactivated"} user ${user.email}`,
    },
  });
  revalidatePath("/users");
  return { success: isActive ? "User activated." : "User deactivated." };
}