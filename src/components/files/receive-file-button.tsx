"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { receiveFileAction } from "@/server/actions/file-actions";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

export function ReceiveFileButton({ fileId }: { fileId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleReceive() {
    startTransition(async () => {
      const result = await receiveFileAction(fileId);
      if (result.error) { toast.error(result.error); return; }
      toast.success(result.success ?? "File received.");
      setDone(true);
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant={done ? "secondary" : "default"} disabled={isPending || done} onClick={handleReceive}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
      {done ? "Received" : "Receive"}
    </Button>
  );
}