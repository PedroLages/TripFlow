# TypeScript Types Reference

> Complete reference for all TypeScript interfaces in TripFlow

## Overview

All types are defined in `/types.ts`. Always import types from this file:

```typescript
import type { Trip, Expense, Activity } from './types';
```

## Core Types

### Trip

The central entity that contains all trip-related data.

```typescript
interface Trip {
  id: string;                    // Unique identifier
  name: string;                  // Trip name
  destinations: string[];        // List of destinations
  startDate: string;             // ISO date string
  endDate: string;               // ISO date string
  type: TripType;                // Trip category
  coverImage: string;            // Cover image URL
  description: string;           // Trip description
  budget: number;                // Total budget amount
  itinerary: DayPlan[];          // Day-by-day plans
  wishlist: WishlistPlace[];     // Places to visit
  expenses: Expense[];           // Budget expenses
  packingList: PackingItem[];    // Packing items
  documents: TravelDocument[];   // Travel documents
  collaborators: Collaborator[]; // Shared users
  alerts: TravelAlert[];         // Trip alerts
  activityLogs: ActivityLog[];   // Activity history
  ownerEmail: string;            // Trip owner
  isPast?: boolean;              // Past trip flag
  currentUserRole?: UserRole;    // Current user's role
}
```

### TripType

```typescript
type TripType = 'Solo' | 'Couple' | 'Family' | 'Friends' | 'Business';
```

### UserRole

```typescript
type UserRole = 'Editor' | 'Viewer';
```

## Itinerary Types

### DayPlan

```typescript
interface DayPlan {
  id: string;
  date: string;          // ISO date
  activities: Activity[];
}
```

### Activity

```typescript
interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  startTime: string;     // HH:mm format
  endTime: string;       // HH:mm format
  location: string;
  notes: string;
  cost: number;
  iconName?: string;     // Lucide icon name
}
```

### ActivityType

```typescript
type ActivityType =
  | 'Attraction'
  | 'Restaurant'
  | 'Transportation'
  | 'Accommodation'
  | 'Tour'
  | 'Free time'
  | 'Custom';
```

## Budget Types

### Expense

```typescript
interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;          // ISO date
  notes: string;
}

type ExpenseCategory =
  | 'Flights'
  | 'Accommodation'
  | 'Food'
  | 'Activities'
  | 'Transport'
  | 'Shopping'
  | 'Other';
```

## Document Types

### TravelDocument

```typescript
interface TravelDocument {
  id: string;
  type: DocumentType;
  title: string;
  details: string;
  confirmation: string;  // Confirmation number
  price?: number;
  date?: string;
  status?: string;
  gate?: string;
  lastUpdated?: string;
}

type DocumentType = 'Flight' | 'Hotel' | 'Car' | 'Insurance' | 'Contact';
```

## Other Types

### PackingItem

```typescript
interface PackingItem {
  id: string;
  name: string;
  category: string;
  isPacked: boolean;
}
```

### WishlistPlace

```typescript
interface WishlistPlace {
  id: string;
  name: string;
  category: WishlistCategory;
  notes: string;
  rating: number;        // 1-5
}

type WishlistCategory = 'Must See' | 'Maybe' | 'Restaurant' | 'Shopping';
```

### Collaborator

```typescript
interface Collaborator {
  email: string;
  role: UserRole;
  avatar: string;
  isOwner?: boolean;
}
```

### TravelAlert

```typescript
interface TravelAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  date: string;
}

type AlertType = 'Flight' | 'Event' | 'Strike' | 'Weather';
```

### ActivityLog

```typescript
interface ActivityLog {
  id: string;
  userEmail: string;
  action: string;
  timestamp: string;     // ISO datetime
}
```

## User Types

### User

```typescript
interface User {
  email: string;
  name: string;
  avatar: string;
}
```

### UserSettings

```typescript
interface UserSettings {
  name: string;
  email: string;
  homeLocation: string;
  currency: string;
  theme: 'light' | 'dark';
}
```

## Usage Examples

### Creating a New Trip

```typescript
const newTrip: Trip = {
  id: crypto.randomUUID(),
  name: 'Paris Adventure',
  destinations: ['Paris, France'],
  startDate: '2025-06-15',
  endDate: '2025-06-22',
  type: 'Couple',
  coverImage: '/images/paris.jpg',
  description: 'A romantic week in Paris',
  budget: 3000,
  itinerary: [],
  wishlist: [],
  expenses: [],
  packingList: [],
  documents: [],
  collaborators: [],
  alerts: [],
  activityLogs: [],
  ownerEmail: 'user@example.com'
};
```

### Adding an Expense

```typescript
const expense: Expense = {
  id: crypto.randomUUID(),
  amount: 150.00,
  category: 'Food',
  date: '2025-06-16',
  notes: 'Dinner at Le Jules Verne'
};
```

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [CLAUDE.md](../../CLAUDE.md) - Coding standards
