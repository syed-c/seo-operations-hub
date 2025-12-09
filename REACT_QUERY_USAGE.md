# React Query Usage Guide

This document explains how to properly use React Query in the SEO Operations Hub project for data fetching and state management.

## Current Setup

React Query is already installed and configured in the project:
- Provider is set up in `src/App.tsx`
- Available throughout the application

## Best Practices

### 1. Use Custom Hooks
Instead of directly using React Query hooks, create custom hooks that encapsulate the logic for specific data needs.

### 2. Consistent Query Keys
Use descriptive and consistent query keys:
- Use arrays for complex keys: `['projects', projectId]`
- Prefix with resource name: `['projects']`, `['tasks']`

### 3. Error Handling
Always handle loading and error states appropriately in UI components.

### 4. Mutations for Updates
Use mutations for create/update/delete operations to ensure proper cache invalidation.

## Example Usage

### Using the Generic Supabase Hooks

```typescript
import { useSupabaseQuery, useCreateRecord, useUpdateRecord, useDeleteRecord } from "@/hooks/useSupabaseQuery";

// Fetching data
const { data: projects, isLoading, error } = useSupabaseQuery<Project>(
  'projects',
  'projects',
  'id, name, client, status, health_score, created_at',
  { /* filters */ }
);

// Creating records
const createMutation = useCreateRecord('projects');
const handleCreate = (newProject: Partial<Project>) => {
  createMutation.mutate(newProject);
};

// Updating records
const updateMutation = useUpdateRecord('projects');
const handleUpdate = (id: string, updates: Partial<Project>) => {
  updateMutation.mutate({ id, ...updates });
};

// Deleting records
const deleteMutation = useDeleteRecord('projects');
const handleDelete = (id: string) => {
  deleteMutation.mutate(id);
};
```

### Creating Page-Specific Hooks

For complex pages, create dedicated hooks:

```typescript
// src/hooks/useProjects.ts
import { useSupabaseQuery, useCreateRecord, useUpdateRecord, useDeleteRecord } from "./useSupabaseQuery";

export function useProjects() {
  return useSupabaseQuery<Project>(
    'projects',
    'projects',
    'id, name, client, status, health_score, created_at'
  );
}

export function useProjectMutations() {
  const queryClient = useQueryClient();
  
  const create = useCreateRecord('projects');
  const update = useUpdateRecord('projects');
  const remove = useDeleteRecord('projects');
  
  return { create, update, remove };
}
```

## Migration Guidelines

To migrate existing pages to use React Query:

1. Replace `useState` and `useEffect` for data fetching with `useSupabaseQuery`
2. Replace direct Supabase calls for mutations with the custom mutation hooks
3. Handle loading and error states using React Query's built-in states
4. Use optimistic updates where appropriate

## Benefits

1. **Automatic Caching**: Data is cached and reused efficiently
2. **Background Updates**: Stale data is refreshed in the background
3. **Deduplication**: Same requests are deduplicated
4. **Prefetching**: Data can be prefetched for better UX
5. **Pagination**: Built-in support for pagination
6. **Polling**: Automatic polling for real-time data