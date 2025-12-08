import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Ranking {
  id: string;
  keyword: string;
  position: number;
  location?: string;
  change?: number;
  page_id?: string;
  created_at: string;
}

export default function Rankings() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [position, setPosition] = useState(0);
  const [location, setLocation] = useState("");

  const loadRankings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("keyword_rankings")
        .select("id, position, location, change, page_id, created_at, keyword_term")
        .order("created_at", { ascending: false });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        keyword: item.keyword_term || "",
        position: item.position,
        location: item.location,
        change: item.change,
        page_id: item.page_id,
        created_at: item.created_at
      }));
      
      setRankings(transformedData);
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
      keyword_term: keyword,
      position,
      location: location || null,
      change: 0,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setKeyword("");
    setPosition(0);
    setLocation("");
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
      
      <div className="flex items-center gap-3 mb-6">
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Keyword"
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
        <Button className="gap-2 rounded-xl" onClick={onCreate}>
          <Plus className="w-4 h-4" />
          Add Ranking
        </Button>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      
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
              <p className="text-xs text-muted-foreground">{item.location || "Global"}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">#{item.position}</span>
              {item.change !== undefined && (
                <span className={item.change > 0 ? "text-success" : item.change < 0 ? "text-destructive" : "text-muted-foreground"}>
                  {item.change > 0 ? "+" : ""}{item.change}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}