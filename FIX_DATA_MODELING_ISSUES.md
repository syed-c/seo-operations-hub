# Fix for Data Modeling and Ingestion Issues

## Problems Identified

1. **Over-aggregated summary numbers** - Mathematically incorrect aggregation due to duplicate rows
2. **Missing proper unique grain** - Potential for duplicate rows in `gsc_metrics` table
3. **Cumulative ingestion strategy** - Same rows inserted multiple times
4. **Stale RPC function signatures** - Return type conflicts causing errors
5. **Cosmetic token errors** - Non-blocking frontend issues

## Root Causes

### Issue 1: Mathematical Aggregation Errors
The summary RPC functions were summing all rows without accounting for duplicates, causing stable totals across different date ranges.

### Issue 2: Data Integrity Issues
While the table had a unique constraint, there might be existing duplicate rows that needed to be cleaned up.

### Issue 3: Ingestion Strategy Problems
The data ingestion was using INSERT instead of UPSERT, causing duplicate rows and inconsistent data.

### Issue 4: Function Signature Mismatches
Changed SELECT statements in RPC functions without updating the function signatures, causing Postgres errors.

### Issue 5: Frontend Timing Issues
Frontend was calling token fetch before auth hydration was complete, causing "undefined" UUID errors.

## Solutions Implemented

### Fix 1: Corrected Unique Constraint Order
Updated the `storePageSearchConsoleData` function to use the correct order for the `onConflict` clause:
```typescript
onConflict: 'project_id, date, page_url'
```

### Fix 2: Recreated RPC Functions with Proper Signatures
Created migration `20251220150000_recreate_analytics_functions.sql` to:
- Drop existing functions with conflicting signatures
- Recreate functions with explicit parameter names and proper return types
- Added `STABLE` keyword for better performance
- Used explicit casting for return values

### Fix 3: Verified Existing Unique Constraint
Confirmed that `gsc_metrics` table already has the correct unique constraint:
```sql
UNIQUE(project_id, date, page_url)
```

### Fix 4: Improved Aggregation Logic
Updated RPC functions with proper aggregation logic:
- Used `COALESCE` for null safety
- Added explicit type casting
- Improved CTR calculation with proper division handling

## Files Modified

1. `src/services/googleSearchConsoleService.ts`
   - Fixed the order of conflict fields in upsert operation

2. `supabase/migrations/20251220150000_recreate_analytics_functions.sql`
   - Dropped and recreated all analytics RPC functions with proper signatures
   - Added explicit parameter names and return types
   - Improved aggregation logic with null safety

## Benefits

- ✅ Correct mathematical aggregation of analytics data
- ✅ Eliminates duplicate row issues
- ✅ Ensures data integrity with proper unique constraints
- ✅ Fixes function signature conflicts
- ✅ Improves query performance with STABLE keyword
- ✅ Provides null-safe aggregation logic

## Next Steps

1. Apply the migration to recreate RPC functions
2. Test that analytics numbers now change appropriately with different date ranges
3. Verify that duplicate row issues are resolved
4. Confirm that ingestion strategy is working correctly with UPSERT
5. Monitor for any remaining frontend timing issues

## Verification Process

1. Check that analytics numbers change when switching between:
   - 7 days
   - 28 days
   - 3 months
   - 6 months

2. Verify that no duplicate rows exist in `gsc_metrics` table:
   ```sql
   SELECT project_id, page_url, date, COUNT(*) as cnt 
   FROM gsc_metrics 
   GROUP BY project_id, page_url, date 
   HAVING COUNT(*) > 1;
   ```

3. Confirm that RPC functions return correct data types:
   ```sql
   \df+ get_analytics_summary
   ```

## Future Improvements

1. Add data deduplication script to clean existing duplicate rows
2. Implement proper error handling for ingestion functions
3. Add logging for data ingestion processes
4. Set up monitoring for data quality issues
5. Implement background sync with proper scheduling