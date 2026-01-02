/**
 * Email OAuth Service
 * Handles Gmail OAuth2 authentication flow and token management
 *
 * Usage:
 *   const service = EmailOAuthService.getInstance();
 *   await service.connectGmail();
 *   const connections = await service.getConnections();
 */

import { supabase } from '../lib/supabase';

export interface EmailConnection {
  id: string;
  user_id: string;
  email_address: string;
  provider: 'gmail' | 'outlook';
  connection_status: 'active' | 'expired' | 'revoked' | 'error';
  last_sync_at: string | null;
  last_error: string | null;
  sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // Unix timestamp
  provider_token: string; // Google's provider token
  provider_refresh_token?: string;
}

class EmailOAuthService {
  private static instance: EmailOAuthService;

  private constructor() {}

  static getInstance(): EmailOAuthService {
    if (!EmailOAuthService.instance) {
      EmailOAuthService.instance = new EmailOAuthService();
    }
    return EmailOAuthService.instance;
  }

  /**
   * Initiate Gmail OAuth flow
   * Opens Google OAuth consent screen in popup or redirect
   */
  async connectGmail(usePopup = false): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Store current location to return after OAuth
      // Extract the hash path (e.g., "#/trip/123/documents" -> "/trip/123/documents")
      const currentPath = window.location.hash.slice(1) || '/';
      localStorage.setItem('gmail_oauth_return_path', currentPath);

