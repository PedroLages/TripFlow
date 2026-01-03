# Email Invitations - Deployment Guide

This guide walks you through deploying the email invitation system to Supabase.

## Prerequisites

- ✅ Resend account created and API key generated
- ✅ Domain verified in Resend (trip.pedrolages.net)
- ✅ Sender email configured (hello@trip.pedrolages.net)
- ✅ `.env` file updated with Resend credentials
- ✅ Edge Function created (`send-invitation`)
- ✅ Database migration created (`trip_invitations` table)

## Step 1: Set Environment Variables in Supabase

Your Edge Function needs access to the Resend API key. Set these in Supabase:

### Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **TripFlow**
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Add the following secrets:

   | Secret Name | Value |
   |-------------|-------|
   | `RESEND_API_KEY` | `re_kN3ZnELu_6vyCFtyiZ1LvJmgzwWRNYU1G` |
   | `RESEND_FROM_EMAIL` | `hello@trip.pedrolages.net` |
   | `APP_URL` | `https://trip.pedrolages.net` |

### Using Supabase CLI (Alternative)

```bash
# Set secrets via CLI
supabase secrets set RESEND_API_KEY=re_kN3ZnELu_6vyCFtyiZ1LvJmgzwWRNYU1G
supabase secrets set RESEND_FROM_EMAIL=hello@trip.pedrolages.net
supabase secrets set APP_URL=https://trip.pedrolages.net
```

---

## Step 2: Run Database Migration

Apply the `trip_invitations` table migration:

### Using Supabase Dashboard

1. Go to **Database** → **SQL Editor**
2. Click **+ New query**
3. Copy the contents of `/supabase/migrations/20260103_trip_invitations.sql`
4. Paste into the editor and click **Run**

### Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref xnmbvjlhwrukliuzhhvf

# Run migrations
supabase db push
```

**Verify Migration Success:**

Run this query in SQL Editor to confirm the table was created:

```sql
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'trip_invitations'
ORDER BY ordinal_position;
```

---

## Step 3: Deploy Edge Function

Deploy the `send-invitation` Edge Function to Supabase:

```bash
# Deploy the function
supabase functions deploy send-invitation

# Expected output:
# Deploying send-invitation (project ref: xnmbvjlhwrukliuzhhvf)
# Packaged function send-invitation (X KB)
# Deployed function send-invitation
# Function URL: https://xnmbvjlhwrukliuzhhvf.supabase.co/functions/v1/send-invitation
```

**Test Deployment:**

```bash
# Test the function with a sample request
curl -X POST \
  'https://xnmbvjlhwrukliuzhhvf.supabase.co/functions/v1/send-invitation' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tripId": "test-trip-id",
    "inviteeEmail": "test@example.com",
    "role": "Viewer"
  }'
```

---

## Step 4: Verify RLS Policies

Ensure Row Level Security policies are active:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'trip_invitations';

-- List all policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'trip_invitations';
```

Expected policies:
- ✅ Trip Editors can view invitations
- ✅ Users can view their own invitations
- ✅ Public can view invitations by token
- ✅ Trip Editors can create invitations
- ✅ Users can update their own invitations
- ✅ Trip Editors can delete invitations

---

## Step 5: Test the Complete Flow

### Test 1: Send Invitation

1. Open your TripFlow app
2. Navigate to a trip you own
3. Click "Crew Hub" (share button)
4. Enter an email and role
5. Click "Invite"

**Expected Result:**
- ✅ Invitation created in database
- ✅ Email sent to recipient
- ✅ No errors in console

### Test 2: Accept Invitation

1. Check the recipient's email inbox
2. Open the invitation email
3. Click "Accept Invitation" button
4. Should redirect to app and show success

**Expected Result:**
- ✅ User added as trip member
- ✅ Invitation status changed to "accepted"
- ✅ User can access the trip

### Test 3: Expired Invitation

1. Manually set `expires_at` to past date in database:
   ```sql
   UPDATE trip_invitations
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE id = 'YOUR_INVITATION_ID';
   ```
