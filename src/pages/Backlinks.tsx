import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ShieldAlert, TrendingUp, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

interface Backlink {
  id: string;
  domain: string;
  status: string;
  strength?: string;
  anchor_text?: string;
  page_id?: string;
  created_at: string;
}

export default function Backlinks() {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [domain, setDomain] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const [status, setStatus] = useState("new");

  const loadBacklinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("backlinks")
        .select("id, domain, status, strength, anchor_text, page_id, created_at")
        .order("created_at", { ascending: false });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setBacklinks(data || []);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load backlinks");
    }
  };

  useEffect(() => {
    loadBacklinks();
  }, []);

  const onCreate = async () => {
    if (!domain) return;
    const { error } = await supabase.from("backlinks").insert({
      domain,
      anchor_text: anchorText || null,
      status,
      strength: "DA50",
    });
    if (error) {
      setError(error.message);
      return;
    }
    setDomain("");
    setAnchorText("");
    setStatus("new");
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
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Anchor Text"
          value={anchorText}
          onChange={(e) => setAnchorText(e.target.value)}
        />
        <select
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="new">New</option>
          <option value="lost">Lost</option>
          <option value="toxic">Toxic</option>
        </select>
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
                  <CardTitle className="text-sm">{link.domain}</CardTitle>
                </div>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(link.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{link.anchor_text || "No anchor text"}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="chip">{link.status}</span>
              <div className="flex items-center gap-2">
                {link.status === "toxic" ? (
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-success" />
                )}
                <span className="font-semibold text-foreground">{link.strength || "DA50"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}