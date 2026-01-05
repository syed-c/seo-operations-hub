import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Bug, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { AuditResults } from "@/components/seo/AuditResults";
import { RefreshPagesModal } from "@/components/pages/RefreshPagesModal";
import { useToast } from "@/hooks/use-toast";
import { usePages, useInvalidatePages } from "@/hooks/usePages";
import { Project } from "@/types";
import { useAuth } from "@/components/AuthGate";

export default function PagesPage() {
  const { data: pages = [], isLoading, error } = usePages();
  const invalidatePages = useInvalidatePages();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { teamUser } = useAuth();
  
  // Determine if user has permission to refresh data
  const canRefreshData = teamUser?.role === 'Super Admin' || teamUser?.role === 'Admin' || teamUser?.role === 'SEO Lead';

  const loadProjects = async () => {
    try {
      // First, get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("User not authenticated");
        return;
      }
      
      // Check user role
      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      
      if (roleError) {
        console.error("Error fetching user role:", roleError.message);
        return;
      }
      
      if (userData?.role === 'Developer') {
        // For developers, fetch only assigned projects
        // First, get the project IDs assigned to the user
        const { data: projectMemberData, error: projectMemberError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (projectMemberError) {
          console.error('Error fetching project members:', projectMemberError);
          return;
        }
        
        if (!projectMemberData || projectMemberData.length === 0) {
          // No projects assigned to this user
          setProjects([]);
          return;
        }
        
        // Extract project IDs
        const projectIds = projectMemberData.map(pm => pm.project_id);
        
        // Then fetch the projects with those IDs
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, client, status, health_score, created_at')
          .in('id', projectIds)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading projects:', error.message);
          return;
        }
        
        setProjects(data || []);
      } else {
        // For other roles, fetch all projects
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, client, status, health_score, created_at')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading projects:', error.message);
          return;
        }
        
        setProjects(data || []);
      }
    } catch (err: any) {
      console.error("Error loading projects:", err.message || "Failed to load projects");
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRefreshComplete = () => {
    // Invalidate pages query to refetch data
    invalidatePages();
  };

  return (
    <MainLayout>
      <Header title="Pages" subtitle="Monitor rankings, content, and technical health by URL" />
      
      <div className="flex items-center gap-3 mb-6">
        {canRefreshData && (
        <Button className="gap-2 rounded-xl" onClick={() => setIsModalOpen(true)}>
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
        )}
      </div>
      
      {isLoading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error.message || error}</p>}
      
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
                    <div className="text-sm text-muted-foreground">Technical</div>
                    <div className="font-medium">{page.technical_score ? `${page.technical_score}%` : "0%"}</div>
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
      
      <RefreshPagesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={projects}
        onRefreshComplete={handleRefreshComplete}
      />
    </MainLayout>
  );
}