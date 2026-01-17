import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Plus, Trash2, TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { RankingChart } from "@/components/seo/RankingChart";
import { AlertsPanel } from "@/components/seo/AlertsPanel";
import { useProject } from "@/contexts/ProjectContext";

interface Ranking {
  id: string;
  ranking_id: string;
  keyword_id: string;
  keyword: string;
  position: number | string;
  location?: string;
  device?: string;
  search_volume?: number;
  trend?: string;
  recorded_at: string;
}
interface RankingHistory {
  id: string;
  keyword_id: string;
  position: number;
  location?: string;
  device?: string;
  search_volume?: number;
  recorded_at: string;
}

interface RankingAlert {
  id: string;
  keyword_id: string;
  previous_position: number;
  current_position: number;
  alert_type: string;
  sent_at?: string;
  created_at: string;
}

export default function Rankings() {
  const { selectedProject } = useProject();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([]);
  const [alerts, setAlerts] = useState<RankingAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadRankings = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      // Load current rankings with keyword text joined from keywords table
      // Using explicit foreign key hint to resolve Supabase relationship ambiguity
      const { data: rankingsData, error: rankingsError } = await supabase
        .from("keyword_rankings")
        .select(`
          id,
          location,
          device,
          position,
          search_volume,
          keyword_id,
          keywords:keywords!keyword_rankings_keyword_id_fkey (
            id,
            keyword,
            intent
          )
        `)
        .order("recorded_at", { ascending: false });
      // Load ranking history for charts
      const { data: historyData, error: historyError } = await supabase
        .from("ranking_history")
        .select("id, keyword_id, position, location, device, search_volume, recorded_at")
        .order("recorded_at", { ascending: false });

      // Load ranking alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("ranking_alerts")
        .select("id, keyword_id, previous_position, current_position, alert_type, sent_at, created_at")
        .order("created_at", { ascending: false });

      setLoading(false);

      if (rankingsError) {
        setError(rankingsError.message);
        return;
      }

      if (historyError) {
        setError(historyError.message);
        return;
      }

      if (alertsError) {
        setError(alertsError.message);
        return;
      }

      // Transform the data to match our interfaces with proper data integrity
      const transformedRankings = (rankingsData || []).map((item: any) => {
        const keywords = item.keywords as { id: string; keyword: string; intent: string } | null;
        return {
          id: item.id,
          ranking_id: item.id,
          keyword_id: item.keyword_id,
          keyword: keywords?.keyword || "Unknown Keyword",
          position: item.position !== null ? item.position : "No ranking on first page",
          location: item.location || "Global",
          device: item.device || "desktop",
          search_volume: item.search_volume !== null ? item.search_volume : 0,
          trend: undefined as string | undefined,
          recorded_at: new Date().toISOString()
        };
      });
      const transformedHistory = (historyData || []).map(item => ({
        id: item.id,
        keyword_id: item.keyword_id,
        position: item.position,
        location: item.location,
        device: item.device,
        search_volume: item.search_volume,
        recorded_at: item.recorded_at
      }));

      const transformedAlerts = (alertsData || []).map(item => ({
        id: item.id,
        keyword_id: item.keyword_id,
        previous_position: item.previous_position,
        current_position: item.current_position,
        alert_type: item.alert_type,
        sent_at: item.sent_at,
        created_at: item.created_at
      }));

      setRankings(transformedRankings);
      setRankingHistory(transformedHistory);
      setAlerts(transformedAlerts);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load rankings");
    }
  };

  useEffect(() => {
    if (selectedProject) {
      loadRankings();
    }
  }, [selectedProject]);

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("keyword_rankings").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadRankings();
  };

  // Filter rankings based on search term
  const filteredRankings = rankings.filter(ranking => 
    ranking.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ranking.location && ranking.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ranking.device && ranking.device.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get ranking status color
  const getRankingStatusColor = (position: number | string) => {
    if (typeof position === 'string') return 'text-destructive'; // No ranking
    
    if (position <= 10) return 'text-success';
    if (position <= 50) return 'text-warning';
    return 'text-destructive';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  return (
    <MainLayout>
      <Header title="Rankings" subtitle="Daily keyword performance by location" />
      
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="h-10 w-full pl-10 pr-4 rounded-xl border border-border bg-card text-sm"
            placeholder="Search by keyword, location, or device..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRankings.map((item) => (
              <Card
                key={item.id}
                className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base font-semibold">{item.keyword}</CardTitle>
                    </div>
                    <button
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.location || "Global"} • {item.device ? item.device.charAt(0).toUpperCase() + item.device.slice(1) : "Desktop"}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className={`text-2xl font-bold ${getRankingStatusColor(item.position)}`}>
                    {typeof item.position === 'string' ? item.position : `#${item.position}`}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Vol: {item.search_volume || 0}
                    </span>
                    <span className="text-muted-foreground">
                      Last checked: {formatDate(item.recorded_at)}
                    </span>
                  </div>
                  {item.trend && (
                    <div className="flex items-center justify-end">
                      <span className={item.trend === 'up' ? "text-success flex items-center gap-1" : item.trend === 'down' ? "text-destructive flex items-center gap-1" : "text-muted-foreground flex items-center gap-1"}>
                        {item.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
                         item.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : 
                         <Minus className="w-4 h-4" />}
                        {item.trend === 'up' ? 'Improving' : item.trend === 'down' ? 'Declining' : 'Stable'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Ranking History Charts */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ranking History</h2>
            {filteredRankings.slice(0, 3).map((item) => (
              <Card key={`chart-${item.id}`}>
                <CardHeader>
                  <CardTitle className="text-sm">{item.keyword} - Historical Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <RankingChart keywordId={item.keyword_id} days={30} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Alerts Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertsPanel limit={10} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
