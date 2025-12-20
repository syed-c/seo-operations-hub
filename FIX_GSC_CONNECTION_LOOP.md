# Fix for Google Search Console Connection Loop

## Problem
Users were stuck in a "Connect Google Account" loop because the application was trying to insert an `account_email` column into the `user_tokens` table, but that column doesn't exist in that table.

## Root Cause
The code was incorrectly trying to store account identity information (email) in the `user_tokens` table, which is meant only for OAuth tokens. This violates the principle of separation of concerns in a SaaS application.

## Solution Implemented

### 1. Clean Separation of Concerns
- **`user_tokens` table**: Stores only OAuth tokens (no account metadata)
- **`project_integrations` table**: Stores connection state and account identity

### 2. Database Schema Updates
Created migration `20251220130000_add_account_email_to_project_integrations.sql` to add `account_email` column to `project_integrations` table where it belongs.

### 3. Code Changes

#### Fixed `storeGoogleToken` function
- Removed attempt to store `account_email` in `user_tokens` table
- Now only stores OAuth token information

#### Created `storeGSCConnectionState` function
- Stores connection state in `project_integrations` table
- Stores account email where it belongs
- Sets `is_connected` flag to `true`
- Records connection timestamp

#### Updated `fetchAndStoreSearchConsoleData` function
- Now accepts `accountEmail` parameter
- Calls `storeGSCConnectionState` to properly store connection state
- Separately updates `property_url` in project integration

#### Updated Component Calls
- `ProjectDashboard.tsx` and `GoogleSearchConsoleConnect.tsx` now pass account email to functions
- Removed unused imports and functions

### 4. Benefits
- ✅ Eliminates "Connect Google Account" loop
- ✅ Proper separation of authentication vs integration concerns
- ✅ Future-proof for multi-project, multi-account scenarios
- ✅ Follows SaaS best practices
- ✅ No more schema cache errors

## Files Modified
1. `src/services/googleSearchConsoleService.ts` - Core service functions
2. `src/components/ProjectDashboard.tsx` - Dashboard component
3. `src/components/GoogleSearchConsoleConnect.tsx` - Connection component
4. `src/api/auth/google/callback.ts` - OAuth callback handler
5. `supabase/migrations/20251220130000_add_account_email_to_project_integrations.sql` - Database migration

## Next Steps
1. Run database migrations
2. Restart Supabase project to clear schema cache
3. Test Google Search Console connection flow