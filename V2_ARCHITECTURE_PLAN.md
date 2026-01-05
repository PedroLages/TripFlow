# TripFlow V2 - Architecture & Implementation Plan

> Comprehensive plan for rebuilding TripFlow with lessons learned from V1

## Executive Summary

V2 will be a **monorepo-based architecture** with maximum code sharing between web and mobile platforms, proper backend logic in Supabase Edge Functions, real-time collaboration features, and production-ready authentication.

**Key Improvements:**
- 90% code sharing between platforms vs 0% in V1
- Proper authentication with social login
- Real-time collaboration with Supabase Realtime
- Offline-first architecture with local caching
- AI-powered trip planning (Gemini integration)
- Production-ready error handling and monitoring

---

## 1. Architecture Overview

### Monorepo Structure

```
TripFlow/
├── apps/
│   ├── web/                    # React web app (keep existing)
│   ├── mobile/                 # React Native (iOS + Android) - IN PROGRESS
│   ├── ios/                    # Native SwiftUI (optional premium version)
│   └── admin/                  # Admin dashboard (future)
│
├── packages/
│   ├── shared/                 # ✅ DONE - Types, utils
│   │   ├── types/              # TypeScript definitions
│   │   ├── api/                # Supabase client setup
│   │   ├── utils/              # Business logic utilities
│   │   └── validators/         # Zod schemas for validation
│   │
│   ├── ui/                     # NEXT - Shared React components
│   │   ├── components/         # Form inputs, buttons, cards
│   │   ├── layouts/            # Screen layouts
│   │   ├── navigation/         # Navigation components
│   │   └── theme/              # Design tokens, colors, spacing
│   │
│   ├── services/               # NEXT - Business logic layer
│   │   ├── trips/              # Trip CRUD operations
│   │   ├── auth/               # Authentication helpers
│   │   ├── collaboration/      # Real-time collaboration
│   │   ├── ai/                 # Gemini AI integration
│   │   └── storage/            # File upload/download
│   │
│   └── config/                 # Shared configuration
│       ├── constants.ts        # App-wide constants
│       ├── env.ts              # Environment validation
│       └── feature-flags.ts    # Feature toggles
│
├── supabase/
│   ├── functions/              # Edge Functions (backend logic)
│   │   ├── create-trip/        # Trip creation with validation
│   │   ├── invite-collaborator/# Invitation system
│   │   ├── generate-itinerary/ # AI itinerary generation
│   │   └── process-document/   # Document OCR/parsing
│   │
│   └── migrations/             # Database migrations
│       ├── 00001_initial.sql
│       ├── 00002_collaboration.sql
│       └── 00003_realtime.sql
│
└── infrastructure/
    ├── terraform/              # Infrastructure as code
    └── scripts/                # Deployment scripts
```

---

## 2. V1 Issues & V2 Solutions

### Issue 1: Code Duplication (Web + iOS)

**V1 Problem:**
- Trip validation logic duplicated in React and Swift
- Budget calculations implemented twice
- Date formatting inconsistent between platforms

**V2 Solution:**
```typescript
// packages/services/trips/validation.ts
import { z } from 'zod';

export const TripSchema = z.object({
  name: z.string().min(1, 'Trip name required').max(100),
  destinations: z.array(z.string()).min(1, 'At least one destination'),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  budget: z.number().nonnegative().optional(),
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
});

// Used by web, mobile, and Edge Functions
export const validateTrip = (data: unknown) => TripSchema.parse(data);
```

**Benefits:**
- ✅ Validate once, works everywhere
- ✅ Consistent error messages
- ✅ Automatic TypeScript types from Zod schema

---

### Issue 2: No Real Authentication

**V1 Problem:**
- Database has `user_id` fields but no login UI
- No password reset, email verification
- No social login (Google, Apple)

**V2 Solution:**

**Database Schema:**
```sql
-- supabase/migrations/00002_auth_profiles.sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Shared Auth Service:**
```typescript
// packages/services/auth/index.ts
import { getSupabase } from '@tripflow/shared';

