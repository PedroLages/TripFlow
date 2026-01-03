# Authentication & Permission Frameworks for TripFlow

> Research on modern auth/permission frameworks adapted for TripFlow's collaborative trip planning architecture

**Last Updated**: 2026-01-03
**Status**: Recommendations based on 2025-2026 best practices

## Executive Summary

TripFlow currently uses **Supabase Auth + Row Level Security (RLS)** for authentication and authorization. Based on 2025-2026 research, this remains the recommended approach, with potential enhancements for permission management as the app scales.

## Current Architecture

### What We Have

- **Authentication**: Supabase Auth with Google OAuth, Magic Link, and Anonymous auth
- **Authorization**: PostgreSQL Row Level Security (RLS) policies
- **Permission Model**: Simple role-based (Owner, Editor, Viewer) per trip
- **User Flows**: OAuth redirects with hash-based routing, sessionStorage state management

### Current Strengths

✅ **Database-native security**: RLS provides defense-in-depth at the database level
✅ **TypeScript type safety**: All auth types defined in [types.ts](../../types.ts)
✅ **Real-time sync**: Supabase handles auth state changes automatically
✅ **OAuth integration**: Google avatars and profile data imported seamlessly

### Current Limitations

⚠️ **Simple RBAC**: Only three roles (Owner, Editor, Viewer) - no granular permissions
⚠️ **No attribute-based rules**: Cannot enforce permissions based on trip status, dates, or other attributes
⚠️ **Limited delegation**: Cannot temporarily grant/revoke specific permissions
⚠️ **Policy complexity**: RLS policies can become hard to maintain as features grow

## Modern Framework Options

### Option 1: Continue with Supabase Auth + Enhanced RLS (Recommended)

**When to use**: For most web applications where RBAC meets requirements.

**Why this works for TripFlow**:
- Already integrated - no migration needed
- Native TypeScript support with generated types
- Real-time auth state changes
- Built-in OAuth providers (Google, GitHub, etc.)
- RLS policies enforce security at database level

**Improvements to consider**:
1. **Add more granular roles**: `trip_admin`, `budget_editor`, `itinerary_planner`, `read_only`
2. **Implement attribute-based rules**:
   - Lock budget editing after trip starts
   - Restrict document deletion based on trip status
   - Time-based permissions (e.g., only edit during trip planning phase)
3. **Helper functions for common checks**: Create `can_edit_budget()`, `can_invite_members()` functions
4. **Policy optimization**: Index columns used in RLS policies, avoid heavy subqueries

