# TripFlow Feature Roadmap & TODOs

> Last Updated: 2025-12-30
> Use `/todos` to view this list or `/add-todo "description"` to add new items

---

## Priority Legend
- **P0** - Critical / Blocking
- **P1** - High Priority (Next Sprint)
- **P2** - Medium Priority (Backlog)
- **P3** - Low Priority (Future)
- **P4** - Nice to Have (Wishlist)

---

## 🔥 Tier 1: High-Impact, Quick Wins (1-2 weeks each)

### PWA with Offline Mode
- [ ] **P1** | `feature/pwa` | Install as native app, offline access to trip data
  - Service Worker with Workbox for caching strategies
  - IndexedDB for offline trip data storage
  - Background sync for changes made offline
  - Push notifications for trip alerts
  - **Files**: `vite.config.ts`, `public/manifest.json`, `sw.js`

### Group Expense Splitting
- [ ] **P1** | `feature/expense-split` | Split expenses among trip collaborators
  - Add participants to expenses with split amounts
  - Debt simplification algorithm (minimize transactions)
  - Settlement tracking and history
  - Export split summary as image/PDF
  - **Files**: `components/tabs/BudgetTab.tsx`, `types.ts`

### Calendar Integration
- [ ] **P1** | `feature/calendar` | Sync trip events with personal calendar
  - iCal file generation (.ics export)
  - Google Calendar API integration
  - Two-way sync for itinerary changes
  - Automatic reminders setup
  - **Files**: `utils/calendar.ts`, `components/tabs/ItineraryTab.tsx`

### Smart Email Import
- [ ] **P1** | `feature/email-import` | Auto-extract booking details from forwarded emails
  - Gmail/Outlook API integration or email forwarding
  - AI parsing of confirmation emails (flights, hotels, reservations)
  - Auto-populate documents tab with extracted info
  - Gemini API for intelligent extraction
  - **Files**: `services/emailParser.ts`, `components/tabs/DocumentsTab.tsx`

---

## 🗺️ Map Features (Based on Competitive Research)

### Route Visualization
- [ ] **P1** | `feature/route-visualization` | Connect activities with polylines on map
  - Draw routes between consecutive activities (day-colored polylines)
  - Display distance and travel time annotations on routes
  - Add transport mode icons (walking/driving/transit)
  - Animated route rendering showing travel direction
  - **Files**: `components/tabs/MapTab.tsx`, `services/RouteService.ts`
  - **Research**: See `docs/map-feature-research.md` for details

### Route Optimization
- [ ] **P1** | `feature/route-optimization` | Optimize activity order within a day
  - Implement 2-opt TSP algorithm for route optimization
  - "Optimize Day" button to reorder activities for minimum travel
  - Preview before/after comparison
  - Undo capability to revert to original order
  - Handle constraints (opening hours, must-visit times)
  - **Files**: `utils/routeOptimizer.ts`, `components/tabs/MapTab.tsx`
  - **Research**: See `docs/map-feature-research.md` for algorithm details

### Directions & Travel Times
- [ ] **P2** | `feature/directions-api` | Real directions and travel times
  - Integrate OpenRouteService API (2000 free requests/day)
  - Calculate actual walking/driving/transit times between activities
  - Cache route calculations in IndexedDB
  - Support multiple transport modes
  - Batch geocoding with rate limit handling
  - **Files**: `services/DirectionsService.ts`, `components/tabs/MapTab.tsx`
  - **API**: OpenRouteService (free tier)

### Marker Clustering
- [ ] **P2** | `feature/marker-clustering` | Cluster markers at lower zoom levels
  - Enable MapLibre GL JS built-in clustering
  - Custom cluster styles with day-colored backgrounds
  - Click-to-expand behavior (zoom to cluster extent)
  - Show activity preview in cluster tooltips
  - Smart clustering by day or all activities
  - **Files**: `components/tabs/MapTab.tsx`
  - **Docs**: MapLibre clustering API

