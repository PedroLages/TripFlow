# TripFlow V1 Issues Analysis Report
Generated: Mon Jan  5 06:29:31 CET 2026

## 1. Most Frequently Changed Files (Pain Points)

These files changed most often, indicating areas of instability:

```
  22 components/TripDetail.tsx
  20 components/tabs/ItineraryTab.tsx
  19 components/tabs/BudgetTab.tsx
  15 App.tsx
  12 components/AuthCallback.tsx
  11 supabase/functions/send-invitation/index.ts
  10 components/TeamManagement.tsx
   9 components/tabs/WishlistTab.tsx
   8 hooks/useSupabaseTrips.ts
   8 components/tabs/DocumentsTab.tsx
   7 types.ts
   7 components/Settings.tsx
   7 components/Dashboard.tsx
   6 components/tabs/MapTab.tsx
   5 components/modals/SplitExpenseModal.tsx
   5 components/modals/ExportModal.tsx
   5 components/AuthModal.tsx
   4 vite.config.ts
   4 src/services/invitationService.ts
   4 src/services/GeminiService.ts
```

## 2. Bug Fix Patterns

### Fixes for Modal Issues
```
945b154 feat(ios): Add Google OAuth and Sign in with Apple
de3248c feat(ios): Add trip creation modal
a519820 fix: Remove safe area padding causing white space and button cutoff on iOS
841d50a fix: Add iOS safe area support to eliminate background bleed-through on modals
812b6f8 fix: Strengthen modal backdrop to prevent background bleed-through
a8a8329 feat: Add mobile swipe-to-dismiss gesture for all modals
6c00e81 feat: Hide navigation bars when modals open for immersive experience
e2641c5 fix: Eliminate navbar overlap by increasing modal z-index
844e3a7 fix: Center Activity Config modal on both desktop and mobile
f2a8060 fix: Eliminate Activity Config modal positioning issues
50d77ed fix: Improve Activity Config modal positioning and fix Departure/Arrival order
85ef22c fix: Eliminate blur background gap by using full-screen backdrop with padding
d1595cd fix: Constrain all modals to fit between navigation bars
634e926 style: Apply deep navy backdrop to all modals across application
2fdd0b5 refactor: Simplify Crew Hub modal with clean dark theme
bcb76d9 feat: Redesign Crew Hub modal with enhanced UI/UX
f037abb fix: Security and accessibility improvements for invitation system
1ee029c fix: Replace browser confirm with custom dialog and eliminate duplicate DB calls
7b7c01d fix: Itinerary date sync, terminology settings, and complete Supabase data persistence (#6)
8a0a59d fix: Itinerary date sync, terminology settings, and complete Supabase data persistence
```

### Fixes for Save/Refresh Issues
```
945b154 feat(ios): Add Google OAuth and Sign in with Apple
de3248c feat(ios): Add trip creation modal
ee2740f feat: Add native iOS app with authentication and dashboard
5506789 fix: Remove redundant trip filter to show invited member trips in dashboard
ded2922 fix: Add detailed auth logging and improve OAuth redirect
2b1a27e fix: Improve Google OAuth redirect and invitation error logging
32b924f feat: Improve email branding and fix crew display
3b587df fix: Correct parameter naming in itinerary mutations (#11)
3463de1 fix: Address code review issues in optimistic updates
490ea0b fix: Eliminate duplicate database operations causing app reloads
de5761d fix: Refactor mutations to use direct state updates + add DevTools
00adb8e feat: Implement TanStack Query for optimistic itinerary updates
1ee029c fix: Replace browser confirm with custom dialog and eliminate duplicate DB calls
a208f83 fix: Prevent IndexedDB persistence in Supabase mode and fix OAuth redirect loop
b4655b3 feat: Add cache clearing utility for service worker issues
8732a89 fix: Resolve duplicate key errors and UI reactivity issues
8600dde refactor: Use batch upsert for better reliability
ff5c0eb fix: Implement optimistic updates for instant UI feedback
a6e7c3e feat: Upgrade to Tailwind v4 and fix real-time activity updates
7b7c01d fix: Itinerary date sync, terminology settings, and complete Supabase data persistence (#6)
```

