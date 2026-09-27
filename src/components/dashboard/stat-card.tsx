import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({ title, value, icon: Icon, iconClass, href }: {
  title: string; value: number; icon: LucideIcon; iconClass: string; href?: string;
}) {
  const body = (
    <div className="flex items-center justify-between rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      </div>
      <div className={cn("flex size-11 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="size-5" />
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}