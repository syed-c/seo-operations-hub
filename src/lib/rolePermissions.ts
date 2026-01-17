// Define types for navigation items and sections
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  allowedRoles: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Define navigation configuration based on user roles
export const navigationConfig: Record<string, NavItem[]> = {
  super_admin: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: "check-circle",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Backlink Reports",
      href: "/backlink-reports",
      icon: "link",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Backlink Lead", "Manager"]
    },
    {
      title: "Chat",
      href: "/chat",
      icon: "message-circle",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Team",
      href: "/team",
      icon: "users",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Client", "Viewer"]
    },
    {
      title: "Settings",
      href: "/settings",
      icon: "settings",
      allowedRoles: ["Super Admin", "Admin"]
    },
    {
      title: "Backlinks",
      href: "/backlinks",
      icon: "link",
      allowedRoles: ["Super Admin", "Admin", "Backlink Lead", "Technical SEO"]
    },
    {
      title: "Local SEO",
      href: "/local-seo",
      icon: "map-pin",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Technical SEO"]
    },
    {
      title: "Automation",
      href: "/automation",
      icon: "zap",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Technical SEO"]
    },
    {
      title: "Websites",
      href: "/websites",
      icon: "globe",
      allowedRoles: ["Super Admin", "Admin", "SEO Lead", "Technical SEO"]
    }
  ],
  admin: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: "check-circle",
      allowedRoles: ["Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Chat",
      href: "/chat",
      icon: "message-circle",
      allowedRoles: ["Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Team",
      href: "/team",
      icon: "users",
      allowedRoles: ["Admin", "SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Client", "Viewer"]
    },
    {
      title: "Settings",
      href: "/settings",
      icon: "settings",
      allowedRoles: ["Admin"]
    },
    {
      title: "Backlinks",
      href: "/backlinks",
      icon: "link",
      allowedRoles: ["Admin", "Backlink Lead", "Technical SEO"]
    },
    {
      title: "Local SEO",
      href: "/local-seo",
      icon: "map-pin",
      allowedRoles: ["Admin", "SEO Lead", "Technical SEO"]
    },
    {
      title: "Automation",
      href: "/automation",
      icon: "zap",
      allowedRoles: ["Admin", "SEO Lead", "Technical SEO"]
    },
    {
      title: "Websites",
      href: "/websites",
      icon: "globe",
      allowedRoles: ["Admin", "SEO Lead", "Technical SEO"]
    }
  ],
  seo_lead: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: "check-circle",
      allowedRoles: ["SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Chat",
      href: "/chat",
      icon: "message-circle",
      allowedRoles: ["SEO Lead", "Content Lead", "Backlink Lead", "Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Backlinks",
      href: "/backlinks",
      icon: "link",
      allowedRoles: ["SEO Lead", "Backlink Lead", "Technical SEO"]
    },
    {
      title: "Local SEO",
      href: "/local-seo",
      icon: "map-pin",
      allowedRoles: ["SEO Lead", "Technical SEO"]
    },
    {
      title: "Automation",
      href: "/automation",
      icon: "zap",
      allowedRoles: ["SEO Lead", "Technical SEO"]
    },
    {
      title: "Websites",
      href: "/websites",
      icon: "globe",
      allowedRoles: ["SEO Lead", "Technical SEO"]
    }
  ],
  content_lead: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["Content Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["Content Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["Content Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: "check-circle",
      allowedRoles: ["Content Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["Content Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Chat",
      href: "/chat",
      icon: "message-circle",
      allowedRoles: ["Content Lead", "Developer", "Client", "Viewer"]
    }
  ],
  backlink_lead: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["Backlink Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["Backlink Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["Backlink Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: "check-circle",
      allowedRoles: ["Backlink Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["Backlink Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Backlink Reports",
      href: "/backlink-reports",
      icon: "link",
      allowedRoles: ["Backlink Lead"]
    },
    {
      title: "Chat",
      href: "/chat",
      icon: "message-circle",
      allowedRoles: ["Backlink Lead", "Developer", "Client", "Viewer"]
    },
    {
      title: "Backlinks",
      href: "/backlinks",
      icon: "link",
      allowedRoles: ["Backlink Lead"]
    }
  ],
  technical_seo: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: "check-circle",
      allowedRoles: ["Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Chat",
      href: "/chat",
      icon: "message-circle",
      allowedRoles: ["Technical SEO", "Developer", "Client", "Viewer"]
    },
    {
      title: "Backlinks",
      href: "/backlinks",
      icon: "link",
      allowedRoles: ["Technical SEO"]
    },
    {
      title: "Local SEO",
      href: "/local-seo",
      icon: "map-pin",
      allowedRoles: ["Technical SEO"]
    },
    {
      title: "Automation",
      href: "/automation",
      icon: "zap",
      allowedRoles: ["Technical SEO"]
    },
    {
      title: "Websites",
      href: "/websites",
      icon: "globe",
      allowedRoles: ["Technical SEO"]
    }
  ],
  developer: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["Developer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["Developer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["Developer"]
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: "check-circle",
      allowedRoles: ["Developer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["Developer"]
    },
    {
      title: "Chat",
      href: "/chat",
      icon: "message-circle",
      allowedRoles: ["Developer"]
    }
  ],
  client: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["Client", "Viewer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["Client", "Viewer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["Client", "Viewer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["Client", "Viewer"]
    }
  ],
  viewer: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      allowedRoles: ["Viewer"]
    },
    {
      title: "Projects",
      href: "/projects",
      icon: "folder",
      allowedRoles: ["Viewer"]
    },
    {
      title: "Pages",
      href: "/pages",
      icon: "file",
      allowedRoles: ["Viewer"]
    },
    {
      title: "Reports",
      href: "/backlink-reports",
      icon: "bar-chart-3",
      allowedRoles: ["Viewer"]
    }
  ]
};

// Function to get navigation items for a specific role
export const getNavigationForRole = (role: string): NavItem[] => {
  // Convert role to lowercase and check if it matches any of our predefined roles
  const normalizedRole = role.toLowerCase().replace(/\s+/g, '_');
  
  // Check if we have a specific configuration for this role
  if (navigationConfig[normalizedRole]) {
    return navigationConfig[normalizedRole];
  }
  
  // Default to super_admin configuration if role is not found
  return navigationConfig.super_admin;
};

// Function to check if a user has access to a specific route based on their role
export const hasAccessToRoute = (role: string, route: string): boolean => {
  const navItems = getNavigationForRole(role);
  return navItems.some(item => item.href === route);
};