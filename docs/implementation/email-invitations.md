# Email Invitation System - Implementation Plan

> Complete guide for implementing real email invitations in TripFlow

## Overview

Transform the current mock invitation system into a production-ready email invitation flow with Supabase Edge Functions and Resend.

## Architecture Decision

### Recommended Stack
- **Email Service**: [Resend](https://resend.com/supabase) - Superior developer experience, modern API
- **Email Delivery**: [Supabase Edge Functions](https://supabase.com/docs/guides/functions/examples/send-emails)
- **Email Templates**: React Email (optional, for beautiful emails)
- **Authentication**: Supabase Auth with invitation links

### Why Resend over SendGrid?

Based on research:
- **Better DX**: "I've used Mailgun, Sendgrid, and Mandrill and they don't come close to providing the quality of developer experience you get with Resend"
- **Generous Free Tier**: 100 emails/day, 3,000/month (vs SendGrid's 100/day limit)
- **Modern API**: RESTful, well-documented, TypeScript-first
- **Multi-region**: "Game-changer" for global deployments
- **React Email Support**: Modern email template development

## Database Schema Changes

### 1. Trip Invitations Table

```sql
-- Store pending trip invitations
CREATE TABLE trip_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Editor', 'Viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,

  UNIQUE(trip_id, invitee_email, status) -- Prevent duplicate pending invitations
);

-- Index for looking up invitations by token
CREATE INDEX idx_trip_invitations_token ON trip_invitations(invitation_token);

-- Index for finding user's invitations
CREATE INDEX idx_trip_invitations_email ON trip_invitations(invitee_email);

-- RLS Policies
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see invitations sent to their email
CREATE POLICY "Users can view their invitations"
  ON trip_invitations FOR SELECT
  USING (invitee_email = auth.jwt() ->> 'email');

-- Trip owners/editors can create invitations
CREATE POLICY "Trip editors can create invitations"
  ON trip_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_id = trip_invitations.trip_id
        AND user_id = auth.uid()
        AND role = 'Editor'
    )
  );

-- Users can update their own invitation status (accept/decline)
CREATE POLICY "Users can update their invitation status"
  ON trip_invitations FOR UPDATE
  USING (invitee_email = auth.jwt() ->> 'email')
  WITH CHECK (invitee_email = auth.jwt() ->> 'email');
```

### 2. Notification Preferences Table (Future Enhancement)

```sql
CREATE TABLE user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_invitations BOOLEAN DEFAULT true,
  email_trip_updates BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Steps

### Phase 1: Setup Email Service

#### 1.1 Create Resend Account
1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain (e.g., `tripflow.app`)
3. Generate API key

#### 1.2 Configure Supabase Edge Function

Create `supabase/functions/send-invitation/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

interface InvitationRequest {
  tripId: string
  inviteeEmail: string
  role: 'Editor' | 'Viewer'
  tripName: string
  inviterName: string
}

serve(async (req) => {
  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with user's auth
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const { tripId, inviteeEmail, role, tripName, inviterName }: InvitationRequest = await req.json()

    // Validate inputs
    if (!tripId || !inviteeEmail || !role || !tripName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has permission to invite (must be Editor)
    const { data: membership } = await supabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'Editor') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('trip_invitations')
      .insert({
        trip_id: tripId,
        invited_by: user.id,
        invitee_email: inviteeEmail.toLowerCase().trim(),
        role: role
      })
      .select()
      .single()

    if (invitationError) {
      // Check if duplicate invitation
      if (invitationError.code === '23505') {
        return new Response(JSON.stringify({ error: 'User already invited' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      throw invitationError
    }

    // Generate invitation link
    const invitationUrl = `${Deno.env.get('APP_URL')}/accept-invitation?token=${invitation.invitation_token}`

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'TripFlow <invitations@tripflow.app>',
        to: [inviteeEmail],
        subject: `${inviterName} invited you to join ${tripName} on TripFlow`,
        html: generateInvitationEmail({
          inviterName,
          tripName,
          role,
          invitationUrl,
          expiresAt: invitation.expires_at
        })
      })
    })

    if (!emailRes.ok) {
      const error = await emailRes.text()
      console.error('Resend error:', error)
      throw new Error('Failed to send email')
    }

    const emailData = await emailRes.json()

    return new Response(JSON.stringify({
      success: true,
      invitationId: invitation.id,
      emailId: emailData.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function generateInvitationEmail({ inviterName, tripName, role, invitationUrl, expiresAt }) {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trip Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

                <!-- Header -->
                <tr>
                  <td style="padding: 48px 48px 32px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 24px 24px 0 0;">
                    <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">🌍 TripFlow</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 48px;">
                    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px; font-weight: 600;">
                      You're invited to join a trip!
                    </h2>

                    <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                      <strong style="color: #1e293b;">${inviterName}</strong> has invited you to collaborate on
                      <strong style="color: #667eea;">${tripName}</strong> as a <strong>${role}</strong>.
                    </p>

                    <div style="background-color: #f1f5f9; border-radius: 16px; padding: 24px; margin: 32px 0;">
                      <p style="margin: 0 0 12px; color: #475569; font-size: 14px; font-weight: 600;">
                        ${role === 'Editor' ? '✏️ Editor Access' : '👁️ Viewer Access'}
                      </p>
                      <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                        ${role === 'Editor'
                          ? 'You can view and edit the trip itinerary, budget, and all other details.'
                          : 'You can view the trip details but cannot make changes.'}
                      </p>
                    </div>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 16px 0;">
                          <a href="${invitationUrl}"
                             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 32px 0 0; color: #94a3b8; font-size: 14px; text-align: center;">
                      This invitation expires on ${expiryDate}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 48px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                    <p style="margin: 0; color: #cbd5e1; font-size: 12px;">
                      © ${new Date().getFullYear()} TripFlow. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}
```

#### 1.3 Set Environment Variables

```bash
# In Supabase Dashboard > Edge Functions > Secrets
RESEND_API_KEY=re_your_api_key_here
APP_URL=https://tripflow.app  # Your production URL
```

### Phase 2: Frontend Implementation

#### 2.1 Create Invitation Service

Create `src/services/invitationService.ts`:

```typescript
import { supabase } from './supabaseClient'

export interface SendInvitationParams {
  tripId: string
  inviteeEmail: string
  role: 'Editor' | 'Viewer'
  tripName: string
  inviterName: string
}

export interface InvitationResponse {
  success: boolean
  invitationId?: string
  emailId?: string
  error?: string
}

export const invitationService = {
  /**
   * Send a trip invitation via email
   */
  async sendInvitation(params: SendInvitationParams): Promise<InvitationResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await supabase.functions.invoke('send-invitation', {
        body: params,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (response.error) {
        return { success: false, error: response.error.message }
      }

      return response.data as InvitationResponse
    } catch (error) {
      console.error('Failed to send invitation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Get pending invitations for current user
   */
  async getMyInvitations() {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select(`
        *,
        trip:trips(name, destinations, coverImage),
        inviter:auth.users!invited_by(email)
      `)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch invitations:', error)
      return []
    }

    return data || []
  },

  /**
   * Accept a trip invitation
   */
  async acceptInvitation(invitationToken: string) {
    try {
      // Get invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('trip_invitations')
        .select('*')
        .eq('invitation_token', invitationToken)
        .eq('status', 'pending')
        .single()

      if (fetchError || !invitation) {
        return { success: false, error: 'Invalid or expired invitation' }
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false, error: 'This invitation has expired' }
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // User not logged in - redirect to sign up/login
        return {
          success: false,
          error: 'Please sign in to accept invitation',
          requiresAuth: true
        }
      }

      // Check if invitee email matches current user
      if (user.email?.toLowerCase() !== invitation.invitee_email.toLowerCase()) {
        return {
          success: false,
          error: 'This invitation was sent to a different email address'
        }
      }

      // Add user to trip
      const { error: memberError } = await supabase
        .from('trip_members')
        .insert({
          trip_id: invitation.trip_id,
          user_id: user.id,
          role: invitation.role
        })

      if (memberError) {
        // User might already be a member
        if (memberError.code === '23505') {
          return { success: false, error: 'You are already a member of this trip' }
        }
        throw memberError
      }

      // Mark invitation as accepted
      await supabase
        .from('trip_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      return {
        success: true,
        tripId: invitation.trip_id
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Decline a trip invitation
   */
  async declineInvitation(invitationToken: string) {
    const { error } = await supabase
      .from('trip_invitations')
      .update({ status: 'declined' })
      .eq('invitation_token', invitationToken)
      .eq('status', 'pending')

    return { success: !error, error: error?.message }
  }
}
```

#### 2.2 Update TripDetail Component

Modify the invite logic in `components/TripDetail.tsx`:

```typescript
import { invitationService } from '../src/services/invitationService'

// Replace the existing invite button onClick handler
const handleSendInvitation = async () => {
  if (!inviteEmail) return

  setIsInviting(true)
  try {
    const result = await invitationService.sendInvitation({
      tripId: trip.id,
      inviteeEmail: inviteEmail,
      role: inviteRole,
      tripName: trip.name,
      inviterName: currentUser.email
    })

    if (result.success) {
      // Show success message
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')

      // Optionally add to pending invitations list in UI
      // (They won't be in collaborators until they accept)
    } else {
      toast.error(result.error || 'Failed to send invitation')
    }
  } catch (error) {
    console.error('Invitation error:', error)
    toast.error('Failed to send invitation')
  } finally {
    setIsInviting(false)
  }
}
```

#### 2.3 Create Invitation Acceptance Page

Create `components/AcceptInvitation.tsx`:

```typescript
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { invitationService } from '../src/services/invitationService'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'

export function AcceptInvitation() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [tripId, setTripId] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Invalid invitation link')
      return
    }

    acceptInvitation(token)
  }, [searchParams])

  const acceptInvitation = async (token: string) => {
    const result = await invitationService.acceptInvitation(token)

    if (result.success) {
      setStatus('success')
      setMessage('Successfully joined the trip!')
      setTripId(result.tripId)

      // Redirect to trip after 2 seconds
      setTimeout(() => {
        navigate(`/trip/${result.tripId}/itinerary`)
      }, 2000)
    } else {
      setStatus('error')
      setMessage(result.error || 'Failed to accept invitation')

      // If requires auth, redirect to login
      if (result.requiresAuth) {
        setTimeout(() => {
          navigate(`/login?redirect=/accept-invitation?token=${token}`)
        }, 2000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-3xl p-12 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-brand-primary animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold mb-2 text-slate-900 dark:text-white">
              Processing Invitation
            </h2>
            <p className="text-slate-500">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold mb-2 text-slate-900 dark:text-white">
              Welcome Aboard!
            </h2>
            <p className="text-slate-500">{message}</p>
            <p className="text-sm text-slate-400 mt-4">Redirecting you to the trip...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold mb-2 text-slate-900 dark:text-white">
              Oops!
            </h2>
            <p className="text-slate-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-brand-primary text-white rounded-2xl font-medium hover:scale-105 transition-all"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

### Phase 3: Testing & Deployment

#### 3.1 Local Testing

```bash
# Deploy Edge Function locally
supabase functions serve send-invitation --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-invitation \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "...",
    "inviteeEmail": "test@example.com",
    "role": "Editor",
    "tripName": "Tokyo Adventure",
    "inviterName": "John Doe"
  }'
```

#### 3.2 Production Deployment

```bash
# Deploy Edge Function
supabase functions deploy send-invitation

# Set production secrets
supabase secrets set RESEND_API_KEY=your_production_key
supabase secrets set APP_URL=https://tripflow.app
```

## Security Considerations

### 1. Rate Limiting
Implement rate limiting to prevent spam:

```typescript
// In Edge Function - add before sending email
const { data: recentInvites } = await supabase
  .from('trip_invitations')
  .select('id')
  .eq('invited_by', user.id)
  .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute

if (recentInvites && recentInvites.length >= 5) {
  return new Response(JSON.stringify({
    error: 'Too many invitations. Please wait before sending more.'
  }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 2. Email Validation
Always validate email addresses:

```typescript
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

### 3. Prevent Self-Invitation
```typescript
if (inviteeEmail.toLowerCase() === user.email?.toLowerCase()) {
  return new Response(JSON.stringify({
    error: 'You cannot invite yourself'
  }), { status: 400 })
}
```

### 4. Clean Up Expired Invitations
Create a database function to auto-expire old invitations:

```sql
-- Run daily via pg_cron
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE trip_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

## Future Enhancements

### 1. Email Notifications
- Trip updates (new activities, budget changes)
- Reminders (upcoming trip, packing deadlines)
- Real-time collaboration notifications

### 2. Advanced Features
- Bulk invitations (CSV upload)
- Custom invitation messages
- Invitation analytics (opened, clicked, accepted)
- Resend invitation option

### 3. React Email Templates
Upgrade to [React Email](https://react.email/) for more maintainable templates:

```bash
npm install react-email @react-email/components
```

## Cost Estimation

### Resend Pricing
- **Free Tier**: 3,000 emails/month, 100/day
- **Pro Tier**: $20/month for 50,000 emails
- **Business**: Custom pricing

### Typical Usage (100 active users)
- 50 invitations/month
- 200 notification emails/month
- **Total**: ~250 emails/month
- **Cost**: $0 (within free tier)

## Sources & References

- [Sending Emails with Supabase](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Resend + Supabase Integration](https://resend.com/supabase)
- [Supabase Edge Functions](https://resend.com/docs/send-with-supabase-edge-functions)
- [Magic Link Best Practices](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Invitation API Reference](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Status**: Ready for Implementation
**Estimated Time**: 8-12 hours
**Complexity**: Medium
**Priority**: High
