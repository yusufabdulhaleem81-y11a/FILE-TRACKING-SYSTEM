"use client";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error); // server logs keep the details; users never see them
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          An unexpected error occurred while loading this page. Please try again.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground/70">Reference: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCcw className="size-4" /> Try again
      </Button>
    </div>
  );
}