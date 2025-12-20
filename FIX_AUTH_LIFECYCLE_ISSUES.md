# Fix for Authentication Lifecycle Issues

## Problems Identified

1. **Invalid input syntax for type uuid: "undefined"** - Components querying Supabase before auth context is ready
2. **Components accessing user_tokens directly** - Security and timing issues
3. **Undefined project/user IDs** - Causing database constraint violations

## Root Causes

### Issue 1: React Lifecycle Timing
Components were querying Supabase before the authentication context was fully resolved, resulting in `undefined` values being passed as UUIDs.

### Issue 2: Direct Access to User Tokens
Components were directly accessing the `user_tokens` table from the frontend, which is a security risk and causes timing issues.

### Issue 3: Missing Guards
No validation checks to ensure project and user IDs exist before making database queries.

## Solutions Implemented

### Fix 1: Guard Against Undefined Values
Updated both `ProjectDashboard.tsx` and `GoogleSearchConsoleConnect.tsx` to:
- Add guards checking for `selectedProject`, `selectedProject.id`, and `selectedProject.user_id`
- Prevent queries when these values are undefined

### Fix 2: Remove Direct User Tokens Access
- Removed direct imports of `getStoredGoogleToken` from module level
- Dynamically import the function only when needed
- Focus on checking only `project_integrations.is_connected` for UI state

### Fix 3: Proper Integration State Checking
- Updated components to query only the `project_integrations` table
- Check only the `is_connected` field for determining connection status
- Removed redundant token checks that were causing timing issues

### Fix 4: Dynamic Imports
- Used dynamic imports for token-related functions to avoid module-level imports
- This ensures functions are only loaded when auth context is ready

## Files Modified

1. `src/components/ProjectDashboard.tsx`
   - Removed direct import of `getStoredGoogleToken`
   - Added guards for undefined project/user IDs
   - Updated checkGoogleConnection to only query integration state
   - Updated handleFetchData to dynamically import token functions

2. `src/components/GoogleSearchConsoleConnect.tsx`
   - Removed direct import of `getStoredGoogleToken`
   - Added guards for undefined project/user IDs
   - Updated checkConnection to only query integration state first
   - Updated fetchAnalyticsData to dynamically import token functions

## Benefits

- ✅ Eliminates "invalid input syntax for type uuid: undefined" errors
- ✅ Prevents frontend access to sensitive token data
- ✅ Ensures queries only run when auth context is ready
- ✅ Makes OAuth flow deterministic and SaaS-safe
- ✅ Reduces unnecessary database queries
- ✅ Improves security by limiting frontend data access

## Next Steps

1. Clear bad state from database:
   ```sql
   DELETE FROM user_tokens WHERE provider = 'google';
   DELETE FROM project_integrations WHERE provider = 'google_search_console';
   ```

2. Reconnect Google account once

3. Test that "Connect Google Account" no longer appears after successful connection

4. Verify no more infinite redirect loops or undefined UUID errors