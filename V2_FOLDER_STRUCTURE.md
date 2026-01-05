# V2 Folder Structure

> Feature-based organization (Monorepo-lite) for mobile-first TripFlow V2

## Philosophy

**Feature-based over type-based**
- Group by feature (trips, budget, etc.) not by type (components, hooks)
- Each feature is self-contained with its own components, hooks, types
- Easier to find related code, easier to test, easier to remove features

**Mobile-first organization**
- Mobile components first, desktop adaptations in same file
- Touch-optimized interactions by default
- Performance-critical code (lazy loading) clearly marked

## Structure

```
src/
├── main.tsx                     # App entry point
├── App.tsx                      # Root component with routing
├── index.css                    # Global styles, Tailwind imports
│
├── features/                    # Feature modules (self-contained)
│   │
│   ├── auth/                    # Authentication feature
│   │   ├── components/
│   │   │   ├── AuthModal.tsx    # ✅ Keep from V1 (works well)
│   │   │   ├── LoginForm.tsx    # Mobile-first login
│   │   │   └── SignupForm.tsx   # Mobile-first signup
│   │   ├── hooks/
│   │   │   └── useAuth.ts       # Auth state, login/logout
│   │   ├── types.ts             # Auth-specific types
│   │   └── index.ts             # Public exports
│   │
│   ├── dashboard/               # Main dashboard (trip list)
│   │   ├── components/
│   │   │   ├── Dashboard.tsx    # Main dashboard component
│   │   │   ├── TripCard.tsx     # Trip card (mobile-first)
│   │   │   ├── TripGrid.tsx     # Grid layout (desktop adaptation)
│   │   │   └── CreateTripButton.tsx
│   │   ├── hooks/
│   │   │   └── useTrips.ts      # React Query: trip list
│   │   └── index.ts
│   │
│   ├── trips/                   # Trip CRUD operations
│   │   ├── components/
│   │   │   ├── TripDetail/      # Split into subcomponents
│   │   │   │   ├── index.tsx    # Main component (<300 lines!)
│   │   │   │   ├── TripHeader.tsx
│   │   │   │   ├── TripTabs.tsx
│   │   │   │   └── TripActions.tsx
│   │   │   ├── TripForm.tsx     # Create/Edit form (mobile-first)
│   │   │   └── DeleteTripDialog.tsx
│   │   ├── hooks/
│   │   │   ├── useTrip.ts       # React Query: single trip
│   │   │   ├── useCreateTrip.ts # Mutation: create
│   │   │   ├── useUpdateTrip.ts # Mutation: update
│   │   │   └── useDeleteTrip.ts # Mutation: delete
│   │   ├── types.ts             # Trip-specific types
│   │   └── index.ts
│   │
│   ├── itinerary/               # Activities & timeline
│   │   ├── components/
│   │   │   ├── ItineraryTab.tsx # Main tab component
│   │   │   ├── ActivityCard.tsx # Swipeable card (mobile)
│   │   │   ├── ActivityForm.tsx # Mobile-first form
│   │   │   └── Timeline.tsx     # Mobile-optimized timeline
│   │   ├── hooks/
│   │   │   ├── useActivities.ts
│   │   │   ├── useCreateActivity.ts
│   │   │   └── useUpdateActivity.ts
│   │   └── index.ts
│   │
│   ├── budget/                  # Budget tracking & expenses
│   │   ├── components/
│   │   │   ├── BudgetTab.tsx    # Main tab component
│   │   │   ├── ExpenseList.tsx  # Mobile-first list
│   │   │   ├── ExpenseForm.tsx  # Quick add (mobile)
│   │   │   ├── BudgetChart.tsx  # Visual progress
│   │   │   └── CategorySelect.tsx # Touch-friendly
│   │   ├── hooks/
│   │   │   ├── useExpenses.ts
│   │   │   ├── useBudget.ts
│   │   │   └── useCreateExpense.ts
│   │   ├── utils/
│   │   │   └── budgetCalculations.ts # Pure functions
│   │   └── index.ts
│   │
│   ├── packing/                 # Packing lists
│   │   ├── components/
│   │   │   ├── PackingTab.tsx
│   │   │   ├── PackingList.tsx  # Mobile checklist
│   │   │   └── PackingItem.tsx  # Tap-to-check
│   │   ├── hooks/
│   │   │   └── usePackingList.ts
│   │   └── index.ts
│   │
│   ├── documents/               # Travel documents (lazy loaded)
│   │   ├── components/
│   │   │   ├── DocumentsTab.tsx
│   │   │   ├── DocumentUpload.tsx # Mobile camera
│   │   │   ├── DocumentList.tsx
│   │   │   └── DocumentPreview.tsx
│   │   ├── hooks/
│   │   │   └── useDocuments.ts
│   │   └── index.ts
│   │
│   ├── collaboration/           # Team collaboration
│   │   ├── components/
│   │   │   ├── InviteModal.tsx  # Mobile-friendly
│   │   │   ├── MemberList.tsx   # Touch-optimized
│   │   │   └── PermissionSelect.tsx
│   │   ├── hooks/
│   │   │   ├── useMembers.ts
│   │   │   └── useInvitations.ts
│   │   └── index.ts
│   │
│   ├── settings/                # User settings
│   │   ├── components/
│   │   │   ├── Settings.tsx     # ✅ Migrate from V1
│   │   │   ├── ProfileSection.tsx
│   │   │   └── PreferencesSection.tsx
│   │   ├── hooks/
│   │   │   └── useSettings.ts
│   │   └── index.ts
│   │
│   ├── ai/                      # AI features (lazy loaded)
│   │   ├── components/
│   │   │   ├── AISuggestions.tsx
│   │   │   ├── BudgetInsights.tsx
│   │   │   └── ItinerarySuggestions.tsx
│   │   ├── hooks/
│   │   │   └── useGemini.ts
│   │   └── index.ts
│   │
│   └── maps/                    # Maps (Phase 2, lazy loaded)
│       ├── components/
│       │   └── MapTab.tsx
│       └── index.ts
│
├── shared/                      # Shared across features
│   │
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Base UI components
│   │   │   ├── Button.tsx       # Mobile-first button
│   │   │   ├── Input.tsx        # Touch-friendly input
│   │   │   ├── Modal.tsx        # ⭐ Fixed modal (iOS viewport)
│   │   │   ├── Select.tsx       # Touch-friendly select
│   │   │   ├── Tabs.tsx         # Mobile tabs (swipeable)
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   ├── layout/              # Layout components
│   │   │   ├── AppLayout.tsx    # Main layout wrapper
│   │   │   ├── MobileNav.tsx    # Bottom navigation
│   │   │   ├── DesktopNav.tsx   # Sidebar navigation
│   │   │   └── Header.tsx
│   │   │
│   │   └── feedback/            # User feedback
│   │       ├── Toast.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/                   # Shared React hooks
│   │   ├── useViewport.ts       # ⭐ Viewport fix (--vh)
│   │   ├── useMediaQuery.ts     # Responsive breakpoints
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useClickOutside.ts
│   │
│   ├── utils/                   # Utility functions
│   │   ├── date.ts              # date-fns helpers
│   │   ├── currency.ts          # Currency formatting
│   │   ├── validation.ts        # Form validation (Zod)
│   │   └── storage.ts           # Local storage helpers
│   │
│   ├── types/                   # Shared TypeScript types
│   │   ├── supabase.ts          # Generated from DB
│   │   ├── common.ts            # Common types
│   │   └── index.ts             # Exports
│   │
│   └── constants/               # App constants
│       ├── routes.ts            # Route paths
│       ├── breakpoints.ts       # Mobile breakpoints
│       └── config.ts            # App config
│
├── lib/                         # Third-party integrations
│   ├── supabase.ts              # ✅ Supabase client (V2 config)
│   ├── react-query.ts           # React Query setup
│   ├── router.tsx               # React Router setup
│   └── analytics.ts             # PostHog/Mixpanel (future)
│
└── styles/                      # Global styles
    ├── globals.css              # Global CSS, Tailwind
    └── mobile-fixes.css         # Mobile-specific fixes
```