export const authService = {
  async signInWithGoogle() {
    const supabase = getSupabase();
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  async signInWithApple() {
    const supabase = getSupabase();
    return supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  async signInWithEmail(email: string, password: string) {
    const supabase = getSupabase();
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, fullName: string) {
    const supabase = getSupabase();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
  },

  async signOut() {
    const supabase = getSupabase();
    return supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    const supabase = getSupabase();
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },

  // Get current user
  async getCurrentUser() {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = getSupabase();
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  },
};
```

**React Hook (Web + Mobile):**
```typescript
// packages/ui/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from '@tripflow/services';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false));

    // Listen for changes
    const { data: { subscription } } = authService.onAuthStateChange(setUser);

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    signInWithGoogle: authService.signInWithGoogle,
    signInWithApple: authService.signInWithApple,
    signInWithEmail: authService.signInWithEmail,
    signUp: authService.signUp,
    signOut: authService.signOut,
    resetPassword: authService.resetPassword,
  };
}
```

---

### Issue 3: No Backend Validation

**V1 Problem:**
- All validation happens in frontend (can be bypassed)
- No server-side business rules
- Direct database access from clients

**V2 Solution: Edge Functions with RLS**

```sql
-- Row Level Security
alter table trips enable row level security;

-- Users can only see trips they own or are invited to
create policy "Users can view their trips"
  on trips for select
  using (
    user_id = auth.uid()
    or id in (
      select trip_id from trip_collaborators
      where user_id = auth.uid()
    )
  );

-- Only owners can delete trips
create policy "Owners can delete trips"
  on trips for delete
  using (user_id = auth.uid());
```

```typescript
// supabase/functions/create-trip/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TripSchema } from '@tripflow/shared';

serve(async (req) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Parse and validate input
    const body = await req.json();
    const validatedData = TripSchema.parse(body);

    // Business logic: Check user's trip limit
    const { count } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count >= 50) {
      return new Response(
        JSON.stringify({ error: 'Trip limit reached (max 50)' }),
        { status: 400 }
      );
    }

    // Create trip
    const { data: trip, error } = await supabase
      .from('trips')
      .insert([{ ...validatedData, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ trip }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});
```

---

### Issue 4: No Collaboration Features

**V1 Problem:**
- Design doc mentions collaboration but not implemented
- No way to share trips with others
- No real-time updates

**V2 Solution: Real-time Collaboration**

**Database Schema:**
```sql
-- Trip collaborators
create table trip_collaborators (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique(trip_id, user_id)
);

-- Enable realtime
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table trip_collaborators;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table activities;
```

**Collaboration Service:**
```typescript
// packages/services/collaboration/index.ts
import { getSupabase } from '@tripflow/shared';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const collaborationService = {
  // Invite someone to a trip
  async inviteCollaborator(
    tripId: string,
    email: string,
    role: 'editor' | 'viewer'
  ) {
    const supabase = getSupabase();

    // Call Edge Function to send invitation
    const { data, error } = await supabase.functions.invoke('invite-collaborator', {
      body: { tripId, email, role },
    });

    if (error) throw error;
    return data;
  },

  // Subscribe to trip changes
  subscribeToTrip(
    tripId: string,
    onUpdate: (payload: any) => void
  ): RealtimeChannel {
    const supabase = getSupabase();

    return supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `trip_id=eq.${tripId}`,
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `trip_id=eq.${tripId}`,
        },
        onUpdate
      )
      .subscribe();
  },

  // Get active collaborators
  async getActiveCollaborators(tripId: string) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('trip_collaborators')
      .select('*, profiles(*)')
      .eq('trip_id', tripId)
      .not('accepted_at', 'is', null);

    if (error) throw error;
    return data;
  },
};
```

**React Hook for Real-time:**
```typescript
// packages/ui/hooks/useRealtimeTrip.ts
import { useEffect, useState } from 'react';
import { collaborationService } from '@tripflow/services';
import type { Trip } from '@tripflow/shared';

export function useRealtimeTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);

  useEffect(() => {
    // Subscribe to changes
    const channel = collaborationService.subscribeToTrip(tripId, (payload) => {
      console.log('Trip updated:', payload);
      // Refetch trip data or update optimistically
    });

    // Load initial collaborators
    collaborationService
      .getActiveCollaborators(tripId)
      .then(setCollaborators);

    return () => {
      channel.unsubscribe();
    };
  }, [tripId]);

  return { trip, collaborators };
}
```

---

### Issue 5: No Offline Support

**V1 Problem:**
- App requires internet connection
- No local caching
- Poor UX on slow connections

**V2 Solution: Offline-First Architecture**

```typescript
// packages/services/trips/offline.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@tripflow/shared';
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEY = 'tripflow:trips';
const PENDING_ACTIONS_KEY = 'tripflow:pending';

