/**
 * Email Scanner Service
 *
 * Handles email scanning workflow:
 * 1. Fetch emails from Gmail API using OAuth tokens
 * 2. Send emails to email-parser Edge Function
 * 3. Process parsed results and create travel documents
 * 4. Handle duplicate detection
 *
 * Usage:
 *   const scanner = EmailScannerService.getInstance();
 *   await scanner.scanEmails(connectionId);
 */

import { supabase, getSupabase } from '../lib/supabase';
import { documentMatchingService } from './DocumentMatchingService';

export interface EmailScanResult {
  total_scanned: number;
  successful_parses: number;
  failed_parses: number;
  duplicates_found: number;
  documents_created: number;
  errors: string[];
}

export interface ParsedEmail {
  id: string;
  detected_type: string;
  confidence: number;
  summary: string;
  booking_data: any;
  email_subject: string;
  email_from: string;
  email_date: string;
  user_action: 'imported' | 'ignored' | 'pending';
}

class EmailScannerService {
  private static instance: EmailScannerService;

  private constructor() {}

  static getInstance(): EmailScannerService {
    if (!EmailScannerService.instance) {
      EmailScannerService.instance = new EmailScannerService();
    }
    return EmailScannerService.instance;
  }

  /**
   * Fetch recent emails from Gmail and parse them
   */
  async scanEmails(
    connectionId: string,
    options: {
      maxResults?: number;
      query?: string;
      daysBack?: number;
    } = {}
  ): Promise<{ success: boolean; result?: EmailScanResult; error?: string }> {
    try {
      const { maxResults = 50, query = '', daysBack = 30 } = options;

      // Get connection with OAuth tokens
      const { data: connection, error: connError } = await supabase
        .from('email_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connError || !connection) {
        return { success: false, error: 'Email connection not found' };
      }

      if (connection.connection_status !== 'active') {
        return { success: false, error: 'Email connection is not active. Please reconnect.' };
      }

      // Build Gmail API query
      const afterDate = new Date();
      afterDate.setDate(afterDate.getDate() - daysBack);
      const afterDateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/');

      // Search for common booking confirmation keywords
      const searchQuery = query || `after:${afterDateStr} (confirmation OR booking OR reservation OR ticket OR itinerary OR receipt)`;

      // Fetch emails from Gmail API
      const gmailResponse = await this.fetchGmailMessages(
        connection.access_token,
        searchQuery,
        maxResults
      );

      if (!gmailResponse.success || !gmailResponse.messages) {
        return {
          success: false,
          error: gmailResponse.error || 'Failed to fetch emails from Gmail',
        };
      }

      // Parse each email
      const result: EmailScanResult = {
        total_scanned: gmailResponse.messages.length,
        successful_parses: 0,
        failed_parses: 0,
        duplicates_found: 0,
        documents_created: 0,
        errors: [],
      };

      // P1 FIX: Process emails in batches to respect Gemini API rate limits
      // Even with retry logic, batching prevents hitting limits in the first place
      const BATCH_SIZE = 10; // Process 10 emails at a time
      const BATCH_DELAY_MS = 5000; // 5 second delay between batches

      for (let i = 0; i < gmailResponse.messages.length; i++) {
        const message = gmailResponse.messages[i];

        try {
          // Check if already parsed (use maybeSingle to avoid 406 when no rows found)
          const { data: existing } = await supabase
            .from('parsed_emails')
            .select('id')
            .eq('connection_id', connectionId)
            .eq('email_id', message.id)
            .maybeSingle();

          if (existing) {
            result.duplicates_found++;
            continue;
          }

          // Parse the email
          const parseResult = await this.parseEmail(connectionId, message);

          if (parseResult.success) {
            result.successful_parses++;

            // Try to match the parsed email to a trip
            console.log(`[EmailScannerService] Attempting to match parsed email ${parseResult.parsed_email_id} to trips`);
            const matchResult = await documentMatchingService.matchDocumentToTrips(
              parseResult.parsed_email_id!,
              connection.user_id
            );

            console.log(`[EmailScannerService] Match result: ${matchResult.action} (${matchResult.confidence}% confidence)`);

            // Auto-import high-confidence bookings that are matched to a trip
            // Note: RLS policy requires a valid trip_id, so we only import matched documents
            if (
              parseResult.confidence &&
              parseResult.confidence >= 0.8 &&
              matchResult.action === 'auto_assigned' &&
              matchResult.tripId
            ) {
              const importResult = await this.importToDocuments(
                parseResult.parsed_email_id!,
                connection.user_id
              );

              if (importResult.success) {
                result.documents_created++;
              }
            }
          } else {
            result.failed_parses++;
            result.errors.push(`${message.subject}: ${parseResult.error}`);
          }
        } catch (emailError) {
          result.failed_parses++;
          result.errors.push(
            `Error processing email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
          );
        }

        // Add delay between batches to respect API rate limits
        if ((i + 1) % BATCH_SIZE === 0 && i + 1 < gmailResponse.messages.length) {
          console.log(`[EmailScannerService] Processed ${i + 1}/${gmailResponse.messages.length} emails. Waiting ${BATCH_DELAY_MS/1000}s before next batch...`);
          await this.delay(BATCH_DELAY_MS);
        }
      }

      // Update connection last_sync_at
      await supabase
        .from('email_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connectionId);

      return { success: true, result };
    } catch (error) {
      console.error('[EmailScannerService] Scan emails error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scan emails',
      };
    }
  }

  /**
   * Re-match existing parsed emails to trips using updated matching logic
   *
   * This is useful when:
   * - The matching algorithm has been improved
   * - Emails were parsed before matching logic was fixed
   * - User wants to re-run matching on existing emails
   */
  async rematchParsedEmails(
    connectionId: string
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const supabase = getSupabase();

      // Get the connection to verify ownership
      const { data: connection, error: connError } = await supabase
        .from('email_connections')
        .select('user_id')
        .eq('id', connectionId)
        .single();

      if (connError || !connection) {
        return { success: false, error: 'Email connection not found' };
      }

      // Fetch all parsed emails for this connection
      const { data: parsedEmails, error: fetchError } = await supabase
        .from('parsed_emails')
        .select('id, email_subject, parsed_data, detected_type, parsing_confidence, trip_id')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[EmailScannerService] Error fetching parsed emails:', fetchError);
        return { success: false, error: 'Failed to fetch parsed emails' };
      }

      if (!parsedEmails || parsedEmails.length === 0) {
        return {
          success: true,
          result: {
            total_emails: 0,
            rematched: 0,
            newly_matched: 0,
            auto_imported: 0,
          }
        };
      }

      console.log(`[EmailScannerService] Re-matching ${parsedEmails.length} parsed emails...`);

      const result = {
        total_emails: parsedEmails.length,
        rematched: 0,
        newly_matched: 0,
        auto_imported: 0,
        errors: [] as string[],
      };

      // Re-match each email
      for (const email of parsedEmails) {
        try {
          console.log(`[EmailScannerService] Re-matching email: ${email.email_subject}`);

          // Run matching logic
          const matchResult = await documentMatchingService.matchDocumentToTrips(
            email.id,
            connection.user_id
          );

          console.log(`[EmailScannerService] Match result: ${matchResult.action} (${matchResult.confidence}% confidence)`);

          result.rematched++;

          // Track if this is a newly matched email (previously had no trip_id)
          if (matchResult.tripId && !email.trip_id) {
            result.newly_matched++;
          }

          // Auto-import high-confidence matches
          if (
            email.parsing_confidence >= 0.8 &&
            matchResult.action === 'auto_assigned' &&
            matchResult.tripId
          ) {
            const importResult = await this.importToDocuments(
              email.id,
              connection.user_id
            );

            if (importResult.success) {
              result.auto_imported++;
              console.log(`[EmailScannerService] Auto-imported email ${email.id} to trip ${matchResult.tripId}`);
            }
          }
        } catch (emailError) {
          const errorMsg = `Error re-matching "${email.email_subject}": ${
            emailError instanceof Error ? emailError.message : 'Unknown error'
          }`;
          console.error(`[EmailScannerService] ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }

      console.log(`[EmailScannerService] Re-match complete:`, result);
      return { success: true, result };
    } catch (error) {
      console.error('[EmailScannerService] Re-match error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to re-match emails',
      };
    }
  }

  /**
   * Fetch messages from Gmail API
   */
  private async fetchGmailMessages(
    accessToken: string,
    query: string,
    maxResults: number
  ): Promise<{ success: boolean; messages?: any[]; error?: string }> {
    try {
      // First, verify token scopes
      console.log('[EmailScannerService] Verifying OAuth token scopes...');
      const scopeVerification = await this.verifyTokenScopes(accessToken);

      if (!scopeVerification.success) {
        console.error('[EmailScannerService] Token scope verification failed:', scopeVerification.error);
        return { success: false, error: scopeVerification.error };
      }

      console.log('[EmailScannerService] Token has scopes:', scopeVerification.scopes);

      // List message IDs
      const listUrl = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

      console.log('[EmailScannerService] Fetching Gmail messages with query:', query);

      const listResponse = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!listResponse.ok) {
        // Get detailed error response
        const errorText = await listResponse.text();
        console.error('[EmailScannerService] Gmail API error response:', {
          status: listResponse.status,
          statusText: listResponse.statusText,
          body: errorText,
        });

        if (listResponse.status === 401) {
          return { success: false, error: 'Access token expired. Please reconnect your Gmail account.' };
        }

        if (listResponse.status === 403) {
          // Parse error details if available
          try {
            const errorData = JSON.parse(errorText);
            const errorMessage = errorData.error?.message || errorText;
            return {
              success: false,
              error: `Gmail API access denied (403): ${errorMessage}. The OAuth token may be missing Gmail scopes. Please disconnect and reconnect your Gmail account to grant proper permissions.`
            };
          } catch {
            return {
              success: false,
              error: `Gmail API access denied (403). The OAuth token may be missing Gmail scopes. Please disconnect and reconnect your Gmail account to grant proper permissions.`
            };
          }
        }

        return { success: false, error: `Gmail API error: ${listResponse.status} - ${listResponse.statusText}` };
      }

      const listData = await listResponse.json();
      const messageIds = listData.messages || [];

      if (messageIds.length === 0) {
        return { success: true, messages: [] };
      }

      // Fetch full message details sequentially with rate limiting
      // Gmail API has quota limits: fetching emails in parallel causes 429 errors
      const messages: any[] = [];
      const DELAY_BETWEEN_REQUESTS = 150; // 150ms delay = ~6-7 requests/second (well under quota)
      const MAX_RETRIES = 3;

      console.log(`[EmailScannerService] Fetching ${messageIds.length} email details sequentially...`);

      for (let i = 0; i < messageIds.length; i++) {
        const msg = messageIds[i];
        let retries = 0;
        let backoffDelay = 1000; // Start with 1 second backoff

        while (retries < MAX_RETRIES) {
          try {
            const msgUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;

            const msgResponse = await fetch(msgUrl, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (!msgResponse.ok) {
              if (msgResponse.status === 429) {
                // Rate limit hit - use exponential backoff
                retries++;
                if (retries >= MAX_RETRIES) {
                  console.warn(`[EmailScannerService] Rate limit exceeded for message ${msg.id} after ${MAX_RETRIES} retries`);
                  break;
                }
                console.log(`[EmailScannerService] Rate limited - retrying in ${backoffDelay}ms (attempt ${retries}/${MAX_RETRIES})`);
                await this.delay(backoffDelay);
                backoffDelay *= 2; // Exponential backoff: 1s, 2s, 4s
                continue;
              }

              console.warn(`[EmailScannerService] Failed to fetch message ${msg.id}: ${msgResponse.status}`);
              break;
            }

            const msgData = await msgResponse.json();

            // Extract headers
            const headers = msgData.payload.headers;
            const getHeader = (name: string) =>
              headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

            // Extract body
            let bodyText = '';
            let bodyHtml = '';

            if (msgData.payload.body.data) {
              bodyText = this.decodeBase64(msgData.payload.body.data);
            } else if (msgData.payload.parts) {
              for (const part of msgData.payload.parts) {
                if (part.mimeType === 'text/plain' && part.body.data) {
                  bodyText = this.decodeBase64(part.body.data);
                } else if (part.mimeType === 'text/html' && part.body.data) {
                  bodyHtml = this.decodeBase64(part.body.data);
                }
              }
            }

            messages.push({
              id: msgData.id,
              subject: getHeader('Subject'),
              from: getHeader('From'),
              date: getHeader('Date'),
              body_text: bodyText,
              body_html: bodyHtml,
              attachments: [], // TODO: Extract attachments
            });

            // Success - break retry loop
            break;
          } catch (error) {
            console.error(`[EmailScannerService] Error fetching message ${msg.id}:`, error);
            break;
          }
        }

        // Add delay between requests (except after last message)
        if (i < messageIds.length - 1) {
          await this.delay(DELAY_BETWEEN_REQUESTS);
        }

        // Log progress every 10 messages
        if ((i + 1) % 10 === 0) {
          console.log(`[EmailScannerService] Fetched ${i + 1}/${messageIds.length} emails...`);
        }
      }

      console.log(`[EmailScannerService] Successfully fetched ${messages.length}/${messageIds.length} emails`);

      return {
        success: true,
        messages: messages.filter((m) => m !== null),
      };
    } catch (error) {
      console.error('[EmailScannerService] Fetch Gmail messages error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch emails',
      };
    }
  }

  /**
   * Parse a single email using the Edge Function
   */
  private async parseEmail(
    connectionId: string,
    message: any
  ): Promise<{
    success: boolean;
    parsed_email_id?: string;
    confidence?: number;
    error?: string;
  }> {
    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('email-parser', {
        body: {
          connection_id: connectionId,
          email_id: message.id,
          subject: message.subject,
          from: message.from,
          date: message.date,
          body_text: message.body_text,
          body_html: message.body_html,
          attachments: message.attachments,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('[EmailScannerService] Edge Function error:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('[EmailScannerService] Edge Function returned error:', {
          error: data.error,
          stack: data.stack,
          fullResponse: data
        });
        return { success: false, error: data.error };
      }

      return {
        success: true,
        parsed_email_id: data.parsed_email_id,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('[EmailScannerService] Parse email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse email',
      };
    }
  }

  /**
   * Import parsed email to travel_documents table
   */
  private async importToDocuments(
    parsedEmailId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get parsed email
      const { data: parsedEmail, error: fetchError } = await supabase
        .from('parsed_emails')
        .select('*')
        .eq('id', parsedEmailId)
        .single();

      if (fetchError || !parsedEmail) {
        return { success: false, error: 'Parsed email not found' };
      }

      // Create travel document
      // Note: travel_documents columns are: id, trip_id, doc_type, title, details,
      // confirmation, price, date, status, gate, last_updated, created_at
      const parsedData = parsedEmail.parsed_data || {};
      const { error: insertError } = await supabase.from('travel_documents').insert({
        trip_id: parsedEmail.trip_id, // null if not associated with trip yet
        doc_type: parsedEmail.detected_type,
        title: parsedEmail.email_subject,
        confirmation: parsedData.confirmation_code || null,
        price: parsedData.price || null,
        date: parsedData.date || null,
        details: {
          ...parsedData,
          imported_from_email: parsedEmail.email_from,
          import_date: new Date().toISOString(),
        },
        status: 'confirmed',
      });

      if (insertError) {
        console.error('[EmailScannerService] Import to documents error:', insertError);
        return { success: false, error: insertError.message };
      }

      // Mark as imported
      await supabase
        .from('parsed_emails')
        .update({ user_action: 'imported' })
        .eq('id', parsedEmailId);

      return { success: true };
    } catch (error) {
      console.error('[EmailScannerService] Import error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import',
      };
    }
  }

  /**
   * Get parsed emails for review
   */
  async getParsedEmails(connectionId: string): Promise<{
    success: boolean;
    emails?: ParsedEmail[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('parsed_emails')
        .select('*')
        .eq('connection_id', connectionId)
        .order('parsed_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const emails: ParsedEmail[] = (data || []).map((email) => ({
        id: email.id,
        detected_type: email.detected_type,
        confidence: email.parsing_confidence,
        summary: email.parsed_data?.summary || email.email_subject,
        booking_data: email.parsed_data,
        email_subject: email.email_subject,
        email_from: email.email_from,
        email_date: email.email_date,
        user_action: email.user_action || 'pending',
      }));

      return { success: true, emails };
    } catch (error) {
      console.error('[EmailScannerService] Get parsed emails error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get emails',
      };
    }
  }

