import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface RankingPoint {
  date: string;
  position: number;
  search_volume?: number;
}

interface RankingChartProps {
  keywordId: string;
  days?: number;
}

export function RankingChart({ keywordId, days = 30 }: RankingChartProps) {
  const [data, setData] = useState<RankingPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Calculate the date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const { data: historyData, error } = await supabase
          .from("ranking_history")
          .select("position, search_volume, recorded_at")
          .eq("keyword_id", keywordId)
          .gte("recorded_at", startDate.toISOString())
          .lte("recorded_at", endDate.toISOString())
          .order("recorded_at", { ascending: true });

        if (error) {
          setError(error.message);
          return;
        }

        const chartData = (historyData || []).map(item => ({
          date: new Date(item.recorded_at).toLocaleDateString(),
          position: item.position,
          search_volume: item.search_volume
        }));

        setData(chartData);
      } catch (err: any) {
        setError(err.message || "Failed to load ranking history");
      } finally {
        setLoading(false);
      }
    };

    if (keywordId) {
      fetchData();
    }
  }, [keywordId, days]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading chart...</div>;
  }

  if (error) {
    return <div className="h-64 flex items-center justify-center text-destructive">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center">No ranking data available</div>;
  }

  // Simple text-based chart for now
  // In a real implementation, you would use a charting library like Recharts or Chart.js
  return (
    <div className="h-64 overflow-x-auto">
      <div className="min-w-full">
        <div className="flex items-end h-48 gap-1 border-b border-l border-border pb-2 pl-2">
          {data.map((point, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center flex-1 min-w-[30px]"
              title={`${point.date}: Position ${point.position}${point.search_volume ? `, Volume ${point.search_volume}` : ''}`}
            >
              <div 
                className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                style={{ height: `${Math.max(5, 100 - (point.position || 0))}%` }}
              />
              <div className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                {point.date.split('/').slice(0, 2).join('/')}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Worse Position</span>
          <span>Better Position</span>
        </div>
      </div>
    </div>
  );
}