## File Size Rules (ESLint Enforced)

```javascript
// .eslintrc.js
rules: {
  'max-lines': ['error', { max: 300 }],           // ❌ No file >300 lines
  'max-lines-per-function': ['error', { max: 50 }], // ❌ No function >50 lines
  'complexity': ['error', 10],                     // ❌ No complex logic
}
```

**If you hit the limit → Split the component!**

## Import Conventions

```typescript
// ✅ Good: Import from feature index
import { TripCard } from '@/features/dashboard';
import { useTrips } from '@/features/trips';

// ✅ Good: Import shared components
import { Button, Modal } from '@/shared/components/ui';
import { useViewport } from '@/shared/hooks';

// ❌ Bad: Deep imports (breaks encapsulation)
import { TripCard } from '@/features/dashboard/components/TripCard';
```

## Lazy Loading Pattern

```typescript
// src/lib/router.tsx

import { lazy } from 'react';

// ✅ Eager load (main bundle)
import Dashboard from '@/features/dashboard';
import { AppLayout } from '@/shared/components/layout';

// ✅ Lazy load (separate bundles)
const TripDetail = lazy(() => import('@/features/trips/components/TripDetail'));
const Settings = lazy(() => import('@/features/settings'));
const AIFeatures = lazy(() => import('@/features/ai')); // Heavy!
const DocumentsTab = lazy(() => import('@/features/documents')); // Heavy!
const MapTab = lazy(() => import('@/features/maps')); // Heavy!

// Routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'trip/:id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <TripDetail />
          </Suspense>
        )
      },
      // ... more routes
    ]
  }
]);
```

