import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase, ensureSupabase } from "@/lib/supabaseClient";
import { Project } from "@/types";

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


  // Load selected project from local storage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId && projects.length > 0) {
      const savedProject = projects.find(p => p.id === savedProjectId);
      if (savedProject && (!selectedProject || selectedProject.id !== savedProject.id)) {
        setSelectedProject(savedProject);
      }
    }
  }, [projects]); // Depend on projects so we re-evaluate when projects load

  // Save selected project to local storage whenever it changes
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProjectId', selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = useCallback(async () => {
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

      // Fetch projects based on user role
      let data;
      let error;

      if (userData && userData.role === 'Developer') {
        const { data: projectMemberData, error: projectMemberError } = await ensureSupabase()
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id);

        if (projectMemberError) {
          console.error('Error fetching project members:', projectMemberError);
          throw new Error(projectMemberError.message);
        }

        if (!projectMemberData || projectMemberData.length === 0) {
          data = [];
          error = null;
        } else {
          const projectIds = projectMemberData.map(pm => pm.project_id);
          const { data: projectsData, error: projectsError } = await ensureSupabase()
            .from('projects')
            .select('id, name, client, status, health_score, created_at')
            .in('id', projectIds)
            .order('created_at', { ascending: false });

          if (projectsError) {
            console.error('Error fetching projects:', projectsError);
            throw new Error(projectsError.message);
          }

          data = projectsData;
          error = null;
        }
      } else {
        const result = await ensureSupabase()
          .from('projects')
          .select('id, name, client, status, health_score, created_at')
          .order('created_at', { ascending: false });

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error fetching projects:', error);
        throw new Error(error.message);
      }

      console.log('Projects fetch result:', { data, error });

      setProjects(data || []);

      // Logic to set initial selected project logic
      if (data && data.length > 0) {
        // Try to recover from local storage first
        const savedProjectId = localStorage.getItem('selectedProjectId');
        const savedProject = savedProjectId ? data.find(p => p.id === savedProjectId) : null;

        // If we found the saved project in the new list, use it. 
        // Otherwise, if no project is currently selected (or the current one is invalid), select the first one.
        if (savedProject) {
          // We might already have it selected, but this ensures consistency if projects list refreshed
          setSelectedProject(prev => prev?.id === savedProject.id ? prev : savedProject);
        } else if (!selectedProject) {
          setSelectedProject(data[0]);
        }
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
  }, []); // Remove selectedProject dependency to avoid loops. Logic inside handles it.

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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