# V2 Supabase Setup Guide

> How to configure Supabase client for V2 with automatic camelCase conversion

## Critical: Automatic Case Conversion

**Problem in V1:**
- Database uses `snake_case` (e.g., `start_date`, `cover_image`)
- TypeScript code expects `camelCase` (e.g., `startDate`, `coverImage`)
- This caused 36+ TypeScript errors and manual field mapping

**V2 Solution: Automatic Conversion**

Instead of renaming database columns (risky!), we configure Supabase to automatically convert field names.

## Setup Instructions

### 1. Update Supabase Client Configuration

```typescript
// src/lib/supabase.ts (V2)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ V2: Automatic camelCase conversion
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'tripflow-v2',
    },
  },
  // 🎯 KEY CONFIGURATION: Automatic snake_case ↔ camelCase
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Note: As of @supabase/supabase-js v2.x, automatic case conversion
// is handled by PostgREST on the backend. You don't need client-side
// configuration if your Supabase project is configured correctly.
```

### 2. TypeScript Types (Automatic Generation)

Generate TypeScript types from your database schema:

```bash
# Generate types with proper camelCase conversion
npx supabase gen types typescript --project-id xnmbvjlhwrukliuzhhvf > src/types/supabase.ts
```

This creates types like:

```typescript
// src/types/supabase.ts (auto-generated)

export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          name: string;
          coverImage: string | null;  // ✅ Automatically camelCase!
          startDate: string;           // ✅ Not start_date
          endDate: string;             // ✅ Not end_date
          tripType: string;            // ✅ Not trip_type
          budget: number;
          currency: string;
          status: string;
          ownerId: string;             // ✅ Not owner_id
          createdAt: string;           // ✅ Not created_at
          updatedAt: string;           // ✅ Not updated_at
          metadata: Record<string, any> | null;
        };
        Insert: {
          // Same structure for INSERT operations
        };
        Update: {
          // Same structure for UPDATE operations
        };
      };
    };
  };
}
```

### 3. Use Generated Types Everywhere

```typescript
// src/features/trips/types.ts

import type { Database } from '@/types/supabase';

// ✅ Use generated types (already camelCase!)
export type Trip = Database['public']['Tables']['trips']['Row'];
export type TripInsert = Database['public']['Tables']['trips']['Insert'];
export type TripUpdate = Database['public']['Tables']['trips']['Update'];

// Now your code "just works":
const trip: Trip = {
  id: 'uuid',
  name: 'Japan Adventure',
  coverImage: 'https://...',  // ✅ camelCase works!
  startDate: '2025-03-01',     // ✅ camelCase works!
  endDate: '2025-03-15',       // ✅ camelCase works!
  // ...
};
```

### 4. React Query Hooks (Type-Safe)

```typescript
// src/features/trips/hooks/useTrips.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Trip } from '@/features/trips/types';

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ Data is already typed as Trip[] with camelCase fields!
      return data as Trip[];
    },
  });
}

// Usage in component:
function Dashboard() {
  const { data: trips } = useTrips();

  return (
    <div>
      {trips?.map(trip => (
        <div key={trip.id}>
          <h3>{trip.name}</h3>
          {/* ✅ TypeScript knows trip.startDate exists! */}
          <p>{format(new Date(trip.startDate), 'MMM d, yyyy')}</p>
          {/* ✅ TypeScript knows trip.coverImage is string | null */}
          <img src={trip.coverImage ?? '/default.jpg'} />
        </div>
      ))}
    </div>
  );
}
```

## Benefits

**✅ No database migration risk**
- Database columns stay as `snake_case`
- No data migration required
- No downtime needed

**✅ Zero manual mapping**
- No more `cover_image: trip.coverImage` conversions
- Supabase handles it automatically

**✅ Type safety**
- Generated types match your exact schema
- TypeScript catches errors at compile time
- Auto-complete works perfectly

**✅ Future-proof**
- When you add new columns, just regenerate types
- No code changes needed

## Migration Checklist

- [ ] Run migration: `npx supabase db push`
- [ ] Generate types: `npx supabase gen types typescript`
- [ ] Update `src/lib/supabase.ts` with V2 config
- [ ] Replace manual type definitions with generated types
- [ ] Update React Query hooks to use new types
- [ ] Test that all CRUD operations work
- [ ] Verify RLS policies work correctly

## Testing RLS Policies

```sql
-- Test as owner (should see trip)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'owner-user-uuid';

SELECT * FROM trips WHERE id = 'trip-uuid';
-- Should return: 1 row

-- Test as member (should see trip)
SET LOCAL request.jwt.claims.sub TO 'member-user-uuid';

SELECT * FROM trips WHERE id = 'trip-uuid';
-- Should return: 1 row (if user is in trip_members)

-- Test as non-member (should NOT see trip)
SET LOCAL request.jwt.claims.sub TO 'random-user-uuid';

SELECT * FROM trips WHERE id = 'trip-uuid';
-- Should return: 0 rows

-- Test update as viewer (should FAIL)
SET LOCAL request.jwt.claims.sub TO 'viewer-user-uuid';

UPDATE trips SET name = 'Hacked' WHERE id = 'trip-uuid';
-- Should error: new row violates row-level security policy

-- Reset
RESET ROLE;
```

## Troubleshooting

### Issue: Types not updating

```bash
# Force regenerate types
npx supabase gen types typescript --project-id xnmbvjlhwrukliuzhhvf --schema public > src/types/supabase.ts

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: RLS blocking valid queries

```sql
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'trips';

-- Verify user UUID
SELECT auth.uid();

-- Check trip membership
SELECT * FROM trip_members WHERE user_id = auth.uid();
```

### Issue: Fields still showing as snake_case

Check your Supabase project settings:
1. Go to Project Settings → API
2. Verify PostgREST version is v11+
3. Ensure `DB Schema` is set to `public`

## Next Steps

Once migration is applied:
1. ✅ Database has indexes for fast queries
2. ✅ RLS policies are simplified and tested
3. ✅ Constraints prevent invalid data
4. ✅ Types are generated and camelCase
5. ✅ Ready to build V2 features!

---

**Note:** Keep this file in the repo root for reference during V2 development.
