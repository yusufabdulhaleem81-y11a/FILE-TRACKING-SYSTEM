"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CheckCircle2, Pencil, Plus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toggleDepartmentActiveAction } from "@/server/actions/departments-actions";
import { DepartmentDialog } from "./department-dialog";

export interface DepartmentRow {
  id: string; name: string; code: string; isActive: boolean;
  _count: { users: number; currentFiles: number };
}

function ActiveToggle({ dept }: { dept: DepartmentRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await toggleDepartmentActiveAction(dept.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success(res.success);
      router.refresh();
    });
  }

  if (dept.isActive) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending} title="Deactivate department">
            <XCircle className="size-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {dept.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed as a send destination. This is blocked if active users are still assigned to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={run}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Button variant="ghost" size="icon" disabled={isPending} title="Activate department" onClick={run}>
      <CheckCircle2 className="size-4 text-emerald-600" />
    </Button>
  );
}

export function DepartmentsManager({ departments }: { departments: DepartmentRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRow | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" /> Departments</CardTitle>
          <CardDescription>Organizational units that send and receive files.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="size-4" /> New Department
            </Button>
          </div>

          {departments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No departments yet. Create the first one.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead><TableHead>Code</TableHead>
                    <TableHead>Users</TableHead><TableHead>Files Held</TableHead>
                    <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((d) => (
                    <TableRow key={d.id} className={!d.isActive ? "opacity-60" : undefined}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">{d.code}</span>
                      </TableCell>
                      <TableCell>{d._count.users}</TableCell>
                      <TableCell>{d._count.currentFiles}</TableCell>
                      <TableCell>
                        {d.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <span className="size-1.5 rounded-full bg-current" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                            <span className="size-1.5 rounded-full bg-current" /> Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Edit department"
                            onClick={() => { setEditing(d); setDialogOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <ActiveToggle dept={d} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DepartmentDialog open={dialogOpen} onOpenChange={setDialogOpen} department={editing} />
    </div>
  );
}