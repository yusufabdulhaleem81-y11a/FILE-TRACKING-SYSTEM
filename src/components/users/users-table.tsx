"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  useReactTable, type ColumnDef,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Pencil, Search, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ROLE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toggleUserActiveAction } from "@/server/actions/user-actions";
import { UserDialog, type UserRow } from "./user-dialog";

function StatusToggle({ user, currentUserId }: { user: UserRow; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isSelf = user.id === currentUserId;

  function run() {
    startTransition(async () => {
      const res = await toggleUserActiveAction(user.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success(res.success);
      router.refresh();
    });
  }

  if (user.isActive) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isSelf || isPending}
            title={isSelf ? "You cannot deactivate your own account" : "Deactivate user"}>
            <UserX className="size-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be unable to sign in. Their files, movement history, and audit records are preserved.
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
    <Button variant="ghost" size="icon" disabled={isPending} title="Activate user" onClick={run}>
      <UserCheck className="size-4 text-emerald-600" />
    </Button>
  );
}

export function UsersTable({ users, departments, currentUserId }: {
  users: UserRow[]; departments: { id: string; name: string }[]; currentUserId: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.name}
              {row.original.id === currentUserId && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", ROLE_META[row.original.role].className)}>
          {ROLE_META[row.original.role].label}
        </span>
      ),
    },
    { id: "department", header: "Department", cell: ({ row }) => row.original.department.name },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => row.original.isActive ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          <span className="size-1.5 rounded-full bg-current" /> Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          <span className="size-1.5 rounded-full bg-current" /> Inactive
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{format(row.original.createdAt, "MMM d, yyyy")}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" title="Edit user"
            onClick={() => { setEditing(row.original); setDialogOpen(true); }}>
            <Pencil className="size-4" />
          </Button>
          <StatusToggle user={row.original} currentUserId={currentUserId} />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value).toLowerCase();
      const u = row.original;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="size-5 text-primary" /> User Management</CardTitle>
          <CardDescription>Manage accounts, roles, and department assignments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Filter by name, email, department…" value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)} className="pl-8" />
            </div>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <UserPlus className="size-4" /> Add User
            </Button>
          </div>

          {users.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No users yet. Add your first user.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((header) => (
                        <TableHead key={header.id} className={header.id === "actions" ? "text-right" : undefined}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                        No users match your filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {users.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} user{table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                </span>
                <Button variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editing} departments={departments} />
    </div>
  );
}