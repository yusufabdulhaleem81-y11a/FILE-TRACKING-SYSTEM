import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MOVEMENT_META } from "@/lib/constants";
import { Files, ArrowLeftRight, Building2, Inbox } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();

  const [totalFiles, inTransit, inMyDepartment, awaitingMyReceipt, recentMovements] = await Promise.all([
    prisma.file.count(),
    prisma.file.count({ where: { status: "IN_TRANSIT" } }),
    prisma.file.count({ where: { currentDepartmentId: user.departmentId } }),
    prisma.fileMovement.count({ where: { type: "SENT", receivedAt: null, toDepartmentId: user.departmentId } }),
    prisma.fileMovement.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      include: {
        file: { select: { id: true, trackingNumber: true, title: true } },
        fromDepartment: { select: { name: true } },
        toDepartment: { select: { name: true } },
        sentBy: { select: { name: true } },
        receivedBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Files" value={totalFiles} icon={Files} iconClass="bg-blue-100 text-blue-700" href="/search" />
        <StatCard title="In Transit" value={inTransit} icon={ArrowLeftRight} iconClass="bg-amber-100 text-amber-700" href="/search?status=IN_TRANSIT" />
        <StatCard title="In My Department" value={inMyDepartment} icon={Building2} iconClass="bg-indigo-100 text-indigo-700" href="/search?departmentId=my" />
        <StatCard title="Awaiting My Receipt" value={awaitingMyReceipt} icon={Inbox} iconClass="bg-emerald-100 text-emerald-700" href="/receive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest file movements across the organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMovements.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No activity yet. Register a file to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Tracking No.</TableHead><TableHead>Action</TableHead>
                    <TableHead>Route</TableHead><TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{format(m.createdAt, "MMM d, h:mm a")}</TableCell>
                      <TableCell>
                        <Link href={`/files/${m.file.id}`} className="font-medium text-primary hover:underline">{m.file.trackingNumber}</Link>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={MOVEMENT_META[m.type].className}>{MOVEMENT_META[m.type].label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.fromDepartment?.name}{m.toDepartment ? ` → ${m.toDepartment.name}` : ""}
                      </TableCell>
                      <TableCell>{(m.receivedBy ?? m.sentBy)?.name ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}