# Itinerary Supabase Sync - Test Plan

> **Status**: Ready for Testing
> **Date**: 2026-01-05
> **Purpose**: Verify all itinerary operations sync correctly with Supabase database

---

## Prerequisites

1. ✅ Dev server running on http://localhost:3001
2. ✅ Supabase migrations applied:
   - `20260105100000_add_activity_fields.sql` (activity_type, start_time, end_time, cost, icon_name)
3. ✅ Updated mutation hooks use correct schema (trip_id + activity_date)
4. 🔲 Access to Supabase dashboard to verify database changes

---

## Test Scenarios

### 1. Add Phase (Day Plan) ✅

**Test Steps:**
1. Open an existing trip in the app
2. Navigate to Itinerary tab
3. Click "Add Phase" button
4. Select a date for the new day
5. Confirm the phase is created

**Expected Behavior:**
- ✅ Phase appears immediately in UI (optimistic update)
- ✅ New row inserted in `day_plans` table with:
  - `trip_id`: Current trip ID
  - `date`: Selected date
  - `id`: Generated UUID

**Verify in Supabase:**
```sql
SELECT * FROM day_plans
WHERE trip_id = 'YOUR_TRIP_ID'
ORDER BY date;
```

---

### 2. Delete Phase (Day Plan) ✅

**Test Steps:**
1. In Itinerary tab, find a day plan with no activities
2. Click delete button for that phase
3. Confirm deletion

**Expected Behavior:**
- ✅ Phase disappears immediately from UI (optimistic update)
- ✅ Row deleted from `day_plans` table
- ✅ If phase had activities, they are cascaded deleted (FK constraint)

**Verify in Supabase:**
```sql
-- Should NOT return deleted phase
SELECT * FROM day_plans WHERE id = 'DELETED_PHASE_ID';

-- Activities should also be deleted
SELECT * FROM activities WHERE activity_date = 'DELETED_DATE';
```

---

### 3. Add Activity to Phase ✅

**Test Steps:**
1. In Itinerary tab, select a day
2. Click "Add Activity" button
3. Fill in activity details:
   - **Name**: "Tokyo Tower Visit"
   - **Type**: "Attraction"
   - **Start Time**: "10:00"
   - **End Time**: "12:00"
   - **Location**: "Tokyo Tower, Minato City"
   - **Cost**: 25
   - **Icon**: Auto-selected or custom
4. Save activity

**Expected Behavior:**
- ✅ Activity appears immediately in day's list (optimistic update)
- ✅ Activity sorted by start time
- ✅ New row inserted in `activities` table with ALL fields:

**Verify in Supabase:**
```sql
SELECT
  id,
  trip_id,
  activity_date,
  activity_type,
  name,
  start_time,
  end_time,
  location,
  notes,
  cost,
  icon_name,
  created_at,
  updated_at
FROM activities
WHERE name = 'Tokyo Tower Visit';
```

**Expected Database Values:**
- `trip_id`: Current trip UUID
- `activity_date`: Date of the selected day (DATE type)
- `activity_type`: "Attraction"
- `name`: "Tokyo Tower Visit"
- `start_time`: "10:00:00" (TIME type)
- `end_time`: "12:00:00" (TIME type)
- `location`: "Tokyo Tower, Minato City"
- `cost`: 25.00 (DECIMAL)
- `icon_name`: "Landmark" or selected icon
- `created_at`: Timestamp
- `updated_at`: Timestamp

---

### 4. Update Activity ✅

**Test Steps:**
1. Click edit on an existing activity
2. Change multiple fields:
   - Name: "Tokyo Tower Visit (Sunset)"
   - Type: Change to "Tour"
   - End Time: Change to "18:00"
   - Cost: Change to 35
3. Save changes

**Expected Behavior:**
- ✅ Activity updates immediately in UI (optimistic update)
- ✅ Re-sorts in time order if time changed
- ✅ Database row updated with new values
- ✅ `updated_at` timestamp refreshed

**Verify in Supabase:**
```sql
SELECT
  name,
  activity_type,
  end_time,
  cost,
  updated_at
FROM activities
WHERE id = 'ACTIVITY_ID';
```

**Check:**
- All changed fields reflect new values
- `updated_at` is more recent than `created_at`

---

### 5. Delete Activity ✅

**Test Steps:**
1. Find an activity in the list
2. Click delete button
3. Confirm deletion

**Expected Behavior:**
- ✅ Activity disappears immediately from UI (optimistic update)
- ✅ Row deleted from `activities` table

**Verify in Supabase:**
```sql
-- Should return 0 rows
SELECT * FROM activities WHERE id = 'DELETED_ACTIVITY_ID';
```

---

### 6. Quick Template Test ✅

**Test Steps:**
1. Click "Quick Templates" to expand
2. Click "Breakfast" template
3. Verify pre-filled values:
   - Name: "Breakfast"
   - Type: "Restaurant"
   - Start Time: "08:00"
   - Icon: "Coffee"
   - Duration: 1 hour (end time = 09:00)

