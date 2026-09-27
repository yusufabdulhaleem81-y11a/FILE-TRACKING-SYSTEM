import { FILE_STATUS_META } from "@/lib/constants";
import type { FileStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: FileStatus }) {
  const meta = FILE_STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}