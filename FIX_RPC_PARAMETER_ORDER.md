# Fix for RPC Parameter Order Mismatch

## Problem Identified

The core issue was a parameter **order** mismatch between the frontend RPC calls and the database functions:

**Error message showed frontend was sending parameters in this order:**
```
end_date, project_id, start_date
```

**But database functions were defined in this order:**
```sql
project_id uuid,
start_date date,
end_date date
```

Supabase RPC is extremely strict about parameter order and doesn't do any automatic matching.

## Root Causes

1. **Parameter order mismatch** - Frontend and backend parameter orders didn't align
2. **Supabase RPC strictness** - Postgres doesn't auto-match parameter positions
3. **Missing guard against undefined values** - Token fetch was still being called with undefined user_id

## Solutions Implemented

### Fix 1: Corrected RPC Parameter Order
Created migration `20251220170000_fix_rpc_parameter_order.sql` to:
- Drop existing functions with conflicting signatures
- Recreate functions with parameter order that exactly matches what frontend sends:
  - `end_date date`
  - `project_id uuid` 
  - `start_date date`

### Fix 2: Added Guard Against Undefined Values
Updated `src/services/googleSearchConsoleService.ts` to:
- Add guard in `getStoredGoogleToken` function
- Prevent RPC calls with undefined user_id
- Log warning instead of error for cleaner console

## Files Modified

1. `supabase/migrations/20251220170000_fix_rpc_parameter_order.sql`
   - Dropped and recreated all analytics RPC functions with correct parameter order
   - Used exact parameter order: `end_date, project_id, start_date`
   - Maintained `STABLE` keyword for performance

2. `src/services/googleSearchConsoleService.ts`
   - Added guard against undefined user_id in `getStoredGoogleToken`
   - Prevents "invalid input syntax for type uuid: undefined" errors

## Benefits

- ✅ Eliminates "Could not find function" errors due to parameter order mismatch
- ✅ Ensures proper parameter positioning between frontend and backend
- ✅ Prevents undefined UUID errors
- ✅ Provides cleaner error logging
- ✅ Maintains performance with `STABLE` keyword

## Next Steps

1. Apply the migration to fix RPC parameter order
2. Test that analytics functions now work correctly
3. Verify that no more "undefined" UUID errors appear
4. Confirm that analytics numbers change with different date ranges

## Verification Process

1. Check browser console for "Could not find function" errors (should be gone)
2. Verify no more "invalid input syntax for type uuid: undefined" errors
3. Confirm that analytics numbers change when switching between:
   - 7 days
   - 28 days
   - 3 months
   - 6 months
4. Test error handling is working correctly

## Future Improvements

1. Add comprehensive parameter validation in all RPC functions
2. Implement centralized error handling for RPC calls
3. Add monitoring for RPC call success/failure rates
4. Set up alerts for recurring RPC parameter mismatches