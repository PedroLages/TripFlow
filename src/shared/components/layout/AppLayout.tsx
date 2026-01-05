/**
 * AppLayout Component - Main Application Layout
 *
 * Minimal layout wrapper for V2 foundation.
 * Future iterations will add:
 * - Top navigation bar
 * - Bottom navigation (mobile)
 * - Sidebar (desktop)
 * - Auth modal
 */

import { Outlet } from 'react-router-dom';

/**
 * AppLayout - Main layout wrapper
 *
 * Currently just renders children via Outlet.
 * Will be expanded with navigation, sidebar, etc. in future iterations.
 *
 * iOS Safe Areas:
 * - Uses env(safe-area-inset-*) to respect device notches and home indicators
 * - Prevents content from being cut off on iPhone notch and Android cutouts
 */
export function AppLayout() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
      }}
    >
      <Outlet />
    </div>
  );
}

export default AppLayout;
