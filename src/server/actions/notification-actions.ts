"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";

export async function markNotificationReadAction(id: string): Promise<void> {
  const user = await requireUser();
  // IDOR defense: userId in the WHERE clause means a user can only
  // ever update rows they own.
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/", "layout");
}