2. Try to accept the invitation

**Expected Result:**
- ❌ Error: "Invitation has expired"

---

## Troubleshooting

### Issue: "Failed to send email"

**Possible Causes:**
1. Resend API key not set or incorrect
2. Sender email not verified
3. Recipient email invalid

**Fix:**
```bash
# Check secrets are set
supabase secrets list

# Verify sender domain in Resend dashboard
# Check function logs
supabase functions logs send-invitation
```

### Issue: "Unauthorized" or "Access denied"

**Possible Causes:**
1. User not authenticated
2. User is not Editor of the trip
3. RLS policies not applied correctly

**Fix:**
```sql
-- Verify user membership
SELECT * FROM trip_members
WHERE trip_id = 'YOUR_TRIP_ID' AND user_id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'trip_invitations';
```

### Issue: Migration fails

**Possible Causes:**
1. Table already exists
2. Constraint conflicts
3. Missing dependencies (trips or auth.users table)

**Fix:**
```sql
-- Drop table if exists (WARNING: This deletes data)
DROP TABLE IF EXISTS trip_invitations CASCADE;

-- Re-run the migration
```

---

## Monitoring & Maintenance

### View Recent Invitations

```sql
SELECT
  ti.id,
  ti.invitee_email,
  ti.role,
  ti.status,
  ti.created_at,
  ti.expires_at,
  t.name as trip_name,
  u.email as invited_by_email
FROM trip_invitations ti
JOIN trips t ON t.id = ti.trip_id
JOIN auth.users u ON u.id = ti.invited_by
ORDER BY ti.created_at DESC
LIMIT 20;
```

### Clean Up Expired Invitations

```sql
-- Mark expired invitations
UPDATE trip_invitations
SET status = 'expired'
WHERE status = 'pending' AND expires_at < NOW();

-- Delete old expired invitations (older than 30 days)
DELETE FROM trip_invitations
WHERE status = 'expired' AND expires_at < NOW() - INTERVAL '30 days';
```

### Monitor Email Sending

Check Edge Function logs:

```bash
# View recent logs
supabase functions logs send-invitation --tail

# View logs with errors only
supabase functions logs send-invitation | grep ERROR
```

---

## Next Steps

Once deployment is complete:

1. ✅ Test invitation flow end-to-end
2. ⏳ Create frontend invitation acceptance page ([AcceptInvitation.tsx](../components/AcceptInvitation.tsx))
3. ⏳ Add invitation service to frontend ([invitationService.ts](../../src/services/invitationService.ts))
4. ⏳ Update TripDetail.tsx to use real invitation system (replace mock)
5. ⏳ Add rate limiting (optional, for production)

---

## Security Checklist

Before going to production:

- [ ] Resend API key stored in Supabase Secrets (not in code)
- [ ] RLS policies tested and verified
- [ ] Email validation implemented
- [ ] Token expiration working (7 days)
- [ ] Rate limiting considered (optional)
- [ ] CORS headers configured correctly
- [ ] Error messages don't leak sensitive info
- [ ] Invitation links use HTTPS
- [ ] Sender domain has SPF/DKIM records

---

## Cost Monitoring

**Resend Free Tier:**
- 3,000 emails/month
- ≈ 100 emails/day

**Expected Usage:**
- ~10-20 invitations/day
- Well within free tier

**Monitor:**
- Check Resend dashboard monthly
- Set up alerts in Resend for 80% usage

---

**Deployment Status:** ✅ Deployed Successfully

**Deployment Date:** 2026-01-03

**Deployed Components:**
- ✅ Database migration (`trip_invitations` table with RLS policies)
- ✅ Edge Function (`send-invitation`)
- ✅ Resend email service configured
- ✅ Environment secrets set

**Function URL:** `https://xnmbvjlhwrukliuzhhvf.supabase.co/functions/v1/send-invitation`

**Last Updated:** 2026-01-03
