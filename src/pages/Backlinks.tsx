import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ShieldAlert, TrendingUp, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Backlink {
  id: string;
  url: string;
  source_url: string;
  anchor_text?: string;
  toxicity_score?: number;
  spam_reason?: string;
  discovered_at: string;
  lost?: boolean;
  created_at: string;
}

import { useProject } from "@/contexts/ProjectContext";

// ... (existing imports)

export default function Backlinks() {
  const [backlinks, setBacklinks] = useState<(Backlink & { domain: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const { selectedProject } = useProject(); // Add project context

  const loadBacklinks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("backlinks")
        .select("id, url, source_url, anchor_text, toxicity_score, spam_reason, discovered_at, lost, created_at")
        .order("discovered_at", { ascending: false });

      if (selectedProject) {
        query = query.eq('project_id', selectedProject.id);
      }

      const { data, error } = await query;

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      const transformedData = (data || []).map(link => {
        let domain = '';
        try {
          domain = new URL(link.source_url).hostname;
        } catch {
          domain = link.source_url || '';
        }
        return {
          ...link,
          domain
        };
      });
      setBacklinks(transformedData);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load backlinks");
    }
  };

  useEffect(() => {
    loadBacklinks();
  }, [selectedProject]); // Add dependency

  const onCreate = async () => {
    if (!sourceUrl) return;
    const { error } = await supabase.from("backlinks").insert({
      url: sourceUrl,
      source_url: sourceUrl,
      anchor_text: anchorText || null,
      discovered_at: new Date().toISOString()
    });
    if (error) {
      setError(error.message);
      return;
    }
    setSourceUrl("");
    setAnchorText("");
    loadBacklinks();
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("backlinks").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadBacklinks();
  };

  return (
    <MainLayout>
      <Header title="Backlinks" subtitle="Monitor new, lost, and risky backlinks" />

      <div className="flex items-center gap-3 mb-6">
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm flex-1 max-w-xs"
          placeholder="Source URL"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Anchor Text"
          value={anchorText}
          onChange={(e) => setAnchorText(e.target.value)}
        />
        <Button className="gap-2 rounded-xl" onClick={onCreate}>
          <Plus className="w-4 h-4" />
          Add Backlink
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {backlinks.map((link) => (
          <Card
            key={link.id}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm truncate">{link.domain}</CardTitle>
                </div>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(link.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{link.anchor_text || "No anchor text"}</p>
              {link.spam_reason && (
                <p className="text-xs text-destructive mt-1">{link.spam_reason}</p>
              )}
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="chip">
                {link.lost ? "Lost" : link.toxicity_score && link.toxicity_score > 50 ? "Toxic" : "New"}
              </span>
              <div className="flex items-center gap-2">
                {link.toxicity_score && link.toxicity_score > 50 ? (
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-success" />
                )}
                {link.toxicity_score !== undefined && (
                  <span className="font-semibold text-foreground">Score: {link.toxicity_score}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