## Migration from V1

**Keep (copy as-is):**
- ✅ `src/components/AuthModal.tsx` → `src/features/auth/components/AuthModal.tsx`
- ✅ `src/components/Settings.tsx` → `src/features/settings/components/Settings.tsx`
- ✅ `tailwind.config.ts` → `tailwind.config.ts` (root)
- ✅ `vite-plugin-pwa` config → keep

**Refactor (split/simplify):**
- ⚠️ `src/components/TripDetail.tsx` (851 lines) → Split into TripDetail folder
- ⚠️ `src/components/Dashboard.tsx` → Rebuild with React Query
- ⚠️ Modal system → Rebuild with viewport fix

**Discard (rebuild):**
- ❌ `src/components/tabs/MapTab.tsx` (1,982 lines!) → Phase 2
- ❌ `src/components/tabs/DocumentsTab.tsx` (1,076 lines) → Simplify
- ❌ Manual state management → React Query

## Benefits of This Structure

**✅ Scalability**
- Add new features without affecting existing ones
- Remove features easily (delete folder)
- Test features in isolation

**✅ Developer Experience**
- Find code faster (feature-based)
- Understand dependencies (explicit imports)
- Onboard new developers easier

**✅ Performance**
- Lazy load heavy features (AI, maps, documents)
- Code split by route automatically
- Tree-shaking removes unused code

**✅ Mobile-First**
- All components start mobile, adapt to desktop
- Touch interactions by default
- Viewport fixes in shared hooks

## Next Steps

1. Create folder structure
2. Set up ESLint rules (enforce file size limits)
3. Configure path aliases (`@/features`, `@/shared`, etc.)
4. Build first feature: Modal system (fixes iOS bug!)
5. Build second feature: Dashboard (mobile-first)

---

**Ready to build V2! 🚀**