### Fixes for Trip Management
```
945b154 feat(ios): Add Google OAuth and Sign in with Apple
0251d2a feat(ios): Add trip detail view with tab navigation
de3248c feat(ios): Add trip creation modal
ee2740f feat: Add native iOS app with authentication and dashboard
5506789 fix: Remove redundant trip filter to show invited member trips in dashboard
efd6415 fix: Use hosted logo image instead of inline SVG in email
20a2e5d fix: Resolve infinite recursion in trips RLS policy
8610148 fix: Allow trip members to read trips in RLS policy
7b44b2e fix: Add missing escapeHtml function to send-invitation Edge Function
812925a fix: Link trip_members to profiles table for crew display
32b924f feat: Improve email branding and fix crew display
f037abb fix: Security and accessibility improvements for invitation system
d462c1f feat: Add complete email invitation system for trip collaboration (#12)
6c6e0bf feat: Add email integration, document scanning, and AI-powered document matching
de5761d fix: Refactor mutations to use direct state updates + add DevTools
00adb8e feat: Implement TanStack Query for optimistic itinerary updates
1ee029c fix: Replace browser confirm with custom dialog and eliminate duplicate DB calls
a208f83 fix: Prevent IndexedDB persistence in Supabase mode and fix OAuth redirect loop
c64847c fix: Use primary key for day_plans upsert conflict resolution
8732a89 fix: Resolve duplicate key errors and UI reactivity issues
```

## 3. Reverted Commits (Failed Attempts)

Features or fixes that were reverted indicate wrong approaches:

```
00adb8e feat: Implement TanStack Query for optimistic itinerary updates
```

## 4. Temporary Solutions (Technical Debt)

Commits mentioning workarounds, hacks, or temporary fixes:

```
4785a4d fix(ios): Use navigationBarItems for iOS 26 beta compatibility
7b44b2e fix: Add missing escapeHtml function to send-invitation Edge Function
f037abb fix: Security and accessibility improvements for invitation system
d462c1f feat: Add complete email invitation system for trip collaboration (#12)
8796766 feat: Add secure Gemini AI integration and toggleable language modes
76d2818 Force rebuild with env vars - attempt 2
3e0e935 feat: E2E test improvements, hybrid place search, and map feature research
f2652b6 fix(error-handling): Improve error states in Export Modal and helpers
```

## 5. Code Complexity Analysis

### Largest Files (Likely Too Complex)

```
    1982 components/tabs/MapTab.tsx
    1076 components/tabs/DocumentsTab.tsx
     851 components/TripDetail.tsx
     836 components/tabs/BudgetTab.tsx
     696 components/modals/SplitExpenseModal.tsx
     666 components/tabs/WishlistTab.tsx
     647 components/TeamManagement.tsx
     496 components/HybridPlaceSearch.tsx
     495 components/tabs/ItineraryTab.tsx
     433 components/Settings.tsx
     400 components/tabs/PackingTab.tsx
     391 components/Dashboard.tsx
     379 components/tabs/SettlementsTab.tsx
     367 components/AppleMapView.tsx
     342 components/TripForm.tsx
     341 components/PlaceSearch.tsx
     328 components/AcceptInvitation.tsx
     273 components/AuthCallback.tsx
     266 components/modals/ReceiptViewerModal.tsx
     266 components/AuthModal.tsx
```

### Files with Many Imports (High Coupling)

