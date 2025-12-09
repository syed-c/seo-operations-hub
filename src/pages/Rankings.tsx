import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { RankingChart } from "@/components/seo/RankingChart";
import { AlertsPanel } from "@/components/seo/AlertsPanel";

interface Ranking {
  id: string;
  keyword: string;
  position: number;
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
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([]);
  const [alerts, setAlerts] = useState<RankingAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [position, setPosition] = useState(0);
  const [location, setLocation] = useState("");
  const [device, setDevice] = useState("desktop");

  const loadRankings = async () => {
    setLoading(true);
    try {
      // Load current rankings
      const { data: rankingsData, error: rankingsError } = await supabase
        .from("keyword_rankings")
        .select("id, keyword_id, position, location, device, search_volume, trend, recorded_at")
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
      
      // Transform the data to match our interfaces
      const transformedRankings = (rankingsData || []).map(item => ({
        id: item.id,
        keyword: item.keyword_id, // Will need to join with keywords table for actual keyword text
        position: item.position,
        location: item.location,
        device: item.device,
        search_volume: item.search_volume,
        trend: item.trend,
        recorded_at: item.recorded_at
      }));
      
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
    loadRankings();
  }, []);

  const onCreate = async () => {
    if (!keyword) return;
    const { error } = await supabase.from("keyword_rankings").insert({
      keyword_id: keyword, // This should be an actual keyword ID
      position,
      location: location || null,
      device: device || 'desktop',
      search_volume: 0,
      trend: 'stable',
      recorded_at: new Date().toISOString()
    });
    if (error) {
      setError(error.message);
      return;
    }
    setKeyword("");
    setPosition(0);
    setLocation("");
    setDevice("desktop");
    loadRankings();
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("keyword_rankings").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadRankings();
  };

  return (
    <MainLayout>
      <Header title="Rankings" subtitle="Daily keyword performance by location" />
      
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Keyword ID"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <input
          type="number"
          className="h-10 w-20 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Pos"
          value={position || ""}
          onChange={(e) => setPosition(Number(e.target.value))}
        />
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <select
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
        >
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
        </select>
        <Button className="gap-2 rounded-xl" onClick={onCreate}>
          <Plus className="w-4 h-4" />
          Add Ranking
        </Button>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankings.map((item) => (
              <Card
                key={item.id}
                className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm">{item.keyword}</CardTitle>
                    </div>
                    <button
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.location || "Global"} • {item.device || "Desktop"}</p>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">#{item.position}</span>
                  {item.search_volume !== undefined && (
                    <span className="text-muted-foreground">
                      Vol: {item.search_volume}
                    </span>
                  )}
                  {item.trend && (
                    <span className={item.trend === 'up' ? "text-success" : item.trend === 'down' ? "text-destructive" : "text-muted-foreground"}>
                      {item.trend === 'up' ? <TrendingUp className="w-4 h-4 inline" /> : 
                       item.trend === 'down' ? <TrendingDown className="w-4 h-4 inline" /> : 
                       <Minus className="w-4 h-4 inline" />}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Ranking History Charts */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ranking History</h2>
            {rankings.slice(0, 3).map((item) => (
              <Card key={`chart-${item.id}`}>
                <CardHeader>
                  <CardTitle className="text-sm">{item.keyword} - Historical Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <RankingChart keywordId={item.keyword} days={30} />
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