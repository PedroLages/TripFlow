# TripFlow Design Principles

## Core Philosophy
TripFlow is designed to make trip planning intuitive, delightful, and stress-free. Every design decision should support travelers in organizing their adventures with clarity and confidence.

## 1. User-Centered Design

### Prioritize User Needs
- **Trip-centric workflow**: Everything revolves around the Trip object and its related data
- **Quick access to key info**: Dashboard shows trip cards with essential details at a glance
- **Progressive disclosure**: Show summary first, details in tabs
- **Mobile-first thinking**: 40%+ of users plan on mobile devices

### Clear Information Hierarchy
```
Dashboard (Overview)
  └─ Trip Card (Summary)
      └─ Trip Detail (Full View)
          ├─ Itinerary Tab
          ├─ Budget Tab
          ├─ Packing Tab
          ├─ Documents Tab
          ├─ Wishlist Tab
          └─ Map Tab
```

## 2. Visual Design System

### Color Palette
**Primary Colors**
- Primary Blue: `#3b82f6` - Actions, links, active states
- Primary Blue Hover: `#2563eb` - Hover states
- Primary Blue Light: `#dbeafe` - Backgrounds, subtle highlights

**Semantic Colors**
- Success/Positive: `#10b981` (Green) - Completed items, positive metrics
- Warning: `#f59e0b` (Amber) - Alerts, cautions
- Error/Negative: `#ef4444` (Red) - Errors, deletions, negative metrics
- Info: `#3b82f6` (Blue) - Informational messages

**Neutral Colors**
- Gray 50: `#f9fafb` - Background
- Gray 100: `#f3f4f6` - Card backgrounds
- Gray 200: `#e5e7eb` - Borders
- Gray 300: `#d1d5db` - Dividers
- Gray 500: `#6b7280` - Secondary text
- Gray 700: `#374151` - Body text
- Gray 900: `#111827` - Headings

### Typography
**Font Stack**: System fonts for optimal performance
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;
```

**Scale** (Tailwind classes)
- Headings H1: `text-3xl md:text-4xl font-bold` (30px/36px → 36px/40px)
- Headings H2: `text-2xl md:text-3xl font-semibold` (24px → 30px)
- Headings H3: `text-xl md:text-2xl font-semibold` (20px → 24px)
- Body Large: `text-lg` (18px) - Important content
- Body: `text-base` (16px) - Default body text
- Body Small: `text-sm` (14px) - Secondary info, captions
- Tiny: `text-xs` (12px) - Labels, metadata

### Spacing System
Use Tailwind's spacing scale (4px base unit):
- Extra tight: `gap-2` (8px) - Related inline elements
- Tight: `gap-4` (16px) - Form fields, list items
- Normal: `gap-6` (24px) - Card sections, components
- Relaxed: `gap-8` (32px) - Major sections
- Loose: `gap-12` (48px) - Page sections

### Component Patterns

#### Cards
```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  {/* Content */}
</div>
```
- Rounded corners: `rounded-lg` (8px)
- Shadow: `shadow-md` elevation
- Padding: `p-6` (24px)
- Hover: Lift effect with `hover:shadow-lg`

#### Buttons

**Primary Action**
```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white font-medium 
                   px-4 py-2 rounded-lg transition-colors">
  Action
</button>
```

**Secondary Action**
```tsx
<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium 
                   px-4 py-2 rounded-lg transition-colors">
  Action
</button>
```

**Destructive Action**
```tsx
<button className="bg-red-500 hover:bg-red-600 text-white font-medium 
                   px-4 py-2 rounded-lg transition-colors">
  Delete
</button>
```

#### Form Inputs
```tsx
<input 
  className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-blue-500 focus:border-transparent
             transition-all"
  type="text"
/>
```

## 3. Layout & Structure

### Responsive Grid
- **Mobile** (< 640px): Single column, full width
- **Tablet** (640px - 1024px): 2 columns for cards, sidebar collapses
- **Desktop** (> 1024px): Fixed sidebar (256px), main content area

### Dashboard Layout
```
┌─────────────┬──────────────────────────────────┐
│   Sidebar   │         Main Content             │
│   (fixed)   │                                  │
│             │  ┌────────┬────────┬────────┐    │
│  • Home     │  │ Trip 1 │ Trip 2 │ Trip 3 │    │
│  • Trips    │  └────────┴────────┴────────┘    │
│  • Settings │                                  │
│             │  Stats, Recent Activity...        │
└─────────────┴──────────────────────────────────┘
```

### TripDetail Layout (Tabbed)
```
┌─────────────────────────────────────────────────┐
│  Trip Header (Name, Dates, Destinations)        │
├─────────────────────────────────────────────────┤
│  [Itinerary] [Budget] [Packing] [Docs] [Map]   │
├─────────────────────────────────────────────────┤
│                                                 │
│           Active Tab Content                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 4. Interactions & Animations

### Micro-interactions
**Timing**: Keep animations snappy (150-300ms)
```css
transition-colors duration-200
transition-shadow duration-200
transition-all duration-300
```

