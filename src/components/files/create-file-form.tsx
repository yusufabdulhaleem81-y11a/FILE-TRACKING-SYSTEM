"use client";
import { useActionState } from "react";
import { createFileAction } from "@/server/actions/file-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FilePlus2 } from "lucide-react";

export function CreateFileForm() {
  const [state, formAction, isPending] = useActionState(createFileAction, undefined);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FilePlus2 className="size-5 text-primary" /> Register a New File</CardTitle>
        <CardDescription>The file will be registered under your department and assigned a tracking number.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>}
          <div className="space-y-2">
            <Label htmlFor="title">File title *</Label>
            <Input id="title" name="title" placeholder="e.g. Q4 Budget Proposal" required minLength={3} maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} maxLength={2000} placeholder="Optional summary of the file's purpose…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document">Document (optional, max 20 MB)</Label>
            <Input id="document" name="document" type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" />
            <p className="text-xs text-muted-foreground">PDF, Office documents, images, or plain text.</p>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />} Register File
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}