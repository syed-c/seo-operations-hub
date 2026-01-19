import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, BarChart3, RefreshCw, Bell } from "lucide-react";
import { BacklinkReportsList } from "@/components/reports/BacklinkReportsList";
import { BacklinkReportsDashboard } from "@/components/reports/BacklinkReportsDashboard";
import { useBacklinkReportsRealtime } from "@/hooks/useBacklinkReports";
import { useAuth } from "@/components/AuthGate";
import { useProject } from "@/contexts/ProjectContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { BacklinkReport } from "@/types";


export default function BacklinkReportsPage() {
  const { teamUser } = useAuth();
  const { selectedProject } = useProject();
  const queryClient = useQueryClient();
  const canViewDashboard = ['Super Admin', 'Admin', 'Manager'].includes(teamUser?.role || '');
  const { subscribe } = useBacklinkReportsRealtime((newReport: BacklinkReport) => {
    // Show toast notification for new reports
    toast({
      title: "New Backlink Report",
      description: `A new ${newReport.status} report has been generated.`,
      variant: newReport.status === 'critical' ? 'destructive' : 'default',
    });
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['backlink-reports'] });
    queryClient.invalidateQueries({ queryKey: ['backlink-report-stats'] });
    toast({ title: "Refreshed", description: "Reports data has been refreshed." });
  };

  return (
    <MainLayout>
      <Header title="Backlink Reports" subtitle="View automated backlink analysis reports" />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Project Filter Removed - uses global sidebar selection */}
          {selectedProject && (
            <div className="px-3 py-1 bg-muted rounded-md text-sm font-medium">
              Project: {selectedProject.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {canViewDashboard ? (
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />
              All Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <BacklinkReportsDashboard projectId={selectedProject?.id} />
          </TabsContent>

          <TabsContent value="reports">
            <BacklinkReportsList
              projectId={selectedProject?.id}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <BacklinkReportsList
          projectId={selectedProject?.id}
        />
      )}
    </MainLayout>
  );
}
