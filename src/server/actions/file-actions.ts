"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import { ServiceError } from "@/lib/errors";
import { createFileSchema, sendFileSchema, receiveFileSchema, MAX_FILE_SIZE, ACCEPTED_DOC_TYPES } from "@/lib/validation";
import { createFile, sendFile, receiveFile } from "@/server/services/file-service";
import type { ActionState, ActionResult } from "@/types";

export async function createFileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createFileSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const raw = formData.get("document");
  let document: { buffer: Buffer; filename: string; mimeType: string } | null = null;
  if (raw instanceof File && raw.size > 0) {
    if (raw.size > MAX_FILE_SIZE) return { error: "Document exceeds the 20 MB limit." };
    if (!ACCEPTED_DOC_TYPES.includes(raw.type)) return { error: "Unsupported file type." };
    document = { buffer: Buffer.from(await raw.arrayBuffer()), filename: raw.name, mimeType: raw.type };
  }

  let fileId: string;
  try {
    const file = await createFile(parsed.data, document, user);
    fileId = file.id;
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message };
    throw e;
  }
  revalidatePath("/");
  redirect(`/files/${fileId}`);
}

export async function sendFileAction(values: { fileId: string; toDepartmentId: string; comment?: string }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = sendFileSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    await sendFile(parsed.data, user);
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message };
    throw e;
  }
  revalidatePath("/"); revalidatePath("/receive"); revalidatePath("/send"); revalidatePath("/search");
  return { success: "File sent successfully." };
}

export async function receiveFileAction(fileId: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = receiveFileSchema.safeParse({ fileId });
  if (!parsed.success) return { error: "Invalid file." };
  try {
    await receiveFile(parsed.data, user);
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message };
    throw e;
  }
  revalidatePath("/"); revalidatePath("/receive"); revalidatePath("/send"); revalidatePath("/search");
  return { success: "File received. Current location updated." };
}