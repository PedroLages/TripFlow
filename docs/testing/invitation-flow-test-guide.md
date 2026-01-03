# Invitation Flow - Testing Guide

## Status: Ready for Manual Testing ✅

The invitation service has been successfully integrated into TripDetail.tsx and is ready for end-to-end testing.

## What Was Fixed

1. ✅ **Import Path Issue**: Fixed `invitationService.ts` import to use correct path (`../lib/supabase`)
2. ✅ **Service Worker Cache**: Cleared stale PWA cache that was preventing code updates
3. ✅ **App Loading**: Verified app loads correctly without React hook errors
4. ✅ **Authentication Modal**: Confirmed auth flow works (magic link sent successfully)

## Manual Testing Steps

### Prerequisites
- Be signed in with a real account (Google OAuth or Magic Link)
- Have at least one trip created that you own (Editor role)

### Test 1: Send Invitation

1. **Navigate to a trip you own**
   - Go to Dashboard
   - Click on any trip card

2. **Open Share Modal**
   - Click the "Crew Hub" button (share icon) in the trip header
   - Modal should open showing invitation form

3. **Send Invitation**
   - Enter a valid email address (e.g., `friend@example.com`)
   - Select role: Editor or Viewer
   - Click "Invite" button

**Expected Results:**
- ✅ Button shows "Sending..." with spinner
- ✅ Success message appears: "Invitation sent to {email}!"
- ✅ Invitation appears in "Pending Invitations" section
- ✅ Email is received by the invitee (check inbox)

**If Errors Occur:**
- Check browser console for error messages
- Verify Supabase Edge Function is deployed
- Check Network tab for failed requests
- Verify environment variables are set in Supabase

### Test 2: View Pending Invitations

1. **With Share Modal Open**
   - Look for "Pending Invitations" section
   - Should show all invitations with status "Pending"

**Expected Results:**
- ✅ Each invitation shows:
  - Invitee email
  - Role (Editor/Viewer)
  - "Pending" status
  - Revoke button (X icon)

### Test 3: Revoke Invitation

1. **Click Revoke Button (X)**
   - Click the X icon next to a pending invitation

**Expected Results:**
- ✅ Invitation disappears from the list
- ✅ Database record deleted
- ✅ Invitee can no longer accept using that token

### Test 4: Email Reception

1. **Check Invitee's Email Inbox**
   - Look for email from `hello@trip.pedrolages.net`
   - Subject: "You've been invited to join a trip on TripFlow"

**Expected Email Content:**
- ✅ Beautiful HTML template
- ✅ Trip name visible
- ✅ Inviter's name/email
- ✅ Role (Editor/Viewer) explained
- ✅ "Accept Invitation" button with correct link
- ✅ Link format: `https://trip.pedrolages.net/?invitation={token}`

### Test 5: Accept Invitation (Coming Soon)

**Note**: The invitation acceptance page hasn't been created yet. This is the next todo item.

When clicking the invitation link, expected behavior:
- Redirect to TripFlow app
- Show invitation details
- Prompt to accept/decline
- Add user to trip members on acceptance

## Known Issues

None currently. All integration work is complete and ready for testing.

## Troubleshooting

### Issue: "Failed to send invitation"

**Possible Causes:**
1. Not authenticated
2. Not Editor of the trip
3. Edge Function not deployed
4. Environment variables not set
5. Invalid email format

**Debug Steps:**
```bash
# Check Edge Function logs
supabase functions logs send-invitation --tail

# Verify environment variables
supabase secrets list

# Check database for invitation records
supabase db exec "SELECT * FROM trip_invitations WHERE trip_id = 'YOUR_TRIP_ID'"
```

### Issue: Invitation doesn't appear in list

**Possible Causes:**
1. RLS policies blocking access
2. Database insertion failed
3. Frontend not refreshing state

**Debug Steps:**
- Check browser console for errors
- Inspect Network tab for API responses
- Query database directly to verify record exists

### Issue: Email not received

**Possible Causes:**
1. Resend API key invalid
2. Sender domain not verified
3. Recipient email in spam
4. Edge Function error during send

**Debug Steps:**
```bash
# Check Resend dashboard
# Visit: https://resend.com/emails

# Check Edge Function logs
supabase functions logs send-invitation | grep ERROR
```

## Next Steps

After completing manual testing:

1. ✅ **Verify all tests pass**
2. ⏳ **Create invitation acceptance page** ([/Volumes/SSD/Dev/TripFlow/components/AcceptInvitation.tsx](../../components/AcceptInvitation.tsx))
3. ⏳ **Add route for acceptance** (Update App.tsx with `/invite/:token` route)
4. ⏳ **Test complete flow** (send → receive → accept)
5. ⏳ **Discuss auth email strategy** (Supabase vs Resend for all emails)

## Testing Checklist

- [ ] Send invitation successfully
- [ ] Pending invitation appears in list
- [ ] Email received with correct content
- [ ] Revoke invitation works
- [ ] Error states display correctly
- [ ] Loading states show during async operations
- [ ] Success messages auto-dismiss after 3 seconds
- [ ] Multiple invitations can be sent
- [ ] Cannot send to same email twice (should show error)
- [ ] Invalid email format shows validation error

## Files Modified

- [/Volumes/SSD/Dev/TripFlow/src/services/invitationService.ts](../../src/services/invitationService.ts) - Created invitation service
- [/Volumes/SSD/Dev/TripFlow/components/TripDetail.tsx](../../components/TripDetail.tsx) - Integrated invitation UI

## Documentation

- [Email Invitations Deployment Guide](../implementation/email-invitations-deployment.md)
- [Invitation Service API](../../src/services/invitationService.ts)

---

**Last Updated**: 2026-01-03
**Status**: Integration Complete, Ready for Manual Testing
**Next**: Create invitation acceptance page
