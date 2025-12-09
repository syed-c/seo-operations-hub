import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Project {
  id: string;
  name: string;
  client?: string;
  status?: string;
  health_score?: number;
  created_at?: string;
}

interface ProjectContextType {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client, status, health_score, created_at")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      
      setProjects(data || []);
      
      // If no project is selected and we have projects, select the first one
      if (!selectedProject && data && data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const value = {
    selectedProject,
    setSelectedProject,
    projects,
    setProjects,
    loading,
    error,
    fetchProjects
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}