**Expected Behavior:**
- ✅ Form auto-fills with template values
- ✅ Can customize before saving
- ✅ Saves to database with all template values

---

### 7. Error Handling & Rollback Test ✅

**Test Steps:**
1. Disconnect from internet (or block Supabase requests in DevTools)
2. Try to add a new activity
3. Observe error handling

**Expected Behavior:**
- ✅ Optimistic update shows activity immediately
- ✅ After network error, activity is REMOVED (rollback)
- ✅ Error message displayed to user
- ✅ Previous state restored exactly

**Code Reference:**
- Rollback logic: [useItineraryMutations.ts:82-88, 131-137, 210-216, 268-274, 340-346](src/hooks/useItineraryMutations.ts)

---

### 8. Time Duration Calculation Test ✅

**Test Steps:**
1. Add activity with start: "14:30", end: "17:15"
2. Verify UI shows duration: "2h 45m"
3. Edit activity to change end time to "16:00"
4. Verify duration updates to "1h 30m"

**Expected Behavior:**
- ✅ Duration calculated from start/end times
- ✅ Duration displayed in human-readable format
- ✅ Updates when times change

---

### 9. Activity Sorting Test ✅

**Test Steps:**
1. Add 3 activities with different start times:
   - Activity A: 15:00
   - Activity B: 09:00
   - Activity C: 12:00
2. Observe list order

**Expected Behavior:**
- ✅ Activities appear in chronological order:
  1. Activity B (09:00)
  2. Activity C (12:00)
  3. Activity A (15:00)

**Code Reference:**
- Sorting: [useItineraryMutations.ts:196-198, 327-328](src/hooks/useItineraryMutations.ts)

---

### 10. Cost Badge Display Test ✅

**Test Steps:**
1. Add activity with cost: 0
2. Add activity with cost: 50
3. Observe cost badge visibility

**Expected Behavior:**
- ✅ Activity with cost 0: No badge shown
- ✅ Activity with cost > 0: Yellow badge shows "$50"

**Code Reference:**
- Cost display: [ItineraryTab.tsx](components/tabs/ItineraryTab.tsx) - cost badge rendering

---

## Database Schema Verification

Run these queries in Supabase SQL Editor to verify schema:

```sql
-- Check activities table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'activities'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `id` (uuid, NOT NULL)
- `trip_id` (uuid, NOT NULL)
- `activity_date` (date, NOT NULL)
- `activity_type` (text, with CHECK constraint)
- `name` (text, NOT NULL)
- `start_time` (time without time zone)
- `end_time` (time without time zone)
- `location` (text, nullable)
- `notes` (text, nullable)
- `cost` (numeric, default 0)
- `icon_name` (text, nullable)
- `activity_time` (time, deprecated - for backward compatibility)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

```sql
-- Check activity_type constraint
SELECT
  conname,
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'activities'::regclass
  AND contype = 'c';
```

**Expected CHECK Constraint:**
```
activity_type IN ('Attraction', 'Restaurant', 'Transportation', 'Accommodation', 'Tour', 'Free time', 'Custom')
```

---

## Performance Testing

### Optimistic Updates Speed Test

**Test Steps:**
1. Click "Add Activity" → Fill form → Click Save
2. Measure time until activity appears in UI
3. Check network tab for actual database call

**Expected Behavior:**
- ✅ Activity appears in UI **instantly** (< 50ms)
- ✅ Network request completes in background (200-500ms)
- ✅ No UI blocking during save

---

## Success Criteria

- [ ] All 10 test scenarios pass
- [ ] Database schema matches expected structure
- [ ] Optimistic updates are instant
- [ ] Rollback works correctly on errors
- [ ] No console errors during operations
- [ ] Data persists after page reload

---

## Known Issues / Notes

1. **Deprecated Field**: `activity_time` column still exists for backward compatibility but is not used in new code
2. **Migration Applied**: `20260105100000_add_activity_fields.sql` must be applied before testing
3. **V2 Architecture**: Activities use `trip_id` + `activity_date` (no `day_plan_id` foreign key)

---

## Testing Checklist

```markdown
- [ ] 1. Add Phase
- [ ] 2. Delete Phase
- [ ] 3. Add Activity
- [ ] 4. Update Activity
- [ ] 5. Delete Activity
- [ ] 6. Quick Template
- [ ] 7. Error Rollback
- [ ] 8. Duration Calculation
- [ ] 9. Activity Sorting
- [ ] 10. Cost Badge Display
- [ ] Schema Verification
- [ ] Performance Check
```

---

## Test Results

**Date Tested**: _________________

**Tester**: _________________

**Browser**: _________________

**Pass/Fail**: _________________

**Notes**:
```



```

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark "Test Supabase sync for all itinerary operations" as complete
2. Consider adding E2E tests with Playwright
3. Document any edge cases discovered
4. Move on to next feature implementation

If tests fail:
1. Document exact steps to reproduce
2. Check browser console for errors
3. Check Supabase logs for database errors
4. Review mutation hooks for bugs
5. Test with simplified data first