### Enhanced Offline Maps
- [ ] **P2** | `feature/offline-enhancement` | Better offline map download experience
  - "Download for Trip" button with progress indicator
  - Calculate offline area around trip activities
  - Show storage estimate before download
  - Selective zoom level downloads (higher near POIs)
  - Auto-suggest download before trip starts
  - **Files**: `services/offlineMapService.ts`, `components/tabs/MapTab.tsx`

### Collaborative Maps
- [ ] **P3** | `feature/collab-maps` | Real-time collaborative map viewing
  - Share trip link with viewer/editor roles
  - Live cursors showing where others are looking
  - Comments on markers/activities
  - Live location sharing (optional during trip)
  - **Backend**: Supabase Realtime integration
  - **Files**: `services/realtimeSync.ts`, `components/tabs/MapTab.tsx`

### Advanced Visualizations
- [ ] **P4** | `feature/map-viz` | Heatmaps and isochrones
  - Activity density heatmap layer
  - "Reachable in X minutes" isochrone areas
  - Mini-map overview control
  - Route elevation profiles (3D terrain)
  - **Files**: `components/tabs/MapTab.tsx`, MapLibre advanced layers

---

## 🎯 Tier 2: Major Features (2-4 weeks each)

### AI Trip Planner 2.0
- [ ] **P2** | `feature/ai-planner-v2` | Enhanced AI-powered itinerary generation
  - Multi-city trip planning with optimal routing
  - Constraint handling (budget, interests, mobility)
  - Local expert recommendations integration
  - Real-time pricing and availability checks
  - **Files**: `services/aiPlanner.ts`, `components/TripForm.tsx`

### Flight Price Alerts
- [ ] **P2** | `feature/flight-alerts` | Track flight prices and get alerts
  - Integration with SerpApi or FlightAPI.io
  - Price history charts
  - Alert thresholds (notify when price drops below X)
  - Alternative date suggestions
  - **Files**: `services/flightTracker.ts`, `components/tabs/DocumentsTab.tsx`

