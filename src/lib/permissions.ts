// Centralized permission map for role-based access control
export interface PermissionMap {
  [role: string]: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
    canCreate: string[];
  };
}

// Define the permission structure for different roles
export const PERMISSION_MAP: PermissionMap = {
  'Super Admin': {
    canView: ['*', 'dashboard', 'projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'local-seo', 'automation', 'chat', 'team', 'reports', 'settings'],
    canEdit: ['*', 'projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'local-seo', 'automation', 'team', 'settings'],
    canDelete: ['*', 'projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'team'],
    canCreate: ['*', 'projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'team']
  },
  'Admin': {
    canView: ['dashboard', 'projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'local-seo', 'automation', 'chat', 'team', 'reports'],
    canEdit: ['projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'local-seo', 'automation', 'team'],
    canDelete: ['projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'team'],
    canCreate: ['projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'team']
  },
  'SEO Lead': {
    canView: ['dashboard', 'projects', 'tasks', 'keywords', 'rankings', 'backlinks', 'reports'],
    canEdit: ['tasks', 'keywords', 'rankings', 'backlinks'],
    canDelete: ['keywords', 'rankings', 'backlinks'],
    canCreate: ['keywords', 'rankings', 'backlinks']
  },
  'Content Lead': {
    canView: ['dashboard', 'projects', 'tasks', 'keywords'],
    canEdit: ['tasks', 'keywords'],
    canDelete: ['keywords'],
    canCreate: ['keywords']
  },
  'Backlink Lead': {
    canView: ['dashboard', 'projects', 'tasks', 'backlinks'],
    canEdit: ['tasks', 'backlinks'],
    canDelete: ['backlinks'],
    canCreate: ['backlinks']
  },
  'Developer': {
    canView: ['dashboard', 'projects', 'tasks', 'automation'],
    canEdit: ['tasks', 'automation'],
    canDelete: ['automation'],
    canCreate: ['automation']
  },
  'Designer': {
    canView: ['dashboard', 'projects', 'tasks'],
    canEdit: ['tasks'],
    canDelete: [],
    canCreate: []
  },
  'Client': {
    canView: ['dashboard', 'projects', 'reports'],
    canEdit: [],
    canDelete: [],
    canCreate: []
  },
  'Viewer': {
    canView: ['dashboard', 'projects', 'reports'],
    canEdit: [],
    canDelete: [],
    canCreate: []
  }
};

// Helper function to check if a role has permission to perform an action on a resource
export const hasPermission = (
  role: string,
  action: 'view' | 'edit' | 'delete' | 'create',
  resource: string
): boolean => {
  // If role doesn't exist in permission map, deny access
  if (!PERMISSION_MAP[role]) {
    return false;
  }

  // Get the permission set for the role
  const rolePermissions = PERMISSION_MAP[role];
  
  // Map action to permission type
  let permissionType: keyof typeof rolePermissions;
  switch (action) {
    case 'view':
      permissionType = 'canView';
      break;
    case 'edit':
      permissionType = 'canEdit';
      break;
    case 'delete':
      permissionType = 'canDelete';
      break;
    case 'create':
      permissionType = 'canCreate';
      break;
    default:
      return false;
  }

  // Check if role has permission for this resource
  // '*' means access to all resources
  return rolePermissions[permissionType].includes('*') || 
         rolePermissions[permissionType].includes(resource);
};

// Helper function to check if a user has a specific role
export const hasRole = (userRole: string, requiredRole: string): boolean => {
  // Exact match
  if (userRole === requiredRole) {
    return true;
  }
  
  // Check hierarchy (Super Admin can act as any role)
  if (userRole === 'Super Admin') {
    return true;
  }
  
  // Admin can act as any non-Super Admin role
  if (userRole === 'Admin' && requiredRole !== 'Super Admin') {
    return true;
  }
  
  return false;
};