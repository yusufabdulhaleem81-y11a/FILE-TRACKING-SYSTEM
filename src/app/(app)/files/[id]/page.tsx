import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { userCanAccessFile } from "@/server/services/file-service";
import { StatusBadge } from "@/components/files/status-badge";
import { MovementTimeline } from "@/components/files/movement-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";

export default async function FileDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      currentDepartment: { select: { name: true } },
      movements: {
        orderBy: { createdAt: "asc" },
        include: {
          fromDepartment: { select: { name: true } },
          toDepartment: { select: { name: true } },
          sentBy: { select: { name: true } },
          receivedBy: { select: { name: true } },
        },
      },
    },
  });
  if (!file) notFound();
  if (!userCanAccessFile(user, file, file.movements)) notFound(); // don't reveal existence

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/"><ArrowLeft className="size-4" /> Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-semibold text-primary">{file.trackingNumber}</span>
              <StatusBadge status={file.status} />
            </div>
            <CardTitle className="text-xl">{file.title}</CardTitle>
            {file.description && <CardDescription className="max-w-2xl">{file.description}</CardDescription>}
          </div>
          {file.storageKey && (
            <Button asChild variant="outline">
              <a href={`/api/files/${file.id}/download`}><Download className="size-4" /> Download Document</a>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><dt className="text-muted-foreground">Current location</dt><dd className="mt-1 font-medium">{file.currentDepartment.name}</dd></div>
            <div><dt className="text-muted-foreground">Registered by</dt><dd className="mt-1 font-medium">{file.createdBy.name}</dd></div>
            <div><dt className="text-muted-foreground">Registered on</dt><dd className="mt-1 font-medium">{format(file.createdAt, "MMM d, yyyy")}</dd></div>
            <div>
              <dt className="text-muted-foreground">Document</dt>
              <dd className="mt-1 font-medium">
                {file.originalFilename ? (
                  <span className="block truncate" title={file.originalFilename}>{file.originalFilename}</span>
                ) : <span className="text-muted-foreground">No document attached</span>}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
          <CardDescription>Complete, permanent movement record for this file.</CardDescription>
        </CardHeader>
        <CardContent>
          <MovementTimeline movements={file.movements} />
        </CardContent>
      </Card>
    </div>
  );
}