```
16 imports: components/TripDetail.tsx
9 imports: components/Dashboard.tsx
8 imports: components/TeamManagement.tsx
7 imports: components/TripForm.tsx
6 imports: components/Sidebar.tsx
6 imports: components/Settings.tsx
5 imports: components/PaymentProgressBar.tsx
5 imports: components/AcceptInvitation.tsx
4 imports: components/ReceiptImageUploader.tsx
4 imports: components/HybridPlaceSearch.tsx
4 imports: components/CurrencyRateInfo.tsx
4 imports: components/ConvertedAmount.tsx
4 imports: components/AuthCallback.tsx
4 imports: components/AppleMapDemo.tsx
3 imports: components/TripMobileNav.tsx
```

## 6. React Hooks Complexity

### Components with Many useState (Complex State)

```
15 useState calls: components/TripDetail.tsx
10 useState calls: components/HybridPlaceSearch.tsx
9 useState calls: components/TeamManagement.tsx
8 useState calls: components/PlaceSearch.tsx
6 useState calls: components/Dashboard.tsx
```

### Components with Many useEffect (Side Effects)

```
5 useEffect calls: components/TripDetail.tsx
5 useEffect calls: components/TeamManagement.tsx
5 useEffect calls: components/PlaceSearch.tsx
5 useEffect calls: components/HybridPlaceSearch.tsx
4 useEffect calls: components/AppleMapView.tsx
```

## 7. Known Issues in Code (TODO/FIXME Comments)

Developers left these notes about problems:

```
components/AuthCallback.tsx:49:        // 1. Regular query params: window.location.search (e.g., ?code=XXX before the hash)
components/AuthCallback.tsx:50:        // 2. Inside the hash: window.location.hash (e.g., /#/auth/callback?code=XXX)
components/AuthCallback.tsx:51:        // 3. Hash fragment tokens: #access_token=XXX (implicit flow)
components/AuthCallback.tsx:64:          // Parse hash like: #/auth/callback?code=XXX or #/auth/callback#access_token=XXX
components/AuthCallback.tsx:77:          // Handle implicit flow tokens in hash (e.g., #/auth/callback#access_token=XXX)
hooks/useTerminology.ts:26:  // TODO: Read from UserSettings context when implemented
src/lib/supabase.ts:33:        // PKCE uses ?code=XXX query params instead of #access_token=XXX
src/services/DocumentMatchingService.ts:276:    // TODO: Implement location matching when destination data is available
src/services/DocumentMatchingService.ts:294:    // TODO: Learn from user corrections (future enhancement)
src/services/EmailOAuthService.ts:396:   * TODO: Implement token refresh logic using refresh_token
src/services/EmailParserService.ts:393: * TODO: Implement with compromise.js or similar browser-compatible NER
src/services/EmailScannerService.ts:468:              attachments: [], // TODO: Extract attachments
src/services/SyncService.ts:101:          // TODO: Replace with actual backend API calls when backend is ready
src/services/SyncService.ts:115:          // TODO: Implement retry logic with exponential backoff
src/services/SyncService.ts:148:   * TODO: Replace with actual backend API calls when backend is implemented
```

### Summary

- TODO comments:        9
- FIXME comments:        0
- HACK comments:        0

## 8. Major Refactoring Attempts

Large commits that changed many files (attempted architectural improvements):

```
33 files, 4568 insertions,  deletions: a519820 fix: Remove safe area padding causing white space and button cutoff on iOS
12 files, 18 insertions, 18 deletions: d1595cd fix: Constrain all modals to fit between navigation bars
12 files, 18 insertions, 18 deletions: 634e926 style: Apply deep navy backdrop to all modals across application
11 files, 1369 insertions, 236 deletions: 3ce64f9 fix: Complete invitation system improvements and OAuth avatar imports
23 files, 250 insertions,  deletions: 0ffe2c7 chore: Ignore Playwright screenshots and update profiles migration
21 files, 3162 insertions, 50 deletions: 3b587df fix: Correct parameter naming in itinerary mutations (#11)
25 files, 5253 insertions, 58 deletions: 18860c0 fix: Correct Gemini API Google Search tool naming
27 files, 1137 insertions, 173 deletions: 6643111 fix: Force full page reload after OAuth redirect
165 files, 15968 insertions, 4185 deletions: 63d836d feat(map): Add auto-fit bounds and route debugging
74 files, 7671 insertions,  deletions: cbc2756 test: Add E2E testing guide and mobile responsiveness fix
35 files, 15586 insertions, 1989 deletions: 1be1b9a feat(expense-splitting): Phase 3 - Split Creation Modal
11 files, 4982 insertions, 52 deletions: 12c3a16 Create SECURITY.md for security policy
24 files, 4271 insertions, 5 deletions: 1489346 Initial commit
```

