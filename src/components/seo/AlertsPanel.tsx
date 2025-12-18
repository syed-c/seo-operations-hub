import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bell, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";

interface RankingAlert {
  id: string;
  keyword_id: string;
  previous_position: number;
  current_position: number;
  alert_type: "drop" | "improvement" | "threshold_breach";
  sent_at?: string;
  created_at: string;
}

interface AlertsPanelProps {
  projectId?: string;
  limit?: number;
}

export function AlertsPanel({ projectId, limit = 10 }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<RankingAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("ranking_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (projectId) {
          query = query.eq("project_id", projectId);
        }

        const { data, error } = await query;

        if (error) {
          setError(error.message);
          return;
        }

        setAlerts(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [projectId, limit]);

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "drop":
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      case "improvement":
        return <TrendingUp className="w-5 h-5 text-success" />;
      case "threshold_breach":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getAlertMessage = (alert: RankingAlert) => {
    const change = alert.previous_position - alert.current_position;
    switch (alert.alert_type) {
      case "drop":
        return `Ranking dropped by ${Math.abs(change)} positions (${alert.previous_position} → ${alert.current_position})`;
      case "improvement":
        return `Ranking improved by ${change} positions (${alert.previous_position} → ${alert.current_position})`;
      case "threshold_breach":
        return `Ranking fell below target threshold (${alert.current_position})`;
      default:
        return `Ranking changed (${alert.previous_position} → ${alert.current_position})`;
    }
  };

  if (loading) {
    return <div className="p-4">Loading alerts...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive">Error: {error}</div>;
  }

  if (alerts.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Bell className="w-12 h-12 mx-auto mb-2" />
        <p>No alerts at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div 
          key={alert.id} 
          className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            {getAlertIcon(alert.alert_type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">
                  Keyword ranking {alert.alert_type.replace('_', ' ')}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getAlertMessage(alert)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}