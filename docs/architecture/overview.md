# Architecture Overview

> Technical architecture and design decisions for TripFlow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        TripFlow SPA                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Dashboard │  │TripDetail│  │ TripForm │  │ Settings │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐     │
│  │              React Router v7                       │     │
│  └───────────────────────┬───────────────────────────┘     │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────┐     │
│  │                   App.tsx                          │     │
│  │            (State & Trip Management)               │     │
│  └───────────────────────┬───────────────────────────┘     │
│                          │                                  │
│  ┌───────────┬───────────┼───────────┬───────────────┐     │
│  │           │           │           │               │     │
│  ▼           ▼           ▼           ▼               ▼     │
│ types.ts   data.ts   services/   utils/         hooks/     │
│ (Types)    (Mock)    (APIs)      (Helpers)      (Custom)   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   External Services   │
              │  ┌─────────────────┐  │
              │  │  Gemini API     │  │
              │  │  (AI Features)  │  │
              │  └─────────────────┘  │
              └───────────────────────┘
```

## Core Data Model

### Trip Entity (Central)

The `Trip` type is the central data structure. All features revolve around trips.

```typescript
interface Trip {
  id: string;
  name: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  type: TripType;
  coverImage: string;
  description: string;
  budget: number;

  // Sub-entities
  itinerary: DayPlan[];      // Day-by-day activities
  wishlist: WishlistPlace[]; // Places to visit
  expenses: Expense[];       // Budget tracking
  packingList: PackingItem[];// Packing checklist
  documents: TravelDocument[];// Travel docs
  collaborators: Collaborator[];// Shared access
  alerts: TravelAlert[];     // Trip alerts
  activityLogs: ActivityLog[];// Change history

  // Metadata
  ownerEmail: string;
  isPast?: boolean;
  currentUserRole?: UserRole;
}
```

### Entity Relationships

```
Trip (1)
  │
  ├── DayPlan (N)
  │     └── Activity (N)
  │
  ├── Expense (N)
  │
  ├── PackingItem (N)
  │
  ├── TravelDocument (N)
  │
  ├── WishlistPlace (N)
  │
  ├── Collaborator (N)
  │
  ├── TravelAlert (N)
  │
  └── ActivityLog (N)
```

## Component Architecture

### Page Components

```
App.tsx
├── Dashboard.tsx          # Trip list and overview
│   └── TripCard           # Individual trip summary
│
├── TripDetail.tsx         # Single trip view with tabs
│   ├── ItineraryTab.tsx   # Day-by-day planning
│   ├── BudgetTab.tsx      # Expense tracking
│   ├── PackingTab.tsx     # Packing list
│   ├── DocumentsTab.tsx   # Travel documents
│   ├── WishlistTab.tsx    # Places to visit
│   └── MapTab.tsx         # Map visualization
│
├── TripForm.tsx           # Create/edit trip
│
└── Settings.tsx           # User preferences
```

### Navigation Components

```
// Desktop (≥1024px)
Sidebar.tsx
├── Logo
├── Navigation links
└── Settings link

// Mobile (<1024px)
MobileNav.tsx
├── Bottom tab bar
└── Icon-based navigation
```

## State Management

### Current Approach: Lifted State

State is lifted to `App.tsx` and passed down as props:

```typescript
// App.tsx
const [trips, setTrips] = useState<Trip[]>(sampleTrips);

const updateTrip = (updatedTrip: Trip) => {
  setTrips(prev =>
    prev.map(t => t.id === updatedTrip.id ? updatedTrip : t)
  );
};

// Passed to children
<TripDetail
  trip={currentTrip}
  onUpdate={updateTrip}
/>
```

### Future: Backend Integration

Planned architecture with backend:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│  Supabase   │────▶│  PostgreSQL │
│   Frontend  │◀────│  (Realtime) │◀────│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│  Auth       │
                    │  (OAuth)    │
                    └─────────────┘
```

## Routing Architecture

React Router v7 with the following routes:

```
/                    → Dashboard (trip list)
/trip/:id            → TripDetail (single trip)
/trip/new            → TripForm (create)
/trip/:id/edit       → TripForm (edit)
/settings            → Settings
```

## Data Flow Patterns

### Read Flow
```
User Action → Component → Props Access → Render
```

### Write Flow
```
User Input → Event Handler → State Update → Re-render → UI Update
```

### Example: Adding an Expense

```typescript
// 1. User clicks "Add Expense" in BudgetTab
const handleAddExpense = (expense: Expense) => {
  // 2. Update trip with new expense
  const updatedTrip = {
    ...trip,
    expenses: [...trip.expenses, expense]
  };

  // 3. Call parent's update function
  onUpdateTrip(updatedTrip);

  // 4. App.tsx updates state
  // 5. TripDetail re-renders with new expense
  // 6. BudgetTab shows updated expense list
};
```

## External Integrations

### Google Gemini AI
- **Purpose**: AI-powered itinerary suggestions
- **Usage**: Optional feature in trip planning
- **Auth**: API key via environment variable
- **Location**: `services/aiPlanner.ts` (planned)

### Future Integrations
- **Maps**: Leaflet/Mapbox for MapTab
- **Weather**: OpenWeatherMap for forecasts
- **Calendar**: Google Calendar API
- **Flights**: SerpApi for price tracking

## Performance Considerations

### Current Optimizations
- React.memo for list items
- useMemo for budget calculations
- useCallback for event handlers

### Bundle Size
- Code splitting by route (planned)
- Dynamic imports for heavy components
- Tree shaking via Vite

### Rendering Performance
- Virtual scrolling for long lists (planned)
- Image lazy loading
- Debounced search inputs

## Security Architecture

### Client-Side
- Input validation on all forms
- XSS prevention via React's default escaping
- Type safety with TypeScript
- HTML sanitization with DOMPurify when rendering user HTML

### API Keys
- Environment variables via Vite
- Never committed to git
- Backend proxy planned for production

### Data Protection
- Local storage for preferences only
- No sensitive data in localStorage
- Session-based state (lost on refresh currently)

## Related Documentation

- [Component Guide](components.md)
- [Data Flow](data-flow.md)
- [Types Reference](../api/types.md)
