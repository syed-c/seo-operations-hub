# Database Migrations

This directory contains the SQL migrations for the SEO Operations Hub database.

## Migration Order

1. `20251209144500_setup_database_and_rls.sql` - Combined migration that creates the canonical database schema and implements Row Level Security policies

Note: The previous separate migrations (`20251209142000_implement_rls_policies.sql` and `20251209142500_create_canonical_schema.sql`) have been superseded by this combined migration to ensure proper table creation order.

## Deployment Instructions

To deploy these migrations to your Supabase instance:

1. Ensure Supabase Auth is enabled (auth.users table must exist)
2. Run the migrations in order using the Supabase CLI:

```bash
supabase migration up
```

Or deploy the specific migration:

```bash
supabase migration up 20251209144500
```

For Phase 2 features:

```bash
supabase migration up 20251209160000
```

## Prerequisites

- Supabase Auth must be enabled
- Supabase CLI must be installed and configured
- Proper database connection settings

## Troubleshooting

If you encounter errors:

1. **Column does not exist**: Make sure migrations are run in the correct order
2. **Table does not exist**: Ensure Supabase Auth is properly enabled
3. **Permission denied**: Check that you're using the correct database user with sufficient privileges

## Notes

- These migrations use `IF NOT EXISTS` clauses to prevent errors on re-run
- RLS policies are applied to existing tables and will not affect data
- The schema is designed for multi-tenant architecture with proper data isolation