### Real-time Collaboration
- [ ] **P2** | `feature/realtime-collab` | Live multi-user editing
  - WebSocket-based real-time updates
  - Presence indicators (who's viewing/editing)
  - Conflict resolution for simultaneous edits
  - Activity feed with live updates
  - **Backend**: Supabase Realtime or custom WebSocket server

### Currency Converter with Live Rates
- [ ] **P2** | `feature/currency` | Multi-currency budget tracking
  - Live exchange rate API integration
  - Per-expense currency selection
  - Automatic conversion to home currency
  - Historical rate tracking for past trips
  - **Files**: `services/currency.ts`, `components/tabs/BudgetTab.tsx`

### Weather Forecasts
- [ ] **P2** | `feature/weather` | Destination weather integration
  - OpenWeatherMap or WeatherAPI integration
  - 7-14 day forecasts for trip dates
  - Weather-based packing suggestions
  - Severe weather alerts
  - **Files**: `services/weather.ts`, `components/TripDetail.tsx`

---

## 🚀 Tier 3: Platform Expansion

### Backend & Authentication
- [ ] **P2** | `feature/backend` | Persistent data storage and user accounts
  - Supabase integration (PostgreSQL + Auth + Realtime)
  - User registration and login (OAuth: Google, Apple)
  - Cloud sync across devices
  - Data export/import functionality
  - **Files**: `services/supabase.ts`, `contexts/AuthContext.tsx`

### Mobile App (React Native)
- [ ] **P3** | `feature/mobile` | Native iOS/Android app
  - React Native with Expo for cross-platform
  - Shared component library with web app
  - Native features (camera for receipts, GPS for check-ins)
  - Offline-first architecture
  - **New Repo**: `TripFlow-Mobile`

### Travel Booking Integration
- [ ] **P3** | `feature/booking` | Book directly within the app
  - Hotel booking via Booking.com affiliate API
  - Flight booking via Kiwi or Skyscanner API
  - Activity booking via Viator/GetYourGuide
  - Commission-based revenue model
  - **Files**: `services/booking.ts`, new booking components

---

## ✨ Tier 4: Delight Features

### Photo Journal
- [ ] **P3** | `feature/photos` | Trip photo organization and memories
  - Photo upload per day/activity
  - Auto-organize by date and location
  - Shareable trip album generation
  - Integration with Google Photos/iCloud
  - **Files**: `components/tabs/PhotosTab.tsx`, `services/photos.ts`

### Travel Stats & Insights
- [ ] **P3** | `feature/stats` | Personal travel analytics
  - Countries/cities visited tracker
  - Travel map visualization (visited places)
  - Spending insights and trends
  - Year-in-review travel summary
  - **Files**: `components/TravelStats.tsx`, `utils/analytics.ts`

### Social Features
- [ ] **P4** | `feature/social` | Community and sharing
  - Public trip profiles (opt-in)
  - Trip template sharing marketplace
  - Follow other travelers
  - Destination reviews and tips
  - **Files**: `components/Social/`, community features

### Gamification
- [ ] **P4** | `feature/gamification` | Badges, streaks, achievements
  - Travel badges (countries visited, trip types)
  - Budget master achievements
  - Packing perfectionist streaks
  - Leaderboards among friends
  - **Files**: `components/Achievements.tsx`, `services/gamification.ts`

### Voice Commands
- [ ] **P4** | `feature/voice` | Hands-free trip management
  - Web Speech API integration
  - "Add expense $50 for lunch"
  - "What's on the itinerary tomorrow?"
  - Accessibility improvement
  - **Files**: `hooks/useVoiceCommands.ts`

---

## 🛠️ Technical Improvements

### Performance Optimization
- [ ] **P2** | `chore/performance` | App speed improvements
  - Code splitting and lazy loading
  - React.memo optimization audit
  - Virtual scrolling for large lists
  - Image optimization (WebP, lazy loading)
  - Bundle size analysis and reduction

### Testing Suite
- [ ] **P2** | `chore/testing` | Comprehensive test coverage
  - Unit tests with Vitest
  - Component tests with React Testing Library
  - E2E tests with Playwright
  - CI/CD integration for test runs
  - Target: 80% code coverage

### Accessibility Audit
- [ ] **P2** | `chore/a11y` | WCAG 2.1 AA compliance
  - Screen reader testing
  - Keyboard navigation audit
  - Color contrast verification
  - Focus management improvements
  - ARIA attributes audit

### Design System Documentation
- [ ] **P3** | `chore/design-system` | Component library and Storybook
  - Storybook setup for component docs
  - Design token documentation
  - Component usage guidelines
  - Figma integration

---

## 🐛 Bug Fixes & Polish

### Current Known Issues
- [ ] **P1** | `fix/budget-edge-cases` | Handle budget edge cases
  - NaN/Infinity validation in expense calculations
  - Negative budget warnings
  - Currency formatting consistency

- [ ] **P2** | `fix/responsive-issues` | Mobile layout fixes
  - Modal scrolling on small screens
  - Touch target sizes audit
  - Landscape mode handling

- [ ] **P2** | `fix/date-handling` | Date edge cases
  - Timezone handling for international trips
  - Date range validation improvements
  - Calendar week start preference

---

## 📝 Documentation

- [ ] **P2** | `docs/api` | API documentation
  - Document all service functions
  - TypeScript interface documentation
  - Integration guides for external APIs

- [ ] **P3** | `docs/contributing` | Contribution guidelines
  - Code style guide
  - PR template
  - Issue templates

---

## Completed ✅

<!-- Move completed items here with completion date -->
<!--
- [x] **P1** | `feature/xxx` | Description | Completed: 2025-01-XX
-->

---

## Notes

### Adding New TODOs
Use the `/add-todo` command:
```
/add-todo "P2 | feature/xxx | Description of the feature"
```

### Updating Status
- To mark as in-progress: Change `[ ]` to `[~]`
- To mark as complete: Change `[ ]` to `[x]` and move to Completed section

### Branch Naming Convention
- Features: `feature/feature-name`
- Fixes: `fix/issue-description`
- Chores: `chore/task-name`
- Docs: `docs/doc-name`
