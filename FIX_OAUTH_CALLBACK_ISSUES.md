# Fix for OAuth Callback Issues

## Problems Identified

1. **Duplicate key value violates unique constraint** error on `user_tokens_user_id_provider_key`
2. **Invalid input syntax for type uuid: "undefined"** error
3. **Redeclaration of const storeGSCConnectionState** error

## Root Causes

### Issue 1: Duplicate Key Constraint Violation
The `storeGoogleToken` function was using `upsert` but missing the `onConflict` parameter, causing Postgres to attempt an INSERT instead of an UPSERT when a row already exists.

### Issue 2: Undefined Values
Input validation was missing for critical parameters like `userId`.

### Issue 3: Duplicate Function Declaration
There were two identical declarations of the `storeGSCConnectionState` function.

## Solutions Implemented

### Fix 1: Proper UPSERT for User Tokens
Updated `storeGoogleToken` function in `/src/services/googleSearchConsoleService.ts`:
- Added `onConflict: 'user_id,provider'` parameter to ensure proper upsert behavior
- Added input validation for `userId`
- Added `updated_at` timestamp

### Fix 2: Input Validation
Added validation checks in `storeGoogleToken` function:
```typescript
if (!userId) {
  throw new Error('Missing userId in OAuth callback');
}
```

### Fix 3: OAuth State Parameter
Updated `initGoogleAuth` function to encode project ID in the OAuth state parameter:
- Modified function signature to accept `projectId`
- Encodes project ID in base64 JSON in the `state` parameter
- Passes state to Google OAuth endpoint

### Fix 4: Component Updates
Updated `GoogleSearchConsoleConnect.tsx`:
- Modified `handleConnect` to pass project ID to `initGoogleAuth`

### Fix 5: Duplicate Function Removal
Removed duplicate `storeGSCConnectionState` function declaration.

## Files Modified

1. `src/services/googleSearchConsoleService.ts` - Fixed upsert, added validation, updated OAuth flow
2. `src/components/GoogleSearchConsoleConnect.tsx` - Updated component to pass project ID
3. `src/api/auth/google/callback.ts` - Added input validation
4. Removed duplicate function declaration

## Benefits

- ✅ Eliminates duplicate key constraint violations
- ✅ Prevents undefined value errors
- ✅ Resolves function redeclaration issues
- ✅ Ensures proper token rotation instead of duplication
- ✅ Makes OAuth flow deterministic and SaaS-safe
- ✅ Supports multi-project and multi-account scenarios

## Next Steps

1. Clear Supabase schema cache:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
2. Test OAuth flow multiple times to ensure no errors
3. Verify project integration state is properly stored
4. Confirm no more infinite redirect loops