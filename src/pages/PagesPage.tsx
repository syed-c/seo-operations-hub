import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Bug, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { AuditResults } from "@/components/seo/AuditResults";

interface Page {
  id: string;
  url: string;
  title?: string;
  content?: string;
  word_count?: number;
  content_score?: number;
  cwv_lcp?: number;
  cwv_cls?: number;
  cwv_fid?: number;
  performance_score?: number;
  seo_score?: number;
  accessibility_score?: number;
  last_audited?: string;
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
        .select("id, url, title, content, word_count, content_score, cwv_lcp, cwv_cls, cwv_fid, performance_score, seo_score, accessibility_score, last_audited, website_id, created_at")
        .order("created_at", { ascending: false });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      const transformedData = (data || []).map(page => ({
        ...page,
        content: page.content ? page.content.substring(0, 100) + '...' : ''
      }));
      setPages(transformedData);
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
      performance_score: 0,
      seo_score: 0,
      accessibility_score: 0,
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
                  <CardTitle className="truncate text-sm">{page.url}</CardTitle>
                </div>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(page.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {page.title || "No title"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-success">
                  <TrendingUp className="w-4 h-4" />
                  <div>
                    <div className="text-sm text-muted-foreground">Content</div>
                    <div className="font-medium">{page.content_score ? `${page.content_score}%` : "0%"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-warning">
                  <Bug className="w-4 h-4" />
                  <div>
                    <div className="text-sm text-muted-foreground">Performance</div>
                    <div className="font-medium">{page.performance_score ? `${page.performance_score}%` : "0%"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-info">
                  <FileText className="w-4 h-4" />
                  <div>
                    <div className="text-sm text-muted-foreground">SEO</div>
                    <div className="font-medium">{page.seo_score ? `${page.seo_score}%` : "0%"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="w-4 h-4" />
                  <div>
                    <div className="text-sm text-muted-foreground">Accessibility</div>
                    <div className="font-medium">{page.accessibility_score ? `${page.accessibility_score}%` : "0%"}</div>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  Last audited: {page.last_audited ? new Date(page.last_audited).toLocaleDateString() : 'Never'}
                </div>
              </div>
              
              {/* Audit Results */}
              <div className="pt-4 border-t border-border">
                <AuditResults entityId={page.id} entityType="page" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
