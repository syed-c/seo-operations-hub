import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { date: "Mon", position: 12, clicks: 245 },
  { date: "Tue", position: 10, clicks: 312 },
  { date: "Wed", position: 8, clicks: 428 },
  { date: "Thu", position: 6, clicks: 567 },
  { date: "Fri", position: 5, clicks: 623 },
  { date: "Sat", position: 4, clicks: 489 },
  { date: "Sun", position: 3, clicks: 534 },
];

export function RankingChart() {
  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="section-title">Ranking Trends</h3>
          <p className="text-sm text-muted-foreground mt-1">Average position over time</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Clicks</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="positionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(342, 72%, 57%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(342, 72%, 57%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            reversed
            domain={[1, 15]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Area
            type="monotone"
            dataKey="position"
            stroke="hsl(342, 72%, 57%)"
            strokeWidth={2.5}
            fill="url(#positionGradient)"
            dot={{ fill: "hsl(342, 72%, 57%)", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
