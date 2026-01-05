# Pre-V2 Build Checklist

> Complete analysis before starting V2 development

**Status:** 📊 Analysis Phase
**Goal:** Understand V1 issues completely before building V2

---

## ✅ Completed Analyses

### 1. Git History Analysis ✅
- **File:** `v1-analysis-report.md`
- **Key Findings:**
  - TripDetail.tsx changed 22 times (most unstable)
  - 22+ modal fix attempts (architectural problem)
  - Multiple "duplicate DB operations" fixes
  - 7 consecutive RLS policy fixes (database security struggle)

### 2. Code Complexity Analysis ✅
- **Key Findings:**
  - MapTab.tsx: 1,982 lines (8x too large)
  - DocumentsTab.tsx: 1,076 lines
  - TripDetail.tsx: 851 lines, 15 useState, 5 useEffect
  - **Action:** Split components to max 300 lines in V2

### 3. TypeScript Errors Audit ✅
- **Current:** 36 TypeScript errors
- **Issues:**
  - Inconsistent naming (cover_image vs coverImage)
  - Unknown types in calculations
  - Missing type definitions
- **Action:** Strict types from day 1 in V2

### 4. Dependency Audit ✅
- **Total:** 15 dependencies (good, lean)
- **Confirmed Active:**
  - ✅ @google/genai - Used in 6 components (Dashboard, TripDetail, BudgetTab, etc.)
  - ✅ React Query - Used but not optimally
  - ✅ Supabase - Core dependency
- **Action:** Keep all current deps for V2

### 5. Build Performance Analysis ✅ 🚨
- **Bundle Size:** 2,330 KB (639 KB gzipped)
- **Warning:** Main bundle is 5x the recommended 500 KB limit
- **Issues:**
  - No code splitting
  - All features loaded upfront
  - Duplicate key warnings
- **V2 Requirements:**
  - ✅ **MUST** implement lazy loading
  - ✅ **MUST** code-split by feature
  - ✅ **Target:** <500 KB main bundle

### 6. Database Schema Review ✅ ⚠️
- **Tables:** trips, trip_members, trip_invitations, profiles
- **Issues Found:**
  - 7 consecutive RLS policy fixes (shows iteration pain)
  - Recursive policy issues fixed with "nuclear reset"
  - Naming inconsistency (trip_type vs tripType in code)
- **V2 Actions:**
  - ✅ Finalize schema BEFORE building
  - ✅ Test RLS policies thoroughly
  - ✅ Document all relationships

### 7. "Keep List" Created ✅
- **File:** `v1-keep-list.md`
- **Good Code to Copy:**
  - Auth system (stable, works well)
  - Settings page
  - Design system (colors, spacing)
  - PWA setup
- **Rebuild from Scratch:**
  - TripDetail (too complex)
  - MapTab (2000 lines!)
  - Modal system (broken)

---

## 🔴 CRITICAL Issues to Fix in V2

### Priority 1: Performance
```
Current: 2.3 MB bundle
Target:  <500 KB main bundle
Action:  Implement code splitting by route
```

### Priority 2: Modal System
```
Issues: 22 fix attempts, still broken
Cause:  No proper viewport handling
Action: Build fixed modal system FIRST
```

### Priority 3: Component Size
```
Current: 1,982 lines (MapTab)
Target:  300 lines max per component
Action:  Split large files before migration
```

### Priority 4: Data Layer
```
Issues: Duplicate DB calls, manual caching
Cause:  React Query not used properly
Action: Centralized React Query setup
```

### Priority 5: Type Safety
```
Current: 36 TypeScript errors
Target:  0 errors, strict mode
Action:  Fix types before building
```

---

## 🟡 Should Do (Recommended)

### 8. User Feedback Analysis ⏸️ PENDING
**Why:** Understand what USERS complain about (not just dev issues)

**How to do it:**
1. Check browser console for errors users see
2. Review any support tickets/emails
3. Ask 3-5 beta users what frustrates them
4. Check analytics for drop-off points

**Questions:**
- Do you have user feedback data?
- Any support emails about specific issues?
- Know which features users struggle with?

### 9. Feature Usage Analysis ⏸️ PENDING
**Why:** Don't spend time rebuilding unused features

**How to do it:**
1. Check if you have analytics (Mixpanel, PostHog, etc.)
2. Look at Supabase data:
   - Which features have the most data?
   - Which tables are empty/rarely used?

**Questions:**
- Do you use analytics?
- Which features do users actually use?
- Any features you can cut in V2?

### 10. Mobile Responsiveness Review ⏸️ PENDING
**Why:** Know what breaks on mobile BEFORE rebuilding

**How to do it:**
1. Test V1 on:
   - iPhone (Safari)
   - Android (Chrome)
   - iPad (Safari)
2. Document what breaks
3. Screenshot issues

