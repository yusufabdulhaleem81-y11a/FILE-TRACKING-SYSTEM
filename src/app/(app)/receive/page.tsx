import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReceiveFileButton } from "@/components/files/receive-file-button";
import { MOVEMENT_META } from "@/lib/constants";
import { Inbox } from "lucide-react";

export default async function ReceivePage() {
  const user = await requireRole(["ADMIN", "OFFICER"]);

  const pending = await prisma.fileMovement.findMany({
    where: { type: "SENT", receivedAt: null, ...(user.role === "ADMIN" ? {} : { toDepartmentId: user.departmentId }) },
    orderBy: { sentAt: "desc" },
    include: {
      file: { select: { id: true, trackingNumber: true, title: true } },
      fromDepartment: { select: { name: true } },
      toDepartment: { select: { name: true } },
      sentBy: { select: { name: true } },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Inbox className="size-5 text-primary" /> Pending Deliveries</CardTitle>
        <CardDescription>Files sent to {user.role === "ADMIN" ? "any department" : user.departmentName} awaiting confirmation of receipt.</CardDescription>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No pending deliveries. You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking No.</TableHead><TableHead>Title</TableHead><TableHead>From</TableHead>
                  <TableHead>Sent By</TableHead><TableHead>Sent At</TableHead><TableHead>Comment</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link href={`/files/${m.file.id}`} className="font-medium text-primary hover:underline">{m.file.trackingNumber}</Link>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{m.file.title}</TableCell>
                    <TableCell>{m.fromDepartment?.name}</TableCell>
                    <TableCell>{m.sentBy?.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {m.sentAt ? format(m.sentAt, "MMM d, yyyy h:mm a") : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{m.comment ?? "—"}</TableCell>
                    <TableCell className="text-right"><ReceiveFileButton fileId={m.file.id} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Files with status <Badge variant="outline" className={MOVEMENT_META.SENT.className}>In Transit</Badge> must be received before they can be sent again.
        </p>
      </CardContent>
    </Card>
  );
}