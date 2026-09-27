import { format } from "date-fns";
import { FilePlus2, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileMovement } from "@prisma/client";

type MovementWithRelations = FileMovement & {
  fromDepartment: { name: string } | null;
  toDepartment: { name: string } | null;
  sentBy: { name: string } | null;
  receivedBy: { name: string } | null;
};

const ICONS = {
  CREATED: { icon: FilePlus2, className: "bg-blue-100 text-blue-700" },
  SENT: { icon: Send, className: "bg-amber-100 text-amber-700" },
  RECEIVED: { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
} as const;

export function MovementTimeline({ movements }: { movements: MovementWithRelations[] }) {
  return (
    <ol className="relative space-y-8 border-l border-border pl-6">
      {movements.map((m) => {
        const { icon: Icon, className } = ICONS[m.type];
        const route =
          m.fromDepartment && m.toDepartment
            ? `${m.fromDepartment.name} → ${m.toDepartment.name}`
            : (m.fromDepartment?.name ?? "");
        return (
          <li key={m.id} className="relative">
            <span className={cn("absolute -left-[37px] flex size-8 items-center justify-center rounded-full ring-4 ring-card", className)}>
              <Icon className="size-4" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold">
                {m.type === "CREATED" && "File Registered"}
                {m.type === "SENT" && "File Sent"}
                {m.type === "RECEIVED" && "File Received"}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(m.sentAt ?? m.createdAt, "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {route && <span className="font-medium text-foreground">{route}</span>}
              {m.type === "CREATED" && ` by ${m.sentBy?.name ?? "Unknown"}`}
              {m.type === "SENT" && ` — sent by ${m.sentBy?.name ?? "Unknown"}`}
              {m.type === "RECEIVED" && ` — received by ${m.receivedBy?.name ?? "Unknown"}`}
            </p>
            {m.comment && <p className="mt-1 rounded-md bg-muted px-3 py-1.5 text-sm italic text-muted-foreground">“{m.comment}”</p>}
          </li>
        );
      })}
    </ol>
  );
}