export const offlineService = {
  // Check network status
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  },

  // Get trips with offline fallback
  async getTrips() {
    const isOnline = await this.isOnline();

    if (isOnline) {
      // Online: fetch from Supabase
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Cache the results
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        return data;
      }
    }

    // Offline: return cached data
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  },

  // Queue action for when back online
  async queueAction(action: {
    type: 'create' | 'update' | 'delete';
    table: string;
    data: any;
  }) {
    const pending = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
    const actions = pending ? JSON.parse(pending) : [];
    actions.push({ ...action, timestamp: Date.now() });
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
  },

  // Sync pending actions when back online
  async syncPendingActions() {
    const isOnline = await this.isOnline();
    if (!isOnline) return;

    const pending = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
    if (!pending) return;

    const actions = JSON.parse(pending);
    const supabase = getSupabase();

    for (const action of actions) {
      try {
        if (action.type === 'create') {
          await supabase.from(action.table).insert([action.data]);
        } else if (action.type === 'update') {
          await supabase
            .from(action.table)
            .update(action.data)
            .eq('id', action.data.id);
        } else if (action.type === 'delete') {
          await supabase.from(action.table).delete().eq('id', action.data.id);
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }

    // Clear pending actions
    await AsyncStorage.removeItem(PENDING_ACTIONS_KEY);
  },
};

// Auto-sync when network becomes available
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    offlineService.syncPendingActions();
  }
});
```

---

### Issue 6: No AI Integration

**V1 Problem:**
- Gemini API key in .env but not used
- No AI-powered features

**V2 Solution: AI Itinerary Generation**

```typescript
// supabase/functions/generate-itinerary/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

