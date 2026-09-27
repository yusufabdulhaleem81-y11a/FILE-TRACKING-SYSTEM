"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { departmentSchema } from "@/lib/validation";
import { saveDepartmentAction } from "@/server/actions/departments-actions";
import type { DepartmentRow } from "./departments-manager";

export function DepartmentDialog({ open, onOpenChange, department }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentRow | null;
}) {
  const router = useRouter();
  const form = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", code: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(department ? { id: department.id, name: department.name, code: department.code } : { name: "", code: "" });
    }
  }, [open, department, form]);

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof departmentSchema>) {
    const result = await saveDepartmentAction(values);
    if (result.error) { toast.error(result.error); return; }
    toast.success(result.success ?? "Saved.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{department ? "Edit Department" : "New Department"}</DialogTitle>
          <DialogDescription>The code appears as a short identifier for the department.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Department name *</FormLabel>
                <FormControl><Input placeholder="e.g. Procurement" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel>Code *</FormLabel>
                <FormControl><Input placeholder="e.g. PRC" className="font-mono uppercase" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
                {department ? "Save Changes" : "Create Department"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}