  /**
   * Verify what scopes an OAuth token has
   */
  private async verifyTokenScopes(accessToken: string): Promise<{
    success: boolean;
    scopes?: string[];
    error?: string;
  }> {
    try {
      // Call Google's tokeninfo endpoint to verify token and get scopes
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to verify token. Token may be invalid or expired.',
        };
      }

      const tokenInfo = await response.json();

      // Check if token has Gmail scopes
      const scopeString = tokenInfo.scope || '';
      const scopes = scopeString.split(' ');

      const hasGmailReadonly = scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
      const hasGmailMetadata = scopes.includes('https://www.googleapis.com/auth/gmail.metadata');

      // Check for problematic scope combination
      if (hasGmailReadonly && hasGmailMetadata) {
        return {
          success: false,
          scopes,
          error: `OAuth token has BOTH gmail.readonly and gmail.metadata scopes. Gmail API will enforce the most restrictive scope (metadata), which doesn't support email search. Please remove gmail.metadata from Google Cloud Console OAuth consent screen and reconnect.`,
        };
      }

      if (!hasGmailReadonly && !hasGmailMetadata) {
        return {
          success: false,
          scopes,
          error: `OAuth token is missing required Gmail scopes. Current scopes: ${scopes.join(', ')}. Required: gmail.readonly. Please disconnect and reconnect your Gmail account.`,
        };
      }

      if (!hasGmailReadonly) {
        return {
          success: false,
          scopes,
          error: `OAuth token only has gmail.metadata scope, which doesn't support email search. You need gmail.readonly scope. Please reconnect your Gmail account.`,
        };
      }

      return {
        success: true,
        scopes,
      };
    } catch (error) {
      console.error('[EmailScannerService] Token verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed',
      };
    }
  }

  /**
   * Decode Gmail base64url encoded strings
   */
  private decodeBase64(str: string): string {
    try {
      // Gmail uses base64url encoding (RFC 4648)
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64.length % 4;
      const padded = padding ? base64 + '='.repeat(4 - padding) : base64;
      return atob(padded);
    } catch (error) {
      console.error('[EmailScannerService] Base64 decode error:', error);
      return '';
    }
  }

  /**
   * Helper method for adding delays between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const emailScannerService = EmailScannerService.getInstance();

// Export for backward compatibility
export default emailScannerService;
