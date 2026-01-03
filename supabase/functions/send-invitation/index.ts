import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface InvitationRequest {
  tripId: string;
  inviteeEmail: string;
  role: 'Editor' | 'Viewer';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 2. Parse and validate request body
    const { tripId, inviteeEmail, role }: InvitationRequest = await req.json();

    if (!tripId || !inviteeEmail || !role) {
      throw new Error('Missing required fields: tripId, inviteeEmail, role');
    }

    if (!['Editor', 'Viewer'].includes(role)) {
      throw new Error('Invalid role. Must be Editor or Viewer');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteeEmail)) {
      throw new Error('Invalid email address');
    }

    // Prevent self-invitation
    if (inviteeEmail.toLowerCase() === user.email?.toLowerCase()) {
      throw new Error('You cannot invite yourself to a trip');
    }

    // 3. Check if user is Editor of this trip
    const { data: membership, error: membershipError } = await supabaseClient
      .from('trip_members')
      .select('role, trips!inner(name, owner_id)')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      throw new Error('Trip not found or access denied');
    }

    // @ts-ignore - trips is a joined relation
    const tripName = membership.trips.name;
    // @ts-ignore
    const ownerId = membership.trips.owner_id;
    const isOwner = ownerId === user.id;

    if (membership.role !== 'Editor' && !isOwner) {
      throw new Error('Only Editors can send invitations');
    }

    // 4. Rate limiting: Check how many invitations user has sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentInvitationsCount, error: countError } = await supabaseClient
      .from('trip_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('invited_by', user.id)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Error checking rate limit:', countError);
      // Don't fail the request if count check fails
    } else if (recentInvitationsCount && recentInvitationsCount >= 20) {
      throw new Error('Rate limit exceeded. You can send a maximum of 20 invitations per hour.');
    }

    // 5. Check if invitation already exists
    const { data: existingInvitation } = await supabaseClient
      .from('trip_invitations')
      .select('id, status')
      .eq('trip_id', tripId)
      .eq('invitee_email', inviteeEmail)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvitation) {
      throw new Error('An active invitation already exists for this email');
    }

    // 6. Create invitation record
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('trip_invitations')
      .insert({
        trip_id: tripId,
        invited_by: user.id,
        invitee_email: inviteeEmail,
        role: role,
        status: 'pending',
      })
      .select('id, invitation_token, expires_at')
      .single();

    if (invitationError || !invitation) {
      throw new Error('Failed to create invitation');
    }

    // 7. Generate invitation URL
    const baseUrl = Deno.env.get('APP_URL') || 'https://trip.pedrolages.net';
    const invitationUrl = `${baseUrl}/accept-invitation?token=${invitation.invitation_token}`;

    // 8. Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'hello@trip.pedrolages.net';

    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trip Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🌍 TripFlow Invitation
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
                You've been invited to collaborate
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Hi there! 👋
              </p>
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                You've been invited to join the trip <strong style="color: #667eea;">${escapeHtml(tripName)}</strong> as a <strong>${escapeHtml(role)}</strong>.
              </p>

              <div style="background-color: #f1f5f9; border-left: 4px solid #667eea; padding: 16px 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #1e293b;">Your Role:</strong> ${escapeHtml(role)}
                </p>
                <p style="margin: 8px 0 0; color: #475569; font-size: 13px;">
                  ${role === 'Editor'
                    ? '✏️ You can view and edit all trip details, itineraries, budgets, and collaborate with other members.'
                    : '👁️ You can view all trip details, itineraries, and budgets (read-only access).'}
                </p>
              </div>

              <p style="margin: 30px 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Click the button below to accept the invitation:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${invitationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 10px; color: #64748b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; padding: 12px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #667eea; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
                ${invitationUrl}
              </p>

              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                  ⏰ This invitation expires in 7 days.
                </p>
                <p style="margin: 12px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                Sent by <strong style="color: #667eea;">TripFlow</strong> — Smart trip planning, together.
              </p>
              <p style="margin: 10px 0 0; color: #cbd5e1; font-size: 12px;">
                © 2025 TripFlow. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailText = `
TripFlow Invitation

You've been invited to join the trip "${tripName}" as a ${role}.

Your Role: ${role}
${role === 'Editor'
  ? 'You can view and edit all trip details, itineraries, budgets, and collaborate with other members.'
  : 'You can view all trip details, itineraries, and budgets (read-only access).'}

Accept the invitation by clicking this link:
${invitationUrl}

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
Sent by TripFlow — Smart trip planning, together.
© 2025 TripFlow. All rights reserved.
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: inviteeEmail,
        subject: `You're invited to ${escapeHtml(tripName)} on TripFlow 🌍`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`);
    }

    const emailData = await emailResponse.json();

    // 9. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        invitationId: invitation.id,
        emailId: emailData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-invitation function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 :
                error.message.includes('access denied') ? 403 : 500,
      }
    );
  }
});