**Common Patterns**
- Button hover: Color change (200ms)
- Card hover: Elevation increase (200ms)
- Modal/drawer: Slide/fade in (300ms)
- Tab switch: Fade content (150ms)
- Toast notifications: Slide in from top (300ms)

### Loading States
```tsx
// Skeleton loader for trip cards
<div className="bg-gray-200 animate-pulse rounded-lg h-48" />

// Spinner for actions
<Loader2 className="animate-spin" />
```

### Feedback
- **Immediate**: Visual state change on interaction
- **Clear**: Loading indicators during async operations
- **Helpful**: Error messages explain what went wrong and how to fix it

## 5. Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- All interactive elements accessible via Tab
- Enter/Space activates buttons
- Escape closes modals/dropdowns
- Arrow keys for lists/tabs where appropriate

### Focus Indicators
```css
focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```
- Visible 2px ring around focused elements
- Blue color matches brand
- Offset for clarity

### Color Contrast
- Text on background: Minimum 4.5:1
- Large text (18px+): Minimum 3:1
- UI components: Minimum 3:1
- Test with tools: Contrast Checker, axe DevTools

### Semantic HTML
```tsx
<main>        // Main content area
  <nav>       // Navigation components
  <article>   // Trip cards, detail views
  <section>   // Logical groupings
  <aside>     // Sidebar, supplementary content
</main>
```

### ARIA Labels
```tsx
// Icon buttons need labels
<button aria-label="Delete trip">
  <Trash2 />
</button>

// Form inputs need associated labels
<label htmlFor="trip-name">Trip Name</label>
<input id="trip-name" />
```

## 6. Performance

### React Optimization
- Use `React.memo()` for expensive components
- `useCallback()` for functions passed as props
- `useMemo()` for expensive calculations
- Lazy load tab content that's not initially visible

### Code Splitting
```tsx
// Lazy load routes
const TripDetail = lazy(() => import('./components/TripDetail'));

// Lazy load heavy dependencies
const Chart = lazy(() => import('./components/Chart'));
```

### Image Optimization
- Use appropriate formats (WebP with PNG fallback)
- Lazy load images below the fold
- Provide width/height to prevent layout shift

## 7. Error Handling & Empty States

### Empty States
**No Trips Yet**
```tsx
<div className="text-center py-12">
  <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
  <h3 className="text-xl font-semibold text-gray-700 mb-2">
    No trips yet
  </h3>
  <p className="text-gray-500 mb-6">
    Start planning your next adventure!
  </p>
  <button>Create Your First Trip</button>
</div>
```

### Error Messages
- **Be specific**: "Invalid date format" not "Error"
- **Be helpful**: Include what to do next
- **Be friendly**: Avoid technical jargon

```tsx
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
  <p className="font-medium">Unable to save trip</p>
  <p className="text-sm">Please check your internet connection and try again.</p>
</div>
```

## 8. Mobile Considerations

### Touch Targets
- Minimum size: 44x44px (iOS guideline)
- Adequate spacing between tappable elements
- Larger buttons for primary actions

### Navigation
- Hamburger menu for collapsed sidebar
- Bottom navigation for key tabs (optional enhancement)
- Swipe gestures for tab navigation (future)

### Responsive Text
Use responsive classes:
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Trip Name
</h1>
```

## 9. Data Visualization

### Charts (Recharts)
**Budget Breakdown Pie Chart**
- Clear labels with values
- Distinct colors per category
- Legend below chart
- Responsive sizing

**Expense Timeline**
- Line chart for expenses over time
- X-axis: Dates
- Y-axis: Amount in user's currency
- Tooltips on hover

### Consistency
- Use same chart library throughout (Recharts)
- Consistent color mapping (Flights = blue, Food = orange, etc.)
- Always include labels and legends

## 10. TripFlow-Specific Patterns

### Trip Type Icons & Colors
```tsx
const typeStyles = {
  Solo: { icon: User, color: 'blue' },
  Couple: { icon: Heart, color: 'rose' },
  Family: { icon: Users, color: 'green' },
  Friends: { icon: Users, color: 'purple' },
  Business: { icon: Briefcase, color: 'gray' }
};
```

### Date Formatting
Use `date-fns` consistently:
```tsx
import { format, formatDistance } from 'date-fns';

// Display dates: "Jan 15, 2024"
format(new Date(trip.startDate), 'MMM d, yyyy')

// Relative dates: "in 5 days"
formatDistance(new Date(trip.startDate), new Date(), { addSuffix: true })
```

### Budget Display
```tsx
// Always show currency symbol
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};
```

## Review Checklist

Before considering a UI change complete:

- [ ] Works on mobile (375px), tablet (768px), desktop (1440px)
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible and clear
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Loading states for async operations
- [ ] Error states handled gracefully
- [ ] Empty states are helpful and actionable
- [ ] Animations are subtle and quick (< 300ms)
- [ ] Consistent spacing using Tailwind scale
- [ ] Typography follows scale and hierarchy
- [ ] Matches existing TripFlow patterns
- [ ] Screenshot tested at all breakpoints
