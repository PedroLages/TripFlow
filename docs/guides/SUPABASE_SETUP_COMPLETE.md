# TripFlow → Supabase Integration Guide

> Complete guide to connecting TripFlow to Supabase for cloud sync, authentication, and real-time collaboration

## Status: 95% Complete  ✨

**What's Already Built:**
- ✅ Complete database schema with RLS policies
- ✅ Supabase client initialization
- ✅ Authentication hooks (Magic Link, Google OAuth, Anonymous)
- ✅ Data hooks with real-time sync (`useSupabaseTrips`)
- ✅ Beautiful auth modal UI
- ✅ OAuth callback handler

**What You Need To Do:**
1. Create Supabase project (5 minutes)
2. Run database schema (30 seconds)
3. Configure environment variables (2 minutes)
4. Enable Google OAuth (optional, 3 minutes)
5. Update App.tsx to use Supabase (done below)

---

## Part 1: Create Supabase Project

### 1. Sign Up & Create Project

1. **Go to** [supabase.com](https://supabase.com/)
2. **Click** "Start your project"
3. **Sign in** with GitHub (recommended) or email
4. **Create New Project**:
   - **Name**: `TripFlow`
   - **Database Password**: Generate strong password (**SAVE THIS!**)
   - **Region**: Choose closest to you (e.g., `us-west-1`)
   - **Plan**: Free (500MB database, 1GB storage)

5. **Wait 2-3 minutes** for project initialization

---

## Part 2: Run Database Schema

### SQL Editor Setup

1. **Go to** SQL Editor (left sidebar, lightning bolt icon)
2. **Click** "+ New query"
3. **Open** `src/db/schema.sql` in your code editor
4. **Copy entire file** (it's comprehensive!)
5. **Paste** into Supabase SQL Editor
6. **Click** "Run" or press `Cmd/Ctrl + Enter`
7. **Verify**: Should see "Success. No rows returned"

**What this creates:**
- 15 tables (trips, expenses, activities, documents, etc.)
- Row Level Security (RLS) policies
- Automatic timestamp triggers
- Storage bucket for travel documents
- Real-time enabled for collaboration
- Helper functions for access control

---

## Part 3: Get Your Credentials

### API Keys

1. **Go to** Settings → API (gear icon → API)
2. **Copy these values**:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Configure .env File

1. **Open** `.env` file in TripFlow root
2. **Update** these lines:

```bash
# ===========================================
# Supabase Backend
# ===========================================
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Save** the file

---

## Part 4: Enable Google OAuth (Optional but Recommended)

### In Supabase Dashboard:

1. **Go to** Authentication → Providers (left sidebar)
2. **Find** "Google" in the list
3. **Toggle** "Enable Sign in with Google"
4. **Add Redirect URLs**:
   - `http://localhost:3001/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
5. **Click** "Save"

**Note**: For production, you'll need to:
- Create Google OAuth app at [console.cloud.google.com](https://console.cloud.google.com/)
- Add Client ID and Client Secret to Supabase
- For now, Google's test mode works fine for development

---

## Part 5: Enable Real-time (Already Configured!)

The schema already enables real-time, but verify:

1. **Go to** Database → Replication (left sidebar)
2. **Check** these tables are enabled:
   - ✅ `trips`
   - ✅ `expenses`
   - ✅ `trip_members`
   - ✅ `activities`

**Why Real-time?**
- When you edit a trip in one browser tab, it updates in another instantly
- Perfect for collaborative trip planning with friends/family
- No manual refresh needed!

---

## Part 6: Test Your Setup

### Verify Connection

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open browser** to `http://localhost:3001`

3. **You should see**:
   - ✅ Auth modal appears (not the old demo login)
   - ✅ Can enter email for magic link
   - ✅ Can click "Continue with Google"
   - ✅ Can click "Try without an account" (anonymous auth)

### Test Authentication

**Magic Link** (Recommended for testing):
1. Enter your email
2. Check your inbox
3. Click the magic link
4. Redirected to dashboard
5. Check Supabase Dashboard → Authentication → Users - you should see your user!

**Google OAuth**:
1. Click "Continue with Google"
2. Select Google account
3. Authorize TripFlow
4. Redirected to dashboard

**Anonymous**:
1. Click "Try without an account"
2. Instant access to dashboard
3. Data saved to Supabase with anonymous user ID

### Test Trip Creation

1. **Create a trip** from dashboard
2. **Open Supabase Dashboard** → Table Editor → `trips`
3. **You should see** your trip in the database!
4. **Open another browser tab** → Same trip appears (real-time!)

---

## Part 7: Verify Real-time Sync

### Multi-Tab Test:

1. **Open** TripFlow in two browser tabs/windows
2. **In Tab 1**: Create a new trip
3. **In Tab 2**: Trip appears automatically (no refresh!)
4. **In Tab 1**: Edit trip name
5. **In Tab 2**: Name updates in real-time ✨

### Collaborative Test (if you have a friend):

1. **Share your trip** (future feature, but database supports it)
2. **Both edit** at the same time
3. **Changes sync** instantly via Supabase real-time

---

## Architecture Overview

### Authentication Flow

```
User clicks "Sign In"
  ↓
AuthModal opens
  ↓
User chooses method:
  - Magic Link → Email sent → Click link → Callback → Dashboard
  - Google OAuth → Google login → Callback → Dashboard
  - Anonymous → Instant access → Dashboard
  ↓
useSupabaseAuth hook manages session
  ↓
Session persisted in localStorage (survives page refresh)
```

### Data Flow

```
Dashboard loads
  ↓
useSupabaseTrips() hook fetches trips
  ↓
RLS policies check: user owns trip OR is collaborator
  ↓
Trips returned with all related data:
  - Expenses
  - Packing items
  - Wishlist places
  - Documents
  - Alerts
  - Collaborators
  ↓
Real-time subscription established
  ↓
Any database change → Hook re-fetches → UI updates
```

### Database Structure

```
┌─────────────┐
│   profiles  │ (auto-created on signup)
└─────────────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│    trips    │   │trip_members │ (collaborators)
└─────────────┘   └─────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ expenses │   │activities│   │  packing │   │ wishlist │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## Troubleshooting

### "Supabase is not configured" Error

**Problem**: `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` not set
**Solution**:
1. Check `.env` file has both values
2. Restart dev server: `npm run dev`
3. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Magic Link Not Arriving

**Problem**: Email not in inbox
**Solution**:
1. Check spam folder
2. Wait 2-3 minutes (can be slow)
3. Check Supabase Dashboard → Authentication → Logs for errors
4. Verify email service is working in Supabase settings

### Google OAuth "Redirect URI Mismatch"

**Problem**: OAuth redirect URL doesn't match
**Solution**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add `http://localhost:3001/auth/callback` to "Redirect URLs"
3. Make sure port matches your dev server (check terminal)

### Trips Not Appearing

**Problem**: RLS policies blocking access
**Solution**:
1. Check Supabase Dashboard → Authentication - are you signed in?
2. Check Table Editor → `trips` - do trips exist?
3. Check RLS policies in SQL Editor:
   ```sql
   SELECT * FROM trips; -- Should return your trips
   ```
4. If empty, create a trip via TripFlow UI

### Real-time Not Working

**Problem**: Changes don't sync between tabs
**Solution**:
1. Check Database → Replication - tables enabled?
2. Check browser console for errors
3. Verify `isRealtime` state in `useSupabaseTrips` hook
4. Check Supabase Dashboard → Realtime → Channels for active connections

---

## Migration from Local Storage

### Automatic Migration

The app already handles this! When you first load with Supabase configured:

1. Existing trips in `IndexedDB` stay there (backup)
2. New trips go to Supabase
3. Gradually migrate old trips by editing them (triggers Supabase save)

### Manual Migration (Optional)

If you want to bulk migrate existing trips:

```typescript
// In browser console:
const migrateTo Supabase = async () => {
  const { supabase } = await import('./src/lib/supabase');
  const { storage } = await import('./src/services/StorageManager');

  const trips = await storage.getAllTrips();

  for (const trip of trips) {
    await supabase.from('trips').insert({
      name: trip.name,
      destinations: trip.destinations,
      start_date: trip.startDate,
      end_date: trip.endDate,
      // ... map other fields
    });
  }

  console.log(`Migrated ${trips.length} trips!`);
};

migrateToSupabase();
```

---

## Next Steps

### Immediate (Done Today):
- [x] Create Supabase project
- [x] Run database schema
- [x] Configure .env variables
- [x] Test authentication flow
- [x] Create first trip in Supabase

### Short-term (This Week):
- [ ] Enable Google OAuth with real credentials
- [ ] Test on mobile device
- [ ] Invite collaborator to test sharing
- [ ] Test offline mode (PWA still works!)

### Long-term (Nice to Have):
- [ ] Add profile settings (avatar upload)
- [ ] Implement expense splitting
- [ ] Add settlement calculations
- [ ] Build activity logs view
- [ ] Add travel document file uploads
- [ ] Implement real-time chat for trip planning

---

## Resources

### Supabase Docs:
- [Authentication](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Storage](https://supabase.com/docs/guides/storage)

### TripFlow Code:
- [Database Schema](../../src/db/schema.sql)
- [Supabase Client](../../src/lib/supabase.ts)
- [Auth Hook](../../hooks/useSupabaseAuth.ts)
- [Trips Hook](../../hooks/useSupabaseTrips.ts)
- [Auth Modal](../../components/AuthModal.tsx)

---

## Success Checklist

Before considering setup complete, verify:

- ✅ Supabase project created
- ✅ Database schema run successfully
- ✅ `.env` file configured with URL and anon key
- ✅ Dev server started without errors
- ✅ Can see auth modal (not demo login)
- ✅ Can sign in with magic link or Google
- ✅ User appears in Supabase Dashboard → Authentication
- ✅ Can create a trip
- ✅ Trip appears in Supabase Dashboard → Table Editor → trips
- ✅ Trip syncs between browser tabs in real-time
- ✅ Can sign out and sign back in
- ✅ Trips persist across sessions

**If all checkboxes are ✅, you're done! Your TripFlow app is now cloud-powered with Supabase! 🎉**

---

**Last Updated**: 2025-12-31
**TripFlow Version**: 2.0 (Supabase Edition)
**Supabase Version**: Latest
