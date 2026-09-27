export const ROLES = ["ADMIN", "OFFICER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator", OFFICER: "Officer", VIEWER: "Viewer",
};

export const FILE_STATUS_META = {
  REGISTERED: { label: "Registered", className: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_TRANSIT: { label: "In Transit", className: "bg-amber-50 text-amber-700 border-amber-200" },
  RECEIVED:   { label: "Received",   className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMPLETED:  { label: "Completed",  className: "bg-slate-100 text-slate-600 border-slate-200" },
} as const;

export const MOVEMENT_META = {
  CREATED:  { label: "Registered", className: "bg-blue-50 text-blue-700 border-blue-200" },
  SENT:     { label: "Sent",       className: "bg-amber-50 text-amber-700 border-amber-200" },
  RECEIVED: { label: "Received",   className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
} as const;
export const ROLE_META = {
  ADMIN: { label: "Administrator", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  OFFICER: { label: "Officer", className: "bg-blue-50 text-blue-700 border-blue-200" },
  VIEWER: { label: "Viewer", className: "bg-slate-100 text-slate-600 border-slate-200" },
} as const;