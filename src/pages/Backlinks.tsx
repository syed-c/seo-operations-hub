import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ShieldAlert, TrendingUp, Plus, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
  link_type?: string;
  link_status?: string;
  submission_date?: string;
  last_check_result?: any;
}

import { useProject } from "@/contexts/ProjectContext";

// ... (existing imports)

export default function Backlinks() {
  const [backlinks, setBacklinks] = useState<(Backlink & { domain: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const [selectedBacklink, setSelectedBacklink] = useState<Backlink | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { selectedProject } = useProject(); // Add project context

  const loadBacklinks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("backlinks")
        .select("id, url, source_url, anchor_text, toxicity_score, spam_reason, discovered_at, lost, created_at, link_type, link_status, submission_date, last_check_result")
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

  const handleViewDetails = (backlink: Backlink) => {
    setSelectedBacklink(backlink);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'working':
        return 'bg-success text-white';
      case 'dead':
        return 'bg-destructive text-white';
      case 'pending':
        return 'bg-warning text-white';
      case 'filtered':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'working':
        return 'Working';
      case 'dead':
        return 'Dead';
      case 'pending':
        return 'Pending';
      case 'filtered':
        return 'Filtered';
      default:
        return 'Unknown';
    }
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
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all cursor-pointer"
            onClick={() => handleViewDetails(link)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm truncate">{link.domain}</CardTitle>
                </div>
                {link.link_status && (
                  <Badge className={getStatusColor(link.link_status)}>
                    {getStatusText(link.link_status)}
                  </Badge>
                )}
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

      {/* Backlink Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Backlink Details</DialogTitle>
          </DialogHeader>
          {selectedBacklink && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">URL</h3>
                  <p className="text-sm">
                    <a 
                      href={selectedBacklink.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {selectedBacklink.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Domain</h3>
                  <p className="text-sm">{selectedBacklink.domain}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Anchor Text</h3>
                  <p className="text-sm">{selectedBacklink.anchor_text || "No anchor text"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Status</h3>
                  <Badge className={getStatusColor(selectedBacklink.link_status || '')}>
                    {getStatusText(selectedBacklink.link_status || '')}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Link Type</h3>
                  <p className="text-sm">{selectedBacklink.link_type || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Toxicity Score</h3>
                  <p className="text-sm">{selectedBacklink.toxicity_score !== undefined ? selectedBacklink.toxicity_score : "N/A"}</p>
                </div>
              </div>
              
              {selectedBacklink.spam_reason && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Spam Reason</h3>
                  <p className="text-sm text-destructive">{selectedBacklink.spam_reason}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Discovered At</h3>
                  <p className="text-sm">{new Date(selectedBacklink.discovered_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Submission Date</h3>
                  <p className="text-sm">
                    {selectedBacklink.submission_date 
                      ? new Date(selectedBacklink.submission_date).toLocaleDateString()
                      : "N/A"
                    }
                  </p>
                </div>
              </div>
              
              {selectedBacklink.last_check_result && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Last Check Result</h3>
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(selectedBacklink.last_check_result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}