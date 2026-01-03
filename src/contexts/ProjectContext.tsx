import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, ensureSupabase } from "@/lib/supabaseClient";

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
      
      // First, try to get the current user's role
      const { data: { user } } = await ensureSupabase().auth.getUser();
      
      if (!user) {
        console.log('No user is currently logged in');
        setProjects([]);
        setLoading(false);
        return;
      }
      
      // Check user role
      const { data: userData, error: userError } = await ensureSupabase()
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      
      console.log('User role data:', { userData, userError });
      
      // Fetch projects from the projects table
      let query = ensureSupabase().from("projects").select("id, name, client, status, health_score, created_at");
      
      // If user is Super Admin or Admin, we might need to handle differently
      if (userData && (userData.role === 'Super Admin' || userData.role === 'Admin')) {
        console.log('User is admin, fetching all projects');
        // For admins, we should be able to see all projects
        // The RLS policies should allow this
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      console.log('Projects fetch result:', { data, error });

      if (error) {
        console.error('Error fetching projects:', error);
        throw new Error(error.message);
      }
      
      setProjects(data || []);
      
      // If no project is selected and we have projects, select the first one
      if (!selectedProject && data && data.length > 0) {
        setSelectedProject(data[0]);
      }
      
      // If no projects exist, create a default one
      if (data && data.length === 0) {
        console.log('No projects found, creating default project');
        const { data: newProject, error: createError } = await ensureSupabase()
          .from("projects")
          .insert({
            name: "Default Project",
            client: "Default Client",
            status: "active",
            health_score: 70
          })
          .select();
          
        if (createError) {
          console.error("Error creating default project:", createError);
        } else if (newProject && newProject.length > 0) {
          console.log("Default project created:", newProject[0]);
          setProjects(newProject);
          setSelectedProject(newProject[0]);
        }
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
    // In production builds, return a default value instead of throwing
    // to avoid errors during initial render
    return {
      selectedProject: null,
      setSelectedProject: () => {},
      projects: [],
      setProjects: () => {},
      loading: true,
      error: null,
      fetchProjects: async () => {}
    };
  }
  return context;
}