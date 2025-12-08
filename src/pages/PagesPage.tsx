import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Bug, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Page {
  id: string;
  url: string;
  ranking_position?: number;
  content_score?: number;
  technical_score?: number;
  website_id?: string;
  created_at: string;
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [websiteId, setWebsiteId] = useState("");

  const loadPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("id, url, ranking_position, content_score, technical_score, website_id, created_at")
        .order("created_at", { ascending: false });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setPages(data || []);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load pages");
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const onCreate = async () => {
    if (!url) return;
    const { error } = await supabase.from("pages").insert({
      url,
      website_id: websiteId || null,
      content_score: 0,
      technical_score: 0,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setUrl("");
    setWebsiteId("");
    loadPages();
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadPages();
  };

  return (
    <MainLayout>
      <Header title="Pages" subtitle="Monitor rankings, content, and technical health by URL" />
      
      <div className="flex items-center gap-3 mb-6">
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Page URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Website ID (optional)"
          value={websiteId}
          onChange={(e) => setWebsiteId(e.target.value)}
        />
        <Button className="gap-2 rounded-xl" onClick={onCreate}>
          <Plus className="w-4 h-4" />
          Add Page
        </Button>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Card
            key={page.id}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <CardTitle className="truncate">{page.url}</CardTitle>
                </div>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(page.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {page.ranking_position ? `Ranking #${page.ranking_position}` : "No ranking data"}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-success">
                <TrendingUp className="w-4 h-4" />
                Content {page.content_score ? `${page.content_score}%` : "0%"}
              </div>
              <div className="flex items-center gap-2 text-warning">
                <Bug className="w-4 h-4" />
                Tech {page.technical_score ? `${page.technical_score}%` : "0%"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}