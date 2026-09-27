import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <FileQuestion className="size-12 text-muted-foreground/40" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Button asChild><Link href="/">Back to Dashboard</Link></Button>
    </div>
  );
}