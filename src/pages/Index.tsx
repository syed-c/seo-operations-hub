import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProject } from "@/contexts/ProjectContext";
import { ProjectDashboard } from "@/components/ProjectDashboard";

const Index = () => {
  const { selectedProject } = useProject();

  // If a project is selected, show the project dashboard
  if (selectedProject) {
    return (
      <MainLayout>
        <ProjectDashboard />
      </MainLayout>
    );
  }

  // Otherwise, show the general dashboard
  return (
    <MainLayout>
      <Header
        title="Dashboard"
        subtitle="Welcome back! Please select a project to view specific analytics."
      />
      
      <Card>
        <CardHeader>
          <CardTitle>No Project Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please select a project from the dropdown menu to view project-specific analytics and connect Google Search Console.
          </p>
          <p className="text-muted-foreground">
            Once you select a project, you'll be able to connect your Google account and view real Search Console data.
          </p>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Index;
