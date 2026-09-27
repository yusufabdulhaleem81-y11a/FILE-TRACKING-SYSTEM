import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { userCanAccessFile } from "@/server/services/file-service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const file = await prisma.file.findUnique({ where: { id }, include: { movements: true } });
  if (!file || !file.storageKey) return new Response("Not found", { status: 404 });

  if (!userCanAccessFile(session.user as never, file, file.movements))
    return new Response("Forbidden", { status: 403 });

  try {
    const buffer = await getStorage().get(file.storageKey);
    const safeName = (file.originalFilename ?? `${file.trackingNumber}.bin`).replace(/["\\]/g, "");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Document unavailable", { status: 500 });
  }
}