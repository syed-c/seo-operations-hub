# Fix for Supabase Import Issues and Function Usage

## Problems Identified

1. **ReferenceError: supabase is not defined** - Components using `supabase` without importing it
2. **Wrong analytics function being called** - Using direct table query instead of RPC function

## Root Causes

### Issue 1: Missing Supabase Imports
The components `ProjectDashboard.tsx` and `GoogleSearchConsoleConnect.tsx` were trying to use `supabase` directly without importing it from the Supabase client module.

### Issue 2: Incorrect Function Usage
The `SearchConsoleAnalytics.tsx` component was calling `getPropertyAnalyticsSummary` which queries the `gsc_property_metrics` table directly, instead of using `getAnalyticsSummary` which calls the RPC function that queries `gsc_metrics` table.

## Solutions Implemented

### Fix 1: Added Missing Supabase Imports
Updated both components to import `supabase` from the client module:
```typescript
import { supabase } from '@/lib/supabaseClient';
```

### Fix 2: Corrected Function Usage
Updated `SearchConsoleAnalytics.tsx` to use the RPC-based function:
- Changed import from `getPropertyAnalyticsSummary` to `getAnalyticsSummary`
- Updated function call from `getPropertyAnalyticsSummary()` to `getAnalyticsSummary()`

## Files Modified

1. `src/components/ProjectDashboard.tsx`
   - Added import for `supabase` client

2. `src/components/GoogleSearchConsoleConnect.tsx`
   - Added import for `supabase` client

3. `src/components/SearchConsoleAnalytics.tsx`
   - Changed import from `getPropertyAnalyticsSummary` to `getAnalyticsSummary`
   - Updated function call to use RPC-based function

## Benefits

- ✅ Eliminates "supabase is not defined" errors
- ✅ Uses correct RPC functions that we've updated to remove date filters
- ✅ Ensures dashboard queries the right table (`gsc_metrics`)
- ✅ Maintains consistency with our temporary debugging approach

## Next Steps

1. Apply the temporary migration to remove date filters from RPC functions
2. Test that dashboard now shows data without errors
3. Once confirmed working, re-implement proper date filtering with correct logic
4. Add "last synced" timestamp display
5. Implement background sync cron jobs

## Verification Process

1. Check browser console for "supabase is not defined" errors (should be gone)
2. Verify dashboard shows data after applying temporary migration
3. Confirm that analytics functions are being called correctly

## Future Improvements

1. Add proper error handling for Supabase client usage
2. Implement proper date range handling with timezone awareness
3. Add "last synced" timestamp display
4. Set up background sync cron jobs for automatic data refresh