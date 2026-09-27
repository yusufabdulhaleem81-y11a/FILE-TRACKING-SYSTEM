import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import { getStorage } from "@/lib/storage";
import type { Prisma, File, FileMovement } from "@prisma/client";
import type { SessionUser } from "@/types";

type Tx = Prisma.TransactionClient;

async function audit(tx: Tx, userId: string, action: string, entityType: string, entityId: string, description: string) {
  await tx.auditLog.create({ data: { userId, action, entityType, entityId, description } });
}

async function nextTrackingNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.file.count();
  for (let i = 1; i <= 10; i++) {
    const candidate = `FTS-${year}-${String(count + i).padStart(5, "0")}`;
    if (!(await tx.file.findUnique({ where: { trackingNumber: candidate } }))) return candidate;
  }
  throw new ServiceError("Unable to generate a tracking number. Please try again.");
}

export async function createFile(
  input: { title: string; description?: string },
  document: { buffer: Buffer; filename: string; mimeType: string } | null,
  user: SessionUser
): Promise<File> {
  if (user.role === "VIEWER") throw new ServiceError("Viewers cannot register files.");
  const storage = getStorage();

  let storageKey: string | undefined;
  if (document) {
    storageKey = `documents/${Date.now()}-${crypto.randomUUID()}`;
    await storage.put(storageKey, document.buffer, document.mimeType); // outside tx; cleaned up below on failure
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const trackingNumber = await nextTrackingNumber(tx);
      const file = await tx.file.create({
        data: {
          trackingNumber, title: input.title, description: input.description || null,
          storageKey, originalFilename: document?.filename ?? null,
          mimeType: document?.mimeType ?? null, sizeBytes: document?.buffer.length ?? null,
          createdById: user.id, currentDepartmentId: user.departmentId, status: "REGISTERED",
        },
      });
      await tx.fileMovement.create({
        data: {
          fileId: file.id, type: "CREATED", fromDepartmentId: user.departmentId,
          sentById: user.id, sentAt: new Date(), comment: "File registered",
        },
      });
      await audit(tx, user.id, "FILE_CREATED", "File", file.id, `Registered file ${trackingNumber}`);
      return file;
    });
  } catch (error) {
    if (storageKey) await storage.delete(storageKey).catch(() => {});
    throw error;
  }
}

export async function sendFile(
  input: { fileId: string; toDepartmentId: string; comment?: string },
  user: SessionUser
): Promise<void> {
  if (user.role === "VIEWER") throw new ServiceError("Viewers cannot send files.");

  await prisma.$transaction(async (tx) => {
    const file = await tx.file.findUnique({ where: { id: input.fileId } });
    if (!file) throw new ServiceError("File not found.");
    if (file.status === "IN_TRANSIT") throw new ServiceError("File is in transit and must be received before sending again.");
    if (file.status === "COMPLETED") throw new ServiceError("This file is completed and can no longer be sent.");
    if (user.role !== "ADMIN" && file.currentDepartmentId !== user.departmentId)
      throw new ServiceError("This file is not currently held by your department.");

    if (file.currentDepartmentId === input.toDepartmentId)
      throw new ServiceError("Destination department must be different from the current department.");

    const dest = await tx.department.findUnique({ where: { id: input.toDepartmentId } });
    if (!dest || !dest.isActive) throw new ServiceError("Destination department is invalid or inactive.");
    const from = await tx.department.findUnique({ where: { id: file.currentDepartmentId } });

    await tx.fileMovement.create({
      data: {
        fileId: file.id, type: "SENT",
        fromDepartmentId: file.currentDepartmentId, toDepartmentId: input.toDepartmentId,
        sentById: user.id, sentAt: new Date(), comment: input.comment || null,
      },
    });
    await tx.file.update({ where: { id: file.id }, data: { status: "IN_TRANSIT" } });

    const recipients = await tx.user.findMany({
      where: { departmentId: input.toDepartmentId, isActive: true },
    });
    if (recipients.length > 0) {
      await tx.notification.createMany({
        data: recipients.map((r) => ({
          userId: r.id, fileId: file.id, type: "FILE_SENT" as const,
          title: `Incoming file: ${file.trackingNumber}`,
          message: `"${file.title}" was sent from ${from?.name ?? "a department"} to ${dest.name}.`,
        })),
      });
    }
    await audit(tx, user.id, "FILE_SENT", "File", file.id,
      `Sent ${file.trackingNumber} from ${from?.name} to ${dest.name}`);
  });
}

export async function receiveFile(
  input: { fileId: string; comment?: string },
  user: SessionUser
): Promise<void> {
  if (user.role === "VIEWER") throw new ServiceError("Viewers cannot receive files.");

  await prisma.$transaction(async (tx) => {
    const movement = await tx.fileMovement.findFirst({
      where: { fileId: input.fileId, type: "SENT", receivedAt: null },
      orderBy: { sentAt: "desc" },
      include: { file: true, fromDepartment: true, toDepartment: true },
    });
    if (!movement) throw new ServiceError("There is no pending delivery for this file.");
    if (user.role !== "ADMIN" && movement.toDepartmentId !== user.departmentId)
      throw new ServiceError("This file was not sent to your department.");

    await tx.fileMovement.update({
      where: { id: movement.id },
      data: { receivedById: user.id, receivedAt: new Date() },
    });
    await tx.file.update({
      where: { id: movement.fileId },
      data: { status: "RECEIVED", currentDepartmentId: movement.toDepartmentId! },
    });

    const senderDeptUsers = await tx.user.findMany({
      where: { departmentId: movement.fromDepartmentId!, isActive: true },
    });
    if (senderDeptUsers.length > 0) {
      await tx.notification.createMany({
        data: senderDeptUsers.map((r) => ({
          userId: r.id, fileId: movement.fileId, type: "FILE_RECEIVED" as const,
          title: `Delivered: ${movement.file.trackingNumber}`,
          message: `"${movement.file.title}" was received by ${user.name} (${movement.toDepartment?.name}).`,
        })),
      });
    }
    await audit(tx, user.id, "FILE_RECEIVED", "File", movement.fileId,
      `Received ${movement.file.trackingNumber} in ${movement.toDepartment?.name}`);
  });
}

/** Access rule reused by the details page and the download route (IDOR defense). */
export function userCanAccessFile(
  user: SessionUser,
  file: Pick<File, "createdById" | "currentDepartmentId">,
  movements: Pick<FileMovement, "fromDepartmentId" | "toDepartmentId">[]
): boolean {
  if (user.role === "ADMIN") return true;
  if (file.createdById === user.id) return true;
  if (file.currentDepartmentId === user.departmentId) return true;
  return movements.some(
    (m) => m.fromDepartmentId === user.departmentId || m.toDepartmentId === user.departmentId
  );
}