serve(async (req) => {
  try {
    const { tripId, destinations, startDate, endDate, interests } = await req.json();

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Create a detailed travel itinerary for a trip to ${destinations.join(', ')}
from ${startDate} to ${endDate}.

Traveler interests: ${interests.join(', ')}

Please provide:
1. Daily activities with specific timings
2. Restaurant recommendations for each meal
3. Estimated costs in USD
4. Transportation suggestions
5. Insider tips for each location

Format the response as JSON with this structure:
{
  "days": [
    {
      "date": "2024-06-15",
      "activities": [
        {
          "time": "09:00",
          "title": "Visit Eiffel Tower",
          "description": "...",
          "duration": 120,
          "cost": 25,
          "category": "sightseeing"
        }
      ]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const itinerary = JSON.parse(text);

    // Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase
      .from('activities')
      .insert(
        itinerary.days.flatMap((day: any) =>
          day.activities.map((activity: any) => ({
            trip_id: tripId,
            ...activity,
            date: day.date,
          }))
        )
      );

    if (error) throw error;

    return new Response(JSON.stringify({ itinerary }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

---

## 3. Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Set up monorepo structure
- [x] Extract shared package
- [x] Set up React Native app
- [x] Configure Metro Bundler
- [x] Create navigation structure
- [ ] Set up testing infrastructure (Jest, React Native Testing Library)
- [ ] Set up CI/CD pipelines

### Phase 2: Authentication (Week 3)
- [ ] Implement auth screens (Login, Signup, Reset Password)
- [ ] Add Google OAuth
- [ ] Add Apple Sign In
- [ ] Create auth state management
- [ ] Add protected routes

### Phase 3: Core Features (Weeks 4-6)
- [ ] Migrate web app to use `@tripflow/services`
- [ ] Implement offline support
- [ ] Add real-time collaboration
- [ ] Build collaboration UI (invitations, permissions)
- [ ] File upload with progress tracking

### Phase 4: AI Features (Week 7)
- [ ] Itinerary generation
- [ ] Budget optimization suggestions
- [ ] Smart packing list recommendations
- [ ] Destination insights

### Phase 5: Polish & Launch (Week 8)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Mixpanel or PostHog)
- [ ] Performance monitoring
- [ ] App Store preparation
- [ ] Beta testing

---

## 4. Migration Strategy

### Option A: Big Bang (Not Recommended)
- Shut down V1, launch V2 all at once
- ❌ Risky, no fallback
- ❌ Users lose access during migration

### Option B: Gradual Migration (Recommended)
1. **Week 1**: Launch V2 mobile app alongside V1 web
2. **Week 2-3**: Migrate users to V2 web app feature-by-feature
3. **Week 4**: Sunset V1 when V2 reaches feature parity
4. **Week 5+**: V2-only features (collaboration, AI)

### Data Migration
```typescript
// scripts/migrate-v1-to-v2.ts
import { createClient } from '@supabase/supabase-js';

async function migrateTrips() {
  const supabase = createClient(URL, KEY);

  // Get all V1 trips
  const { data: trips } = await supabase.from('trips').select('*');

  for (const trip of trips) {
    // Transform V1 schema to V2
    const v2Trip = {
      ...trip,
      // Add new required fields
      currency: trip.currency || 'USD',
      trip_type: trip.type || 'Solo',
      cover_image: trip.imageUrl || trip.cover_image,
      // Remove deprecated fields
      type: undefined,
      imageUrl: undefined,
    };

    await supabase.from('trips').upsert(v2Trip);
  }
}
```

---

## 5. Cost Estimation

### Infrastructure Costs (Monthly)

| Service | V1 Cost | V2 Cost | Notes |
|---------|---------|---------|-------|
| Supabase | $25/mo | $25/mo | Pro plan |
| Edge Functions | Free | Free | < 500K requests/mo |
| Storage | Free | $0.02/GB | Document uploads |
| Realtime | Free | Free | < 200 concurrent |
| **Total** | **$25** | **~$30** | +$5 for storage |

### Development Costs

| Phase | Estimated Hours | Notes |
|-------|----------------|-------|
| Setup | 40h | Monorepo, CI/CD |
| Auth | 60h | OAuth, screens, flows |
| Core Features | 120h | CRUD, realtime, offline |
| AI Integration | 40h | Gemini API, Edge Functions |
| Polish | 60h | Testing, optimization |
| **Total** | **320h** | ~8 weeks with 1 dev |

---

## 6. Success Metrics

### Technical Metrics
- **Code Sharing**: > 85% code shared between web/mobile
- **Bundle Size**: < 2MB (mobile), < 500KB (web)
- **Load Time**: < 2s (web), < 1s (mobile app start)
- **Offline Support**: 100% read operations, 80% write operations queued
- **Test Coverage**: > 80%

### User Metrics
- **Crash-Free Rate**: > 99.5%
- **Monthly Active Users**: Track growth
- **Collaboration**: % of trips with > 1 collaborator
- **AI Usage**: % of trips using AI itinerary

---

## 7. Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| React Native performance issues | Medium | High | Keep native iOS as fallback |
| Supabase scaling limits | Low | High | Plan for migration to custom backend |
| Offline sync conflicts | High | Medium | Implement CRDT or last-write-wins |
| AI hallucinations | Medium | Low | Add human review step |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users reject V2 | Low | High | Gradual migration, feature flags |
| Development delays | Medium | Medium | Phased rollout, MVP first |
| Cost overruns | Medium | Low | Monitor Supabase usage |

---

## 8. Next Steps

1. **Immediate (This Week)**
   - [ ] Complete React Native authentication flow
   - [ ] Add login/signup screens
   - [ ] Test trip creation end-to-end

2. **Short Term (Next 2 Weeks)**
   - [ ] Create `packages/ui` with shared components
   - [ ] Create `packages/services` with business logic
   - [ ] Migrate web app to use shared services

3. **Medium Term (Next Month)**
   - [ ] Implement real-time collaboration
   - [ ] Add offline support
   - [ ] Integrate AI itinerary generation

4. **Long Term (Next Quarter)**
   - [ ] Launch V2 mobile app (iOS + Android)
   - [ ] Migrate web users to V2
   - [ ] Sunset V1
   - [ ] Add V2-exclusive features

---

## Conclusion

V2 with a **monorepo + React Native approach** is the best path forward because:

1. ✅ **Fixes all V1 issues** (duplication, no auth, no collaboration)
2. ✅ **90% code sharing** vs 0% in V1
3. ✅ **iOS + Android** from single codebase
4. ✅ **Production-ready** (auth, offline, realtime, AI)
5. ✅ **Scalable architecture** for future growth

The React Native foundation we just built is the right first step. We should continue building on this foundation rather than starting over with a different approach.
