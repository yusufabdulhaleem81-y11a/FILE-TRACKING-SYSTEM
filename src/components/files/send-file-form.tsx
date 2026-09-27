"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { sendFileSchema } from "@/lib/validation";
import { sendFileAction } from "@/server/actions/file-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { z } from "zod";

type SendValues = z.infer<typeof sendFileSchema>;

interface Props {
  files: { id: string; trackingNumber: string; title: string; currentDepartment: { name: string } }[];
  departments: { id: string; name: string }[];
  currentDeptId: string;
}

export function SendFileForm({ files, departments, currentDeptId }: Props) {
  const router = useRouter();
  const form = useForm<SendValues>({
    resolver: zodResolver(sendFileSchema),
    defaultValues: { fileId: "", toDepartmentId: "", comment: "" },
  });
  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: SendValues) {
    const result = await sendFileAction(values);
    if (result.error) { toast.error(result.error); return; }
    toast.success(result.success ?? "File sent.");
    form.reset();
    router.refresh();
  }

  if (files.length === 0) {
    return (
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Send File</CardTitle>
          <CardDescription>There are no files in your department available to send right now.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Send className="size-5 text-primary" /> Send File</CardTitle>
        <CardDescription>Dispatch a file to another department. The movement is recorded permanently.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="fileId" render={({ field }) => (
              <FormItem>
                <FormLabel>File *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select a file" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {files.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.trackingNumber} — {f.title} <span className="text-muted-foreground">({f.currentDepartment.name})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="toDepartmentId" render={({ field }) => (
              <FormItem>
                <FormLabel>Destination department *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select destination" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {departments.filter((d) => d.id !== currentDeptId).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="comment" render={({ field }) => (
              <FormItem>
                <FormLabel>Comment / reference</FormLabel>
                <FormControl><Textarea rows={3} placeholder="Optional note for the receiving department…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />} Send File
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}