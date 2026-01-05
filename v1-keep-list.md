# V1 Code Worth Keeping for V2

## ✅ Keep (Working Well)

### Authentication System
- **Files:** `components/AuthModal.tsx`, `hooks/useSupabaseAuth.ts`
- **Why:** Works well, Google OAuth functional
- **Migration:** Copy with minimal changes
- **Evidence:** Only 5 changes in git history (stable)

### Settings Page
- **Files:** `components/Settings.tsx`, `hooks/useSupabaseSettings.ts`
- **Why:** 7 changes but stable, good UX
- **Migration:** Copy structure, maybe improve layout

### Design System (Colors, Spacing)
- **Files:** `tailwind.config.ts`
- **Why:** Visual design is good (just execution has issues)
- **Migration:** Copy design tokens exactly

### Type Definitions (Mostly)
- **Files:** `types.ts`
- **Why:** Good data models
- **Issues:** Inconsistent naming (cover_image vs coverImage)
- **Migration:** Standardize naming, keep structure

### PWA Setup
- **Files:** `vite-plugin-pwa` config
- **Why:** Offline support works
- **Migration:** Copy config

### Supabase Integration Pattern
- **Files:** `src/lib/supabase.ts`
- **Why:** Client setup is correct
- **Migration:** Keep, add proper typing

## ⚠️ Keep Structure, Rebuild Implementation

### Dashboard
- **Why:** Layout is good, but state management is messy
- **Action:** Keep UI, rebuild with React Query

### Trip Cards
- **Why:** Good visual design
- **Action:** Extract to reusable component, simplify state

### Mobile Navigation
- **Files:** `components/MobileNav.tsx`, `components/TripMobileNav.tsx`
- **Why:** Navigation pattern works
- **Action:** Clean up, make more reusable

## 🗑️ Discard (Rebuild from Scratch)

### TripDetail Component
- **Why:** 851 lines, 15 useState, changed 22 times
- **Action:** Split into 5+ smaller components

### MapTab Component
- **Why:** 1,982 lines (!)
- **Action:** Extract map logic to service, rebuild UI

### DocumentsTab Component
- **Why:** 1,076 lines, complex
- **Action:** Simplify, use proper file upload service

### Modal System
- **Why:** 22 fixes, still broken
- **Action:** Build proper modal system from scratch

### Data Sync Logic
- **Why:** Duplicate calls, cache issues
- **Action:** Let React Query handle everything

## 📊 Usage Patterns to Preserve

### User Workflows (Keep These UX Patterns)
1. Create trip → Add destinations → View on map ✅
2. Invite team members → Collaborate ✅
3. Add expenses → Split costs ✅
4. Create itinerary → Schedule activities ✅

### UI Patterns (Keep These Designs)
1. Card-based trip layout ✅
2. Tab-based trip detail view ✅
3. Modal overlays for actions ✅ (but fix implementation)
4. Mobile bottom navigation ✅

## 🎨 Design Elements to Keep

- Color scheme (blues, slate grays)
- Border radius (rounded-3xl for cards)
- Shadow patterns (shadow-lg for elevation)
- Typography (clear hierarchy)
- Icon usage (Lucide icons)
- Dark mode support

## 🔧 Dependencies to Keep

**Good dependencies:**
- React 19.2 ✅
- TypeScript 5.8 ✅
- Vite 6.2 ✅
- Tailwind CSS 3.4 ✅
- React Router 7 ✅
- Supabase JS 2.89 ✅
- React Query 5.90 ✅
- date-fns 4.1 ✅
- Zod 4.3 ✅

**Questionable dependencies:**
- @vis.gl/react-maplibre ⚠️ (MapTab is 2000 lines - is it worth it?)
- @google/genai ⚠️ (Used? Check if actually integrated)

## Next Steps

1. Review this list and adjust based on your experience
2. Export working components to `/v1-working/` folder
3. Start V2 with clean slate but reference these patterns
4. Copy working code file-by-file as needed
