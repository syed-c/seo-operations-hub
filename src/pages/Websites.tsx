import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Shield, Activity, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Website {
  id: string;
  domain: string;
  pages_count?: number;
  health_score?: number;
  status?: string;
  created_at: string;
}

export default function Websites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [domain, setDomain] = useState("");

  const loadWebsites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("websites")
        .select("id, domain, pages_count, health_score, status, created_at")
        .order("created_at", { ascending: false });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setWebsites(data || []);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load websites");
    }
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  const onCreate = async () => {
    if (!domain) return;
    const { error } = await supabase.from("websites").insert({
      domain,
      status: "pending",
      health_score: 0,
      pages_count: 0,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setDomain("");
    loadWebsites();
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("websites").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadWebsites();
  };

  return (
    <MainLayout>
      <Header title="Websites" subtitle="Manage connected domains and their health" />
      
      <div className="flex items-center gap-3 mb-6">
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Domain (e.g., example.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <Button className="gap-2 rounded-xl" onClick={onCreate}>
          <Plus className="w-4 h-4" />
          Add Website
        </Button>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {websites.map((site) => (
          <Card
            key={site.id}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <CardTitle>{site.domain}</CardTitle>
                </div>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(site.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {site.pages_count ? `${site.pages_count} pages indexed` : "No pages indexed"}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                Health: <span className="font-semibold text-foreground">
                  {site.health_score ? `${site.health_score}%` : "0%"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Status: <span className="font-semibold text-foreground capitalize">{site.status || "unknown"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}