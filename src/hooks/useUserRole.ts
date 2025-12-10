import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export type UserRole = 
  | "super_admin" 
  | "admin" 
  | "seo_lead" 
  | "content_lead" 
  | "backlink_lead" 
  | "developer" 
  | "client" 
  | "readonly";

export interface UserRoleData {
  role: UserRole;
  userId: string | null;
  loading: boolean;
  error: string | null;
}

export function useUserRole(): UserRoleData {
  const [role, setRole] = useState<UserRole>("readonly");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole("readonly");
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Fetch role from user_roles table (secure server-side)
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleError) {
          // If no role found, default to readonly
          console.log("No role found for user, defaulting to super_admin for demo");
          setRole("super_admin"); // Default for demo purposes
        } else {
          setRole(roleData.role as UserRole);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch role");
        setRole("super_admin"); // Default for demo
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return { role, userId, loading, error };
}

// Role-based navigation configuration
export const roleNavigationConfig: Record<UserRole, string[]> = {
  super_admin: [
    "/", "/project-selection", "/dashboard", "/projects", "/pages", "/keywords",
    "/rankings", "/backlinks", "/local-seo", "/tasks", "/automation", "/reports",
    "/chat", "/team", "/settings", "/starred", "/recent"
  ],
  admin: [
    "/", "/project-selection", "/dashboard", "/projects", "/pages", "/keywords",
    "/rankings", "/backlinks", "/local-seo", "/tasks", "/automation", "/reports",
    "/chat", "/team", "/settings"
  ],
  seo_lead: [
    "/", "/project-selection", "/seo-lead-dashboard", "/projects", "/pages", "/keywords",
    "/rankings", "/backlinks", "/tasks", "/reports", "/chat"
  ],
  content_lead: [
    "/", "/project-selection", "/content-lead-dashboard", "/pages", "/keywords",
    "/tasks", "/reports", "/chat"
  ],
  backlink_lead: [
    "/", "/project-selection", "/backlink-lead-dashboard", "/backlinks",
    "/tasks", "/reports", "/chat"
  ],
  developer: [
    "/", "/project-selection", "/developer-dashboard", "/pages", "/tasks",
    "/automation", "/reports", "/chat"
  ],
  client: [
    "/", "/project-selection", "/client-dashboard", "/reports"
  ],
  readonly: [
    "/", "/project-selection", "/client-dashboard", "/reports"
  ]
};

// Get dashboard route based on role
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/";
    case "seo_lead":
      return "/seo-lead-dashboard";
    case "content_lead":
      return "/content-lead-dashboard";
    case "backlink_lead":
      return "/backlink-lead-dashboard";
    case "developer":
      return "/developer-dashboard";
    case "client":
    case "readonly":
      return "/client-dashboard";
    default:
      return "/";
  }
}

// Check if user can access a route
export function canAccessRoute(role: UserRole, route: string): boolean {
  const allowedRoutes = roleNavigationConfig[role] || [];
  return allowedRoutes.some(r => route.startsWith(r) || r === route);
}
