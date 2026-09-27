"use client";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
  fontSize: 12,
} as const;

const axisTick = { fontSize: 11, fill: "#64748b" } as const;

export function MovementTrendChart({ data }: {
  data: { label: string; registered: number; sent: number; received: number }[];
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gRegistered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gReceived" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="registered" name="Registered" stroke="#3b82f6" strokeWidth={2} fill="url(#gRegistered)" />
          <Area type="monotone" dataKey="sent" name="Sent" stroke="#f59e0b" strokeWidth={2} fill="url(#gSent)" />
          <Area type="monotone" dataKey="received" name="Received" stroke="#10b981" strokeWidth={2} fill="url(#gReceived)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FilesByDepartmentChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No files registered yet.</p>;
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(29,78,216,0.04)" }} />
          <Bar dataKey="count" name="Files" fill="#1d4ed8" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDistributionChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No files registered yet.</p>;
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={85} paddingAngle={3} strokeWidth={2}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}