**Known Issues:**
- ✅ Modal white space at bottom (iOS)
- ❓ Navigation issues?
- ❓ Touch targets too small?
- ❓ Horizontal scroll?

### 11. Browser Compatibility Check ⏸️ PENDING
**Why:** Know browser support requirements

**Test Matrix:**
- ✅ Chrome (works - it's your dev browser)
- ⏸️ Safari (iOS/Mac)
- ⏸️ Firefox
- ⏸️ Edge

**Action:** Test V1 in each browser, document issues

### 12. Security Audit ⏸️ OPTIONAL
**Why:** Find vulnerabilities before V2

**Check:**
- ✅ RLS policies (reviewed migrations)
- ⏸️ API key exposure in bundle
- ⏸️ XSS vulnerabilities
- ⏸️ CSRF protection

---

## 🟢 Nice to Have (Optional)

### 13. Accessibility Audit
- ⏸️ Screen reader testing
- ⏸️ Keyboard navigation
- ⏸️ Color contrast check
- ⏸️ WCAG 2.1 compliance

### 14. SEO Analysis
- ⏸️ Meta tags
- ⏸️ OpenGraph images
- ⏸️ Structured data

### 15. Documentation Review
- ⏸️ README up to date?
- ⏸️ API docs exist?
- ⏸️ Setup instructions accurate?

---

## 🎯 V2 Requirements Document

Based on analysis, V2 **MUST** have:

### Architecture Requirements

1. **Modular Structure**
   ```
   src/
   ├── features/          # Max 300 lines per component
   ├── shared/
   └── lib/
   ```

2. **Performance Budget**
   - Main bundle: <500 KB
   - Route bundles: <200 KB each
   - Code splitting: Required
   - Lazy loading: Required

3. **Code Quality**
   - TypeScript strict mode: ON
   - Zero type errors
   - Consistent naming (snake_case DB ↔ camelCase code)
   - ESLint errors: 0

4. **Data Layer**
   - React Query for ALL Supabase calls
   - No manual cache invalidation
   - Optimistic updates by default
   - Loading/error states everywhere

5. **UI System**
   - Proper modal system (viewport fix)
   - Mobile-first responsive
   - Dark mode support
   - Accessible (keyboard, screen reader)

### Feature Requirements

**MVP (Must Have in V2):**
- ✅ Authentication (Google, Email)
- ✅ Trip CRUD
- ✅ Dashboard
- ✅ Settings
- ✅ Basic itinerary
- ✅ Basic budget tracking

**Phase 2 (Can Add Later):**
- ⏸️ Team collaboration (invitations work in V1)
- ⏸️ Document scanning
- ⏸️ Map integration
- ⏸️ AI features (Gemini)
- ⏸️ Expense splitting

**Drop (Not Worth Complexity):**
- ❓ [Ask user what they want to drop]

---

## 📋 Pre-Build Checklist

Before writing any V2 code:

### Critical (Must Do)
- [x] Git history analysis
- [x] Code complexity analysis
- [x] TypeScript error audit
- [x] Dependency audit
- [x] Build performance check
- [x] Database schema review
- [x] Create "keep list"
- [ ] **Finalize V2 database schema** 🚨
- [ ] **Document modal system requirements** 🚨
- [ ] **Create component size linter rule** 🚨

### Recommended (Should Do)
- [ ] User feedback review
- [ ] Feature usage analysis
- [ ] Mobile responsiveness test
- [ ] Browser compatibility test

### Optional (Nice to Have)
- [ ] Security audit
- [ ] Accessibility audit
- [ ] SEO review

---

## 🚀 Ready to Start V2?

### Checklist Before First Commit

**Critical items completed:**
- [x] Analysis complete
- [x] Pain points identified
- [x] Architecture decided (Monorepo-lite)
- [ ] **Database schema finalized** ← DO THIS NEXT
- [ ] **Performance budget set** ← DONE (500 KB)
- [ ] **Component rules documented** ← DO THIS NEXT

**When all checkboxes are ✅, you're ready to:**
1. Create V2 folder structure
2. Set up build config with code splitting
3. Build modal system
4. Create first feature (Dashboard)

---

## Questions for You

Before starting V2, please answer:

1. **User Feedback:**
   - Do you have analytics data?
   - Any support tickets/user complaints?
   - Which features do users actually use?

2. **Features:**
   - Any features to DROP in V2?
   - Which features are MUST-HAVE for launch?
   - OK to launch without AI/maps initially?

3. **Database:**
   - Is current schema finalized?
   - Any data model changes planned?
   - Keep all current tables?

4. **Timeline:**
   - When do you need V2 live?
   - Can V1 run alongside V2 during development?
   - OK to have V2 MVP first, then add features?

---

## Next Steps

1. **Answer questions above**
2. **Finalize database schema** (if changes needed)
3. **Review and approve this checklist**
4. **Start V2 build!**
