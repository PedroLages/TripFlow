/**
 * Invitation Service
 *
 * Handles trip invitation operations via Supabase Edge Function
 * and database queries for invitation management.
 */

import { supabase } from '../lib/supabase';

export interface InvitationRequest {
  tripId: string;
  inviteeEmail: string;
  role: 'Editor' | 'Viewer';
}

export interface InvitationResponse {
  success: boolean;
  message?: string;
  error?: string;
  invitationId?: string;
  emailId?: string;
}

export interface TripInvitation {
  id: string;
  trip_id: string;
  invited_by: string;
  invitee_email: string;
  role: 'Editor' | 'Viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitation_token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
}

/**
 * Send a trip invitation via email
 */
export async function sendInvitation(
  request: InvitationRequest
): Promise<InvitationResponse> {
  try {
    // Get the current session and refresh if needed
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return {
        success: false,
        error: 'You must be signed in to send invitations'
      };
    }

    console.log('[Invitation] Sending with session:', {
      hasSession: !!session,
      hasAccessToken: !!session.access_token,
      tokenLength: session.access_token?.length
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: request
      // Note: Don't manually set Authorization header - Supabase client handles this automatically
    });

    if (error) {
      console.error('Edge Function error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return {
        success: false,
        error: error.message || error.context?.message || 'Failed to send invitation'
      };
    }

    if (!data.success) {
      console.error('Edge Function returned error:', data.error);
      return {
        success: false,
        error: data.error || 'Failed to send invitation'
      };
    }

    return {
      success: true,
      message: data.message,
      invitationId: data.invitationId,
      emailId: data.emailId
    };
  } catch (error) {
    console.error('Invitation service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get all invitations for a trip (for trip editors)
 */
export async function getTripInvitations(
  tripId: string
): Promise<{ success: boolean; invitations?: TripInvitation[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      invitations: data as TripInvitation[]
    };
  } catch (error) {
    console.error('Get invitations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Accept an invitation by token
 */
export async function acceptInvitation(
  token: string
): Promise<{ success: boolean; tripId?: string; role?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('accept_invitation', {
      p_invitation_token: token
    });

    if (error) {
      console.error('Accept invitation error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true,
      tripId: result.trip_id,
      role: result.role
    };
  } catch (error) {
    console.error('Accept invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Revoke/delete an invitation (for trip editors)
 */
export async function revokeInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('trip_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Revoke invitation error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Revoke invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get invitation by token (for preview before accepting)
 */
export async function getInvitationByToken(
  token: string
): Promise<{ success: boolean; invitation?: TripInvitation; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Invitation not found or has expired'
        };
      }
      console.error('Get invitation error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      invitation: data as TripInvitation
    };
  } catch (error) {
    console.error('Get invitation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