## 9. TypeScript Errors

Current type safety issues:

```
apps/mobile/App.tsx(83,8): error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: Omit<DefaultRouterOptions<string> & { children: ReactNode; layout?: (props: { state: StackNavigationState<ParamListBase>; navigation: NavigationHelpers<...>; descriptors: Record<...>; children: ReactNode; }) => ReactElement<...>; ... 4 more ...; UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled"; } & { ...; } & StackRouterOptions, "children" | ... 7 more ... | "UNSTABLE_routeNamesChangeBehavior"> & DefaultRouterOptions<...> & { ...; } & { ...; }, context?: any): string | ... 6 more ... | Component<...>', gave the following error.
    Property 'id' is missing in type '{ children: Element[]; initialRouteName: "Dashboard"; screenOptions: { headerStyle: { backgroundColor: string; }; headerTintColor: string; headerTitleStyle: { fontWeight: "bold"; }; }; }' but required in type '{ id: string; }'.
  Overload 2 of 2, '(props: Omit<DefaultRouterOptions<string> & { children: ReactNode; layout?: (props: { state: StackNavigationState<ParamListBase>; navigation: NavigationHelpers<...>; descriptors: Record<...>; children: ReactNode; }) => ReactElement<...>; ... 4 more ...; UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled"; } & { ...; } & StackRouterOptions, "children" | ... 7 more ... | "UNSTABLE_routeNamesChangeBehavior"> & DefaultRouterOptions<...> & { ...; } & { ...; }): string | ... 6 more ... | Component<...>', gave the following error.
    Property 'id' is missing in type '{ children: Element[]; initialRouteName: "Dashboard"; screenOptions: { headerStyle: { backgroundColor: string; }; headerTintColor: string; headerTitleStyle: { fontWeight: "bold"; }; }; }' but required in type '{ id: string; }'.
apps/mobile/src/screens/DashboardScreen.tsx(63,29): error TS2551: Property 'cover_image' does not exist on type 'Trip'. Did you mean 'coverImage'?
apps/mobile/src/screens/DashboardScreen.tsx(73,33): error TS2551: Property 'start_date' does not exist on type 'Trip'. Did you mean 'startDate'?
apps/mobile/src/screens/DashboardScreen.tsx(73,80): error TS2551: Property 'end_date' does not exist on type 'Trip'. Did you mean 'endDate'?
apps/mobile/src/screens/TripDetailScreen.tsx(87,29): error TS2551: Property 'cover_image' does not exist on type 'Trip'. Did you mean 'coverImage'?
apps/mobile/src/screens/TripDetailScreen.tsx(103,35): error TS2551: Property 'start_date' does not exist on type 'Trip'. Did you mean 'startDate'?
apps/mobile/src/screens/TripDetailScreen.tsx(103,88): error TS2551: Property 'end_date' does not exist on type 'Trip'. Did you mean 'endDate'?
apps/mobile/src/screens/TripDetailScreen.tsx(109,51): error TS2339: Property 'trip_type' does not exist on type 'Trip'.
apps/mobile/src/screens/TripDetailScreen.tsx(123,53): error TS2339: Property 'currency' does not exist on type 'Trip'.
components/AppleMapView.tsx(54,21): error TS2503: Cannot find namespace 'mapkit'.
components/AppleMapView.tsx(97,32): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
components/AppleMapView.tsx(133,33): error TS2503: Cannot find namespace 'mapkit'.
components/AppleMapView.tsx(134,45): error TS2503: Cannot find namespace 'mapkit'.
components/AppleMapView.tsx(135,42): error TS2503: Cannot find namespace 'mapkit'.
components/AppleMapView.tsx(155,28): error TS2339: Property 'isInitialized' does not exist on type 'typeof mapkit'.
components/AppleMapView.tsx(176,37): error TS2339: Property 'Coordinate' does not exist on type 'typeof mapkit'.
components/AppleMapView.tsx(177,11): error TS2322: Type 'string' is not assignable to type '"standard" | "mutedStandard" | "satellite" | "hybrid"'.
components/AppleMapView.tsx(178,11): error TS2322: Type 'string' is not assignable to type '"light" | "dark"'.
components/AppleMapView.tsx(243,49): error TS2339: Property 'Coordinate' does not exist on type 'typeof mapkit'.
components/AppleMapView.tsx(249,29): error TS2339: Property 'Coordinate' does not exist on type 'typeof mapkit'.
components/AppleMapView.tsx(260,22): error TS2339: Property 'addEventListener' does not exist on type 'MarkerAnnotation'.
components/AppleMapView.tsx(297,40): error TS2339: Property 'Coordinate' does not exist on type 'typeof mapkit'.
components/modals/SplitExpenseModal.tsx(138,31): error TS2365: Operator '+' cannot be applied to types 'unknown' and 'number'.
components/modals/SplitExpenseModal.tsx(138,48): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
components/modals/SplitExpenseModal.tsx(139,22): error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
components/modals/SplitExpenseModal.tsx(140,80): error TS2339: Property 'toFixed' does not exist on type 'unknown'.
components/modals/SplitExpenseModal.tsx(145,31): error TS2365: Operator '+' cannot be applied to types 'unknown' and 'number'.
components/modals/SplitExpenseModal.tsx(145,48): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
components/modals/SplitExpenseModal.tsx(146,22): error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
components/modals/SplitExpenseModal.tsx(147,70): error TS2339: Property 'toFixed' does not exist on type 'unknown'.
components/modals/SplitExpenseModal.tsx(151,74): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
components/modals/SplitExpenseModal.tsx(485,77): error TS2365: Operator '+' cannot be applied to types 'unknown' and 'number'.
components/modals/SplitExpenseModal.tsx(485,94): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
components/modals/SplitExpenseModal.tsx(485,108): error TS2339: Property 'toFixed' does not exist on type 'unknown'.
components/modals/SplitExpenseModal.tsx(526,74): error TS2365: Operator '+' cannot be applied to types 'unknown' and 'number'.
components/modals/SplitExpenseModal.tsx(526,91): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
components/modals/SplitExpenseModal.tsx(526,105): error TS2339: Property 'toFixed' does not exist on type 'unknown'.
components/modals/SplitExpenseModal.tsx(565,69): error TS2365: Operator '+' cannot be applied to types 'unknown' and 'number'.
components/modals/SplitExpenseModal.tsx(565,86): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
components/tabs/ItineraryTab.tsx(108,34): error TS2339: Property 'style' does not exist on type 'Element'.
components/tabs/ItineraryTab.tsx(112,34): error TS2339: Property 'style' does not exist on type 'Element'.
components/tabs/ItineraryTab.tsx(125,32): error TS2339: Property 'style' does not exist on type 'Element'.
components/tabs/ItineraryTab.tsx(364,13): error TS1117: An object literal cannot have multiple properties with the same name.
components/tabs/ItineraryTab.tsx(489,9): error TS2322: Type '{ isOpen: boolean; title: string; message: string; confirmText: string; cancelText: string; onConfirm: () => void; onCancel: () => void; variant: string; }' is not assignable to type 'ConfirmDialogProps'.
  Property 'variant' does not exist on type 'ConfirmDialogProps'.
components/TeamManagement.tsx(79,34): error TS2339: Property 'style' does not exist on type 'Element'.
```

