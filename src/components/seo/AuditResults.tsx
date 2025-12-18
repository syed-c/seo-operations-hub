import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface AuditResult {
  id: string;
  issue_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation: string;
  metadata: any;
  created_at: string;
}

interface AuditResultsProps {
  entityId: string; // Could be page_id or website_id
  entityType: "page" | "website";
}

export function AuditResults({ entityId, entityType }: AuditResultsProps) {
  const [results, setResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuditResults = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("audit_results")
          .select("*")
          .order("created_at", { ascending: false });

        if (entityType === "page") {
          query = query.eq("page_id", entityId);
        } else {
          // For website-level audits, we might need to join with pages or handle differently
          // This is a simplified approach
          query = query.is("page_id", null);
        }

        const { data, error } = await query;

        if (error) {
          setError(error.message);
          return;
        }

        setResults(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load audit results");
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      fetchAuditResults();
    }
  }, [entityId, entityType]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "high":
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "low":
        return <Info className="w-5 h-5 text-info" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-destructive bg-destructive/10";
      case "high":
        return "border-destructive bg-destructive/10";
      case "medium":
        return "border-warning bg-warning/10";
      case "low":
        return "border-info bg-info/10";
      default:
        return "border-muted bg-muted/10";
    }
  };

  if (loading) {
    return <div className="p-4">Loading audit results...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive">Error: {error}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center">
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
        <p>No issues found in the latest audit</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Audit Results ({results.length} issues found)</h3>
      <div className="space-y-3">
        {results.map((result) => (
          <div 
            key={result.id} 
            className={`p-4 rounded-lg border ${getSeverityClass(result.severity)}`}
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(result.severity)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">{result.issue_type.replace('_', ' ')}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-background capitalize">
                    {result.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
                {result.recommendation && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Recommendation:</p>
                    <p className="text-sm">{result.recommendation}</p>
                  </div>
                )}
                {result.metadata && (
                  <div className="mt-2 text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(result.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}