import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";

const weeklyData = [
  { day: "Mon", tasks: 12, audits: 3 },
  { day: "Tue", tasks: 19, audits: 5 },
  { day: "Wed", tasks: 8, audits: 2 },
  { day: "Thu", tasks: 15, audits: 4 },
  { day: "Fri", tasks: 22, audits: 6 },
  { day: "Sat", tasks: 5, audits: 1 },
  { day: "Sun", tasks: 3, audits: 0 },
];

export function QuickStats() {
  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="section-title">Weekly Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">Tasks & audits completed</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-xs text-muted-foreground">Audits</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="audits" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
