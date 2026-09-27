import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MovementTrendChart, FilesByDepartmentChart, StatusDistributionChart } from "@/components/analytics/charts";

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Registered", IN_TRANSIT: "In Transit", RECEIVED: "Received", COMPLETED: "Completed",
};
const STATUS_COLORS: Record<string, string> = {
  REGISTERED: "#3b82f6", IN_TRANSIT: "#f59e0b", RECEIVED: "#10b981", COMPLETED: "#94a3b8",
};

export default async function AnalyticsPage() {
  await requireUser();

  // 14-day window starting at midnight, 13 days ago
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13);

  const [deptGroups, statusGroups, movements, departments] = await Promise.all([
    prisma.file.groupBy({ by: ["currentDepartmentId"], _count: { _all: true } }),
    prisma.file.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.fileMovement.findMany({
      where: { createdAt: { gte: since } },
      select: { type: true, sentAt: true, receivedAt: true, createdAt: true },
    }),
    prisma.department.findMany({ select: { id: true, name: true } }),
  ]);

  // Files by current department
  const deptName = new Map(departments.map((d) => [d.id, d.name]));
  const deptData = deptGroups
    .map((g) => ({ name: deptName.get(g.currentDepartmentId) ?? "Unknown", count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  // Status distribution
  const statusData = statusGroups.map((g) => ({
    name: STATUS_LABELS[g.status] ?? g.status,
    value: g._count._all,
    color: STATUS_COLORS[g.status] ?? "#64748b",
  }));

  // Bucket movements into 14 daily buckets.
  // CREATED rows use sentAt; SENT rows contribute a "sent" event (sentAt)
  // and, once received, a "received" event (receivedAt) — same row, two events.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    return { key: d.toISOString().slice(0, 10), label: format(d, "MMM d"), registered: 0, sent: 0, received: 0 };
  });
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const m of movements) {
    if (m.type === "CREATED") {
      const day = byKey.get((m.sentAt ?? m.createdAt).toISOString().slice(0, 10));
      if (day) day.registered++;
    }
    if (m.type === "SENT") {
      const sentDay = m.sentAt ? byKey.get(m.sentAt.toISOString().slice(0, 10)) : undefined;
      if (sentDay) sentDay.sent++;
      const recvDay = m.receivedAt ? byKey.get(m.receivedAt.toISOString().slice(0, 10)) : undefined;
      if (recvDay) recvDay.received++;
    }
  }
  const trendData = days.map(({ key: _key, ...rest }) => rest);

  const total = statusData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Movement Trend — Last 14 Days</CardTitle>
          <CardDescription>Files registered, sent, and received per day.</CardDescription>
        </CardHeader>
        <CardContent>
          <MovementTrendChart data={trendData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Files by Department</CardTitle>
            <CardDescription>Current location of all registered files.</CardDescription>
          </CardHeader>
          <CardContent>
            <FilesByDepartmentChart data={deptData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>{total} files across all statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart data={statusData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}