**Resources**:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Best Practices](https://www.leanware.co/insights/supabase-best-practices)
- [Multi-Tenant RLS Patterns](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)

### Option 2: Add Client-Side Permission Library (CASL or react-abac)

**When to use**: When you need fine-grained UI permissions but RLS handles database security.

**Libraries**:
- **CASL**: Declarative abilities, TypeScript support, 17k+ stars
- **react-abac**: Attribute-based access control for React, TypeScript enums

**Example Use Case**:
```typescript
// Define abilities based on user role and trip attributes
const ability = defineAbilityFor(user, trip);

// Use in components
{ability.can('edit', 'Budget') && <EditBudgetButton />}
{ability.can('delete', 'Document', document) && <DeleteIcon />}

// Attribute-based rules
ability.can('edit', 'Budget', { when: trip.status === 'planning' });
ability.can('approve', 'Expense', { when: expense.amount < userRole.approvalLimit });
```

**Why consider this**:
- Hide/show UI elements based on complex permission logic
- Better UX - users don't see actions they can't perform
- Type-safe permission checks in TypeScript
- Client-side only - RLS still enforces database security

**Trade-offs**:
- Additional library dependency
- Need to sync permission logic between client and database
- More complex permission testing

**Resources**:
- [CASL vs ABAC vs ReBAC Comparison](https://blog.webdevsimplified.com/2025-11/rbac-vs-abac-vs-rebac/)
- [React RBAC Implementation Guide](https://www.permit.io/blog/implementing-react-rbac-authorization)

### Option 3: External Authorization Service (Permit.io, Cerbos, Casbin)

**When to use**: When building complex multi-tenant SaaS or need centralized policy management.

**Services**:
- **Permit.io**: Full-service RBAC/ABAC platform with React SDK
- **Cerbos**: Policy decision point with playground for testing
- **Casbin**: Open-source authorization library (ACL, RBAC, ABAC, ReBAC)
- **ZenStack**: Full-stack TypeScript toolkit enhancing Prisma ORM

**Why consider this**:
- Centralized policy management across multiple apps
- Policy versioning and audit trails
- No-code policy editor for non-developers
- Advanced features: delegation, temporary grants, approval workflows

**Why NOT for TripFlow (currently)**:
- Overkill for current scale
- Additional infrastructure complexity
- Monthly costs (for hosted services)
- Learning curve for team
- TripFlow isn't multi-tenant SaaS (yet)

**Consider when**:
- Building white-label trip planning for travel agencies
- Need to offer TripFlow as a service to other organizations
- Require complex approval workflows (e.g., company expense approvals)
- Need to audit "who can do what" across entire platform

**Resources**:
- [Casbin Authorization Library](https://casbin.org/)
- [Cerbos Policy Playground](https://www.cerbos.dev/blog/how-to-use-react-js-for-secure-role-based-access-control)
- [Node.js Access Control Libraries](https://dev.to/zenstack/authorize-users-like-a-pro-libraries-that-help-you-implement-access-control-with-nodejs-5109)

## Recommended Approach for TripFlow

### Phase 1: Enhance Current RLS (Immediate)

1. **Add more specific roles** in `trip_members` table:
   - `owner` - Full control
   - `admin` - Can manage members and settings
   - `budget_manager` - Can edit budgets and expenses
   - `editor` - Can edit itinerary and documents
   - `viewer` - Read-only access

2. **Create helper functions** for common permission checks:
   ```sql
   -- Check if user can edit trip budgets
   CREATE FUNCTION can_edit_budget(p_trip_id UUID) RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM trip_members
       WHERE trip_id = p_trip_id
         AND user_id = auth.uid()
         AND role IN ('owner', 'admin', 'budget_manager', 'editor')
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
   ```

3. **Add attribute-based rules** in RLS policies:
   ```sql
   -- Only allow budget edits during planning phase
   CREATE POLICY "Budget edits require planning status"
     ON expenses FOR UPDATE
     USING (
       can_edit_budget(trip_id)
       AND (SELECT status FROM trips WHERE id = trip_id) = 'planning'
     );
   ```

4. **Optimize RLS performance**:
   - Index all columns used in policies (`trip_id`, `user_id`, `role`)
   - Use `SECURITY DEFINER` functions to prevent infinite recursion
   - Add explicit filters even when policies apply them

### Phase 2: Add Client-Side Permissions (As Needed)

**Consider adding CASL when**:
- Users complain about seeing buttons they can't use
- Need to show/hide features based on subscription tier
- Want to disable actions based on trip status or dates

**Implementation**:
```typescript
// src/lib/permissions.ts
import { defineAbility } from '@casl/ability';
import type { Trip, User } from './types';

export function defineAbilitiesFor(user: User, trip: Trip) {
  return defineAbility((can, cannot) => {
    // Everyone can view
    can('view', 'Trip');

    // Owners can do everything
    if (trip.owner_id === user.id) {
      can('manage', 'all');
      return;
    }

    // Get user's role in this trip
    const membership = trip.members.find(m => m.user_id === user.id);
    if (!membership) {
      cannot('manage', 'all');
      return;
    }

    // Role-based permissions
    switch (membership.role) {
      case 'admin':
        can('manage', 'Trip');
        can('invite', 'Member');
        can('edit', 'Budget');
        break;
      case 'budget_manager':
        can('edit', 'Budget');
        can('create', 'Expense');
        break;
      case 'editor':
        can('edit', 'Itinerary');
        can('upload', 'Document');
        break;
      case 'viewer':
        can('view', 'all');
        break;
    }

    // Attribute-based rules
    if (trip.status === 'archived') {
      cannot('edit', 'all');
    }
  });
}
```

### Phase 3: Consider External Service (Future)

**Only if TripFlow becomes**:
- Multi-tenant SaaS for travel agencies
- White-label solution for organizations
- Requires complex approval workflows

## Performance Considerations

### RLS Performance Tips

1. **Always add explicit filters** even when policies apply:
   ```typescript
   // ❌ Bad - relies solely on RLS
   const { data } = await supabase.from('expenses').select('*');

   // ✅ Good - helps Postgres optimize query plan
   const { data } = await supabase
     .from('expenses')
     .select('*')
     .eq('trip_id', tripId);
   ```

2. **Index policy columns**:
   ```sql
   CREATE INDEX idx_trip_members_user_trip ON trip_members(user_id, trip_id);
   CREATE INDEX idx_trip_members_role ON trip_members(role);
   ```

3. **Avoid heavy subqueries in policies** - use `SECURITY DEFINER` functions instead

4. **Store frequently-checked attributes in JWT claims** for faster policy evaluation

### Client-Side Performance

- Memoize ability calculations: `useMemo(() => defineAbilitiesFor(user, trip), [user, trip])`
- Cache permission checks for expensive operations
- Use React Context to avoid prop drilling of abilities

## Security Best Practices

### Defense in Depth

> "The frontend isn't your fortress, it's your storefront. Use access control to guide users, not guard the gates."

**Always enforce security at multiple layers**:

1. **Database (RLS)**: Primary security boundary - never trust the client
2. **Edge Functions**: Validate permissions before processing
3. **Frontend (CASL)**: UX enhancement - hide unavailable actions

### Never Trust the Client

```typescript
// ❌ Bad - checking permissions client-side only
if (userRole === 'admin') {
  await supabase.from('trips').delete().eq('id', tripId);
}

// ✅ Good - RLS policy enforces at database level
// Even if client bypasses check, database blocks unauthorized deletes
await supabase.from('trips').delete().eq('id', tripId);
// RLS policy: USING (auth.uid() = owner_id)
```

### Type Safety

Use TypeScript enums for roles:
```typescript
export enum TripRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  BUDGET_MANAGER = 'budget_manager',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

// Benefits:
// - Autocomplete in IDE
// - Compile-time validation
// - Refactoring safety
// - Self-documenting code
```

## Testing Recommendations

### RLS Policy Testing

```sql
-- Test as different users
SET request.jwt.claims = '{"sub": "user-id-here"}';

-- Verify policies block unauthorized access
SELECT * FROM trips WHERE id = 'some-trip-id';
-- Should only return trips user has access to

-- Verify policies allow authorized access
SELECT * FROM trip_members WHERE trip_id = 'some-trip-id';
-- Should return member records user can see
```

### Permission Testing (with CASL)

```typescript
import { defineAbilitiesFor } from './permissions';

describe('Trip permissions', () => {
  it('owners can delete trips', () => {
    const ability = defineAbilitiesFor(owner, trip);
    expect(ability.can('delete', 'Trip')).toBe(true);
  });

  it('viewers cannot edit budgets', () => {
    const ability = defineAbilitiesFor(viewer, trip);
    expect(ability.can('edit', 'Budget')).toBe(false);
  });

  it('archived trips cannot be edited', () => {
    const archivedTrip = { ...trip, status: 'archived' };
    const ability = defineAbilitiesFor(editor, archivedTrip);
    expect(ability.can('edit', 'Itinerary')).toBe(false);
  });
});
```

## Migration Path

### If Adding CASL

1. **Install dependencies**:
   ```bash
   npm install @casl/ability @casl/react
   ```

2. **Define abilities** (see Phase 2 implementation above)

3. **Create React context**:
   ```typescript
   import { createContextualCan } from '@casl/react';
   export const AbilityContext = createContext<AppAbility>(null!);
   export const Can = createContextualCan(AbilityContext.Consumer);
   ```

4. **Wrap app with provider**:
   ```typescript
   <AbilityContext.Provider value={ability}>
     <TripDetail trip={trip} />
   </AbilityContext.Provider>
   ```

5. **Use in components**:
   ```typescript
   import { Can } from './AbilityContext';

   <Can I="edit" a="Budget">
     <EditBudgetButton />
   </Can>
   ```

## Conclusion

**For TripFlow's current needs**:

✅ **Continue using Supabase Auth + RLS** - it's the right foundation
✅ **Enhance with more granular roles** - add admin, budget_manager, etc.
✅ **Add helper functions** for common permission checks
✅ **Optimize RLS policies** for performance
⏳ **Consider CASL** when UI permission logic becomes complex
❌ **Skip external services** until you're building multi-tenant SaaS

The best authorization model is the simplest one that meets your requirements. Start simple, optimize as needed, and only add complexity when the current approach becomes limiting.

## Sources

**Authentication & Supabase**:
- [Supabase Auth with React](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Best Authentication Frameworks for 2025](https://dev.to/syedsakhiakram66/7-best-authentication-frameworks-for-2025-free-paid-compared-159g)
- [Top 3 Authentication Frameworks for 2025](https://dev.to/martygo/top-3-best-authentication-frameworks-for-2025-51ej)
- [Supabase Review 2026](https://hackceleration.com/supabase-review/)

**RBAC vs ABAC vs ReBAC**:
- [RBAC vs ABAC vs ReBAC Comparison](https://blog.webdevsimplified.com/2025-11/rbac-vs-abac-vs-rebac/)
- [Implementing RBAC in React](https://www.permit.io/blog/implementing-react-rbac-authorization)
- [react-abac on npm](https://www.npmjs.com/package/react-abac)
- [Casbin Authorization Library](https://casbin.org/)
- [Cerbos RBAC for React](https://www.cerbos.dev/blog/how-to-use-react-js-for-secure-role-based-access-control)
- [Node.js Access Control Libraries](https://dev.to/zenstack/authorize-users-like-a-pro-libraries-that-help-you-implement-access-control-with-nodejs-5109)
- [Choosing Frontend Access Control Models](https://blog.logrocket.com/choosing-best-access-control-model-frontend/)

**Row Level Security & Multi-Tenancy**:
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Multi-Tenant RLS Patterns](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices)
- [RLS Explained with Examples](https://medium.com/@jigsz6391/supabase-row-level-security-explained-with-real-examples-6d06ce8d221c)
- [Managing RLS Policies Effectively](https://medium.com/@jay.digitalmarketing09/how-to-manage-row-level-security-policies-effectively-in-supabase-98c9dfbc2c01)

---

**Next Steps**: Review this document with the team and decide on Phase 1 enhancements to implement in the next sprint.
