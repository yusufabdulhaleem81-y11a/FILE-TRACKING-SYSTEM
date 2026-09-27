"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { userSchema } from "@/lib/validation";
import { saveUserAction } from "@/server/actions/user-actions";

export interface UserRow {
  id: string; name: string; email: string; role: "ADMIN" | "OFFICER" | "VIEWER";
  departmentId: string; isActive: boolean; createdAt: Date;
  department: { name: string };
}

export function UserDialog({ open, onOpenChange, user, departments }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null; // null = create mode
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", role: "OFFICER", departmentId: "", password: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        user
          ? { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId, password: "" }
          : { name: "", email: "", role: "OFFICER", departmentId: "", password: "" }
      );
    }
  }, [open, user, form]);

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof userSchema>) {
    const result = await saveUserAction(values);
    if (result.error) { toast.error(result.error); return; }
    toast.success(result.success ?? "Saved.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update the user's details, role, or department." : "Create a new account and assign a role and department."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full name *</FormLabel>
                <FormControl><Input placeholder="e.g. Sara Ahmed" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email address *</FormLabel>
                <FormControl><Input type="email" placeholder="name@company.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>{user ? "New password" : "Password *"}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={user ? "Leave blank to keep current password" : "Minimum 8 characters"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {user ? <UserPlus className="size-4" /> : <UserPlus className="size-4" />}
                {user ? "Save Changes" : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}