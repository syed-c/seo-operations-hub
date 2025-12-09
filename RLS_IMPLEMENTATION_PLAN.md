# Row Level Security (RLS) Implementation Plan

## Overview
This document outlines the implementation of Row Level Security (RLS) for the SEO Operations Hub to ensure multi-tenant security on Supabase. RLS will restrict data access based on user roles and tenant/project membership.

## Key Principles
1. **Multi-tenancy**: Users can only access data belonging to their projects
2. **Role-based Access Control**: Different roles have different levels of access
3. **Data Isolation**: One tenant's data is completely isolated from another's
4. **Least Privilege**: Users get the minimum access necessary to perform their job

## Database Schema Analysis
Based on the technical documentation, the key tables are:
- `users` - User accounts
- `roles` - User roles (Super Admin, Admin, SEO Lead, etc.)
- `projects` - Core organizational unit
- `websites`, `pages`, `keywords` - Project-related data
- `tasks`, `audits`, `backlinks` - Work items
- `reports`, `insights` - Output data

## RLS Implementation Strategy

### 1. Users Table
```sql
-- Enable RLS
alter table users enable row level security;

-- Users can read their own record
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

-- Users can update their own profile (limited fields)
create policy "Users can update own profile" on users
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can manage all users (via Edge Functions for sensitive operations)
```

### 2. Projects Table
```sql
-- Enable RLS
alter table projects enable row level security;

-- Users can view projects they belong to
create policy "Users can view projects they belong to" on projects
  for select using (
    id in (
      select project_id from project_members 
      where user_id = auth.uid()
    )
  );

-- Users can insert projects they're authorized to create
create policy "Authorized users can create projects" on projects
  for insert with check (
    exists (
      select 1 from users 
      where id = auth.uid() 
      and role in (
        select name from roles 
        where name in ('Super Admin', 'Admin', 'SEO Lead')
      )
    )
  );

-- Project owners can update their projects
create policy "Project owners can update projects" on projects
  for update using (
    id in (
      select project_id from project_members 
      where user_id = auth.uid() 
      and role = 'owner'
    )
  );
```

### 3. Project Members Junction Table
```sql
-- Enable RLS
alter table project_members enable row level security;

-- Users can view project memberships for projects they belong to
create policy "Members can view project memberships" on project_members
  for select using (
    project_id in (
      select project_id from project_members 
      where user_id = auth.uid()
    )
  );

-- Project owners can manage memberships
create policy "Project owners can manage memberships" on project_members
  for all using (
    project_id in (
      select project_id from project_members 
      where user_id = auth.uid() 
      and role = 'owner'
    )
  );
```

### 4. Project-Related Data Tables (websites, pages, keywords, etc.)
```sql
-- Generic pattern for project-related tables
alter table websites enable row level security;

create policy "Users can access project websites" on websites
  for all using (
    project_id in (
      select project_id from project_members 
      where user_id = auth.uid()
    )
  );
```

## Roles and Permissions Matrix

| Role | Projects | Websites | Pages | Keywords | Tasks | Audits | Backlinks | Reports |
|------|----------|----------|-------|----------|-------|--------|-----------|---------|
| Super Admin | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| Admin | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| SEO Lead | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | R |
| Content Lead | R/W own | R/W own | R/W own | R/W own | R/W own | R | R | R |
| Backlink Lead | R/W backlinks | - | - | - | R/W backlink tasks | R | CRUD | R |
| Developer | R/W assigned | R/W assigned | R/W assigned | R/W assigned | R/W assigned | R/W assigned | R/W assigned | R |
| Client | R | R | R | R | R | R | R | R |

## Implementation Steps

### Phase 1: Core Infrastructure
1. Create project_members junction table if it doesn't exist
2. Add RLS policies to users and projects tables
3. Test basic access controls

### Phase 2: Project Data Tables
1. Add RLS to websites, pages, keywords tables
2. Implement ownership tracking
3. Test data isolation

### Phase 3: Work Items
1. Add RLS to tasks, audits, backlinks tables
2. Implement assignment-based access
3. Test role-based permissions

### Phase 4: Output Data
1. Add RLS to reports, insights tables
2. Implement read-only restrictions for clients
3. Test data protection

## Security Considerations

1. **Admin Operations**: Use Edge Functions for operations that bypass RLS
2. **Data Migration**: Ensure existing data conforms to new access rules
3. **Testing**: Comprehensive testing of all role combinations
4. **Monitoring**: Log access violations for security auditing

## Deployment Checklist

- [ ] Enable RLS on all tables
- [ ] Create appropriate policies for each table
- [ ] Test with different user roles
- [ ] Validate data isolation
- [ ] Document exceptions and admin procedures
- [ ] Train developers on RLS patterns