      // Use Supabase's Google OAuth with Gmail scopes
      // IMPORTANT: Only request gmail.readonly (not gmail.metadata)
      // If both are requested, Gmail API enforces the most restrictive scope (metadata)
      // which doesn't support the 'q' query parameter for searching emails
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          queryParams: {
            access_type: 'offline', // Request refresh token
            prompt: 'consent', // Force consent screen to get refresh token
          },
        },
      });

      if (error) {
        console.error('[EmailOAuthService] OAuth initiation failed:', error);
        return { success: false, error: error.message };
      }

      // If using popup, Supabase handles the flow automatically
      // If using redirect, user will be redirected and we'll handle callback

      return { success: true };
    } catch (error) {
      console.error('[EmailOAuthService] Connect Gmail error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Gmail'
      };
    }
  }

  /**
   * Handle OAuth callback after user authorizes
   * Called from /auth/callback route
   */
  async handleOAuthCallback(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[EmailOAuthService] Starting OAuth callback handling...');

      // Get the OAuth session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('[EmailOAuthService] No session after OAuth:', sessionError);
        return { success: false, error: 'OAuth session not found' };
      }

      // Extract Google OAuth tokens from session
      const providerToken = session.provider_token; // Google access token
      const providerRefreshToken = session.provider_refresh_token; // Google refresh token

      console.log('[EmailOAuthService] OAuth tokens received:', {
        hasProviderToken: !!providerToken,
        providerTokenLength: providerToken?.length,
        hasRefreshToken: !!providerRefreshToken,
        refreshTokenLength: providerRefreshToken?.length,
      });

      if (!providerToken) {
        return { success: false, error: 'No provider token received' };
      }

      // Verify what scopes this token has
      console.log('[EmailOAuthService] Verifying token scopes...');
      const scopeCheck = await this.verifyProviderTokenScopes(providerToken);
      console.log('[EmailOAuthService] Token scope verification result:', scopeCheck);

      // Get user's email from Google profile
      const { data: profile } = await this.getGoogleProfile(providerToken);
      const emailAddress = profile?.email || session.user.email;

      console.log('[EmailOAuthService] Google profile email:', emailAddress);

      if (!emailAddress) {
        return { success: false, error: 'Could not get email address from Google' };
      }

      // Calculate token expiration (Google tokens expire in 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Store connection in database
      const { error: dbError } = await supabase
        .from('email_connections')
        .upsert({
          user_id: session.user.id,
          email_address: emailAddress,
          provider: 'gmail',
          connection_status: 'active',
          access_token: providerToken, // TODO: Encrypt before storage
          refresh_token: providerRefreshToken, // TODO: Encrypt before storage
          token_expires_at: expiresAt.toISOString(),
          sync_enabled: true,
          last_sync_at: null,
        }, {
          onConflict: 'user_id,email_address'
        });

      if (dbError) {
        console.error('[EmailOAuthService] Failed to store connection:', dbError);
        return { success: false, error: 'Failed to save connection' };
      }

      return { success: true };
    } catch (error) {
      console.error('[EmailOAuthService] OAuth callback error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete OAuth'
      };
    }
  }

  /**
   * Verify what scopes a provider token has
   */
  private async verifyProviderTokenScopes(accessToken: string): Promise<{
    success: boolean;
    scopes?: string[];
    hasGmailScopes?: boolean;
    error?: string;
  }> {
    try {
      // Call Google's tokeninfo endpoint
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to verify token scopes',
        };
      }

      const tokenInfo = await response.json();
      const scopeString = tokenInfo.scope || '';
      const scopes = scopeString.split(' ');

      const hasGmailReadonly = scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
      const hasGmailMetadata = scopes.includes('https://www.googleapis.com/auth/gmail.metadata');
      const hasGmailScopes = hasGmailReadonly || hasGmailMetadata;

      return {
        success: true,
        scopes,
        hasGmailScopes,
      };
    } catch (error) {
      console.error('[EmailOAuthService] Scope verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify scopes',
      };
    }
  }

  /**
   * Get user's Google profile using access token
   */
  private async getGoogleProfile(accessToken: string): Promise<{ data?: any; error?: string }> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return { error: 'Failed to fetch Google profile' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('[EmailOAuthService] Get profile error:', error);
      return { error: 'Network error fetching profile' };
    }
  }

  /**
   * Get all email connections for current user
   */
  async getConnections(): Promise<{ connections: EmailConnection[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { connections: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('email_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[EmailOAuthService] Get connections error:', error);
        return { connections: [], error: error.message };
      }

      return { connections: data || [] };
    } catch (error) {
      console.error('[EmailOAuthService] Get connections error:', error);
      return {
        connections: [],
        error: error instanceof Error ? error.message : 'Failed to get connections'
      };
    }
  }

  /**
   * Disconnect (revoke) a Gmail connection
   */
  async disconnectGmail(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the connection to revoke the token
      const { data: connection, error: fetchError } = await supabase
        .from('email_connections')
        .select('access_token')
        .eq('id', connectionId)
        .single();

      if (fetchError || !connection) {
        return { success: false, error: 'Connection not found' };
      }

      // Revoke the Google OAuth token
      if (connection.access_token) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.access_token}`, {
            method: 'POST',
          });
        } catch (revokeError) {
          console.warn('[EmailOAuthService] Token revocation failed:', revokeError);
          // Continue anyway - we'll delete from our database
        }
      }

      // Delete the connection from database
      const { error: deleteError } = await supabase
        .from('email_connections')
        .delete()
        .eq('id', connectionId);

      if (deleteError) {
        console.error('[EmailOAuthService] Delete connection error:', deleteError);
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[EmailOAuthService] Disconnect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect'
      };
    }
  }

  /**
   * Check if a connection needs token refresh
   */
  private needsRefresh(connection: EmailConnection): boolean {
    if (!connection.token_expires_at) return true;

    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const bufferMinutes = 5; // Refresh 5 minutes before expiry

    return expiresAt.getTime() - now.getTime() < bufferMinutes * 60 * 1000;
  }

  /**
   * Refresh an expired OAuth token
   * TODO: Implement token refresh logic using refresh_token
   */
  async refreshToken(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would call a Supabase Edge Function to securely refresh the token
      // The Edge Function has access to client_secret needed for refresh

      const { data, error } = await supabase.functions.invoke('refresh-gmail-token', {
        body: { connection_id: connectionId },
      });

      if (error) {
        console.error('[EmailOAuthService] Token refresh error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[EmailOAuthService] Refresh token error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh token'
      };
    }
  }

  /**
   * Enable/disable automatic email sync for a connection
   */
  async toggleSync(connectionId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('email_connections')
        .update({ sync_enabled: enabled })
        .eq('id', connectionId);

      if (error) {
        console.error('[EmailOAuthService] Toggle sync error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[EmailOAuthService] Toggle sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle sync'
      };
    }
  }
}

// Export singleton instance
export const emailOAuthService = EmailOAuthService.getInstance();

// Export for backward compatibility
export default emailOAuthService;
