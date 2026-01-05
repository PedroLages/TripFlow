/**
 * React Router Configuration for TripFlow V2
 *
 * Mobile-first routing with lazy loading for optimal bundle size.
 * Main bundle includes only essential routes (Dashboard, Auth).
 * Heavy features (AI, Documents, Maps) are lazy loaded.
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// ============================================
// EAGER LOADED (Main Bundle)
// ============================================
// These components are loaded immediately because they're
// essential for the initial user experience

// Layouts
import { AppLayout } from '@/src/shared/components/layout/AppLayout';

// Dashboard is the main entry point - load immediately
import Dashboard from '@/src/features/dashboard/components/Dashboard';

// Auth is critical path - load immediately
// import { AuthModal } from '@/src/features/auth/components/AuthModal';

// ============================================
// LAZY LOADED (Code Split)
// ============================================
// These components will be loaded on-demand once created.
// For now, they're commented out to prevent import errors.

// Lazy load TripDetail (now available)
const TripDetail = lazy(() =>
  import('@/src/features/trips/components/TripDetail')
);

// TODO: Uncomment as features are built
// const Settings = lazy(() =>
//   import('@/src/features/settings/components/Settings')
// );
//
// const AIFeatures = lazy(() =>
//   import('@/src/features/ai/components/AIFeatures')
// );
//
// const DocumentsTab = lazy(() =>
//   import('@/src/features/documents/components/DocumentsTab')
// );
//
// const MapTab = lazy(() =>
//   import('@/src/features/maps/components/MapTab')
// );

/**
 * Loading fallback for lazy-loaded routes
 *
 * Shows a centered spinner while the code chunk loads.
 * On mobile with good connection, this is usually < 200ms.
 */
function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );
}

/**
 * Lazy route wrapper with Suspense boundary
 *
 * @example
 * ```tsx
 * {
 *   path: 'trip/:id',
 *   element: <LazyRoute component={TripDetail} />
 * }
 * ```
 */
function LazyRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Component />
    </Suspense>
  );
}

/**
 * Router configuration with lazy loading
 *
 * Route structure (V2 Foundation):
 * / - Dashboard (only active route for now)
 *
 * TODO: Uncomment routes as features are built:
 * /trip/:id - Trip detail (lazy)
 * /settings - Settings (lazy)
 * /ai - AI features (lazy)
 * /documents - Documents (lazy)
 * /maps - Maps (lazy)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'trip/:id',
        element: <LazyRoute component={TripDetail} />,
      },
      // TODO: Uncomment as features are built
      // {
      //   path: 'settings',
      //   element: <LazyRoute component={Settings} />,
      // },
      // {
      //   path: 'ai',
      //   element: <LazyRoute component={AIFeatures} />,
      // },
      // {
      //   path: 'documents',
      //   element: <LazyRoute component={DocumentsTab} />,
      // },
      // {
      //   path: 'maps',
      //   element: <LazyRoute component={MapTab} />,
      // },
      {
        // Catch-all: redirect to dashboard
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

/**
 * Route paths (for type-safe navigation)
 *
 * @example
 * ```tsx
 * import { ROUTES } from '@/src/lib/router';
 *
 * navigate(ROUTES.tripDetail(tripId));
 * ```
 */
export const ROUTES = {
  home: '/',
  tripDetail: (id: string) => `/trip/${id}`,
  settings: '/settings',
  ai: '/ai',
  documents: '/documents',
  maps: '/maps',
} as const;
