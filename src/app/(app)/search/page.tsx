import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { StatusBadge } from "@/components/files/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FileStatus, Prisma } from "@prisma/client";

const PAGE_SIZE = 10;

interface SearchParams { q?: string; status?: string; departmentId?: string; page?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  // Build ONE where-clause used for both the page of results AND the total
  // count — they can never disagree.
  const conditions: Prisma.FileWhereInput[] = [];
  if (q) {
    conditions.push({
      OR: [
        { trackingNumber: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (sp.status) conditions.push({ status: sp.status as FileStatus });
  if (sp.departmentId === "my") conditions.push({ currentDepartmentId: user.departmentId });
  else if (sp.departmentId) conditions.push({ currentDepartmentId: sp.departmentId });
  const where: Prisma.FileWhereInput = { AND: conditions };

  const [departments, files, total] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.file.findMany({
      where,
      include: { currentDepartment: { select: { name: true } }, createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.file.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sp.status) params.set("status", sp.status);
    if (sp.departmentId) params.set("departmentId", sp.departmentId);
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Files</CardTitle>
          <CardDescription>Search by tracking number or title, filter by status and department.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="space-y-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="FTS-2025-00001 or title…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={sp.status ?? ""}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                <option value="">All</option>
                <option value="REGISTERED">Registered</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="RECEIVED">Received</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <select id="departmentId" name="departmentId" defaultValue={sp.departmentId ?? ""}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm">
                <option value="">All</option>
                <option value="my">My department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex items-end"><Button type="submit">Search</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {files.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <SearchX className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No files match your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking No.</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead>
                    <TableHead>Current Location</TableHead><TableHead>Registered</TableHead><TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <Link href={`/files/${f.id}`} className="font-medium text-primary hover:underline">{f.trackingNumber}</Link>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate">{f.title}</TableCell>
                      <TableCell><StatusBadge status={f.status} /></TableCell>
                      <TableCell>{f.currentDepartment.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{format(f.createdAt, "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-muted-foreground">{f.createdBy.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + files.length} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                  <Link href={pageHref(page - 1)}><ChevronLeft className="size-4" /> Previous</Link>
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
                  <Link href={pageHref(page + 1)}>Next <ChevronRight className="size-4" /></Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}