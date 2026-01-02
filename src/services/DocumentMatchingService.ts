/**
 * Document Matching Service
 *
 * Automatically matches imported travel documents (flights, hotels, etc.)
 * to trips based on date overlap, location, and other signals.
 *
 * Algorithm:
 * 1. Extract date range from parsed email data
 * 2. Find trips with overlapping dates (with fuzzy tolerance)
 * 3. Calculate confidence score (0-100%) based on multiple factors
 * 4. Determine action: auto-assign (≥85%), suggest (≥70%), or review (<70%)
 */

import { supabase } from '../lib/supabase';
import { addDays, differenceInDays, parseISO, isAfter, isBefore, max, min, isValid, parse } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
  tolerance: number; // Days of fuzzy matching
}

export interface OverlapResult {
  hasOverlap: boolean;
  documentInTrip: boolean; // True if document dates are completely within trip dates
  overlapDays: number;
  totalTripDays: number;
  overlapPercentage: number; // Percentage of document duration that overlaps
}

export interface MatchCandidate {
  tripId: string;
  tripName: string;
  tripDestination: string;
  confidence: number; // 0-100
  matchReasons: string[];
  dateOverlap: OverlapResult;
}

export enum MatchAction {
  AUTO_ASSIGNED = 'auto_assigned',      // Confidence ≥ 85%
  SUGGESTED = 'suggested',              // 70% ≤ Confidence < 85%
  REVIEW_NEEDED = 'review_needed',      // 50% ≤ Confidence < 70%
  UNMATCHED = 'unmatched'              // Confidence < 50%
}

export interface MatchResult {
  action: MatchAction;
  tripId: string | null;
  confidence: number;
  candidates: MatchCandidate[];
  reason?: string;
}

class DocumentMatchingService {
  private static instance: DocumentMatchingService;

  private constructor() {}

  static getInstance(): DocumentMatchingService {
    if (!DocumentMatchingService.instance) {
      DocumentMatchingService.instance = new DocumentMatchingService();
    }
    return DocumentMatchingService.instance;
  }

  /**
   * Get fuzzy tolerance days based on document type
   * Research shows different booking types need different tolerances
   */
  private getToleranceDays(documentType: string): number {
    const tolerances: Record<string, number> = {
      'flight': 1,       // ±1 day for same-day travel or overnight flights
      'hotel': 1,        // ±1 day for check-in/check-out flexibility
      'car': 1,          // ±1 day for rental flexibility
      'train': 1,
      'bus': 1,
      'insurance': 14,   // ±14 days (typically covers broader period)
      'event': 0,        // Exact match for events
      'restaurant': 0,   // Exact match for reservations
    };

    return tolerances[documentType.toLowerCase()] || 2; // Default 2 days
  }

  /**
   * Extract date range from parsed email data
   */
  private extractDateRange(parsedEmail: any): DateRange | null {
    try {
      const parsedData = parsedEmail.parsed_data;

      if (!parsedData) {
        console.warn('[DocumentMatchingService] No parsed data available');
        return null;
      }

      // Try to extract dates from various possible fields
      // Schema.org uses departure_time/arrival_time for flights
      // Hotels use check_in_date/check_out_date
      const startDateStr = parsedData.start_date ||
                       parsedData.departure_time ||  // Flight departure (Schema.org)
                       parsedData.check_in ||
                       parsedData.check_in_date ||   // Hotel check-in
                       parsedData.departure_date ||
                       parsedData.event_date;

      const endDateStr = parsedData.end_date ||
                     parsedData.arrival_time ||      // Flight arrival (Schema.org)
                     parsedData.check_out ||
                     parsedData.check_out_date ||    // Hotel check-out
                     parsedData.return_date ||
                     parsedData.event_date ||
                     startDateStr; // Default to start date if no end date

      if (!startDateStr) {
        console.warn('[DocumentMatchingService] No start date found in parsed data');
        return null;
      }

      // Parse dates with validation
      const startDate = this.parseDate(startDateStr);
      const endDate = this.parseDate(endDateStr);

      if (!startDate || !endDate) {
        console.warn('[DocumentMatchingService] Invalid date format:', { startDateStr, endDateStr });
        return null;
      }

      const tolerance = this.getToleranceDays(parsedEmail.detected_type || 'other');

      return {
        start: startDate,
        end: endDate,
        tolerance
      };
    } catch (error) {
      console.error('[DocumentMatchingService] Error extracting date range:', error);
      return null;
    }
  }

  /**
   * Parse date string with multiple format support
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try ISO format first (most reliable)
    let date = parseISO(dateStr);
    if (isValid(date)) return date;

    // Try common date formats
    const formats = [
      'yyyy-MM-dd',
      'MM/dd/yyyy',
      'dd/MM/yyyy',
      'MMM d, yyyy',
      'MMMM d, yyyy',
      'd MMM yyyy',
      'd MMMM yyyy',
    ];

    for (const fmt of formats) {
      try {
        date = parse(dateStr, fmt, new Date());
        if (isValid(date)) return date;
      } catch {
        // Continue to next format
      }
    }

    // Try native Date parsing as last resort
    date = new Date(dateStr);
    if (isValid(date)) return date;

    console.warn('[DocumentMatchingService] Could not parse date:', dateStr);
    return null;
  }

  /**
   * Calculate overlap between document dates and trip dates
   * Uses efficient algorithm: start1 < end2 AND start2 < end1
   */
  private calculateOverlap(
    docStart: Date,
    docEnd: Date,
    tripStart: Date,
    tripEnd: Date
  ): OverlapResult {
    // Check for overlap using PostgreSQL OVERLAPS logic
    const hasOverlap = docStart < tripEnd && tripStart < docEnd;

    if (!hasOverlap) {
      return {
        hasOverlap: false,
        documentInTrip: false,
        overlapDays: 0,
        totalTripDays: 0,
        overlapPercentage: 0
      };
    }

    // Calculate actual overlap period
    const overlapStart = max([docStart, tripStart]);
    const overlapEnd = min([docEnd, tripEnd]);
    const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;

    // Check if document is completely within trip
    const documentInTrip = !isBefore(docStart, tripStart) && !isAfter(docEnd, tripEnd);

    // Calculate overlap as percentage of document duration
    const docDuration = differenceInDays(docEnd, docStart) + 1;
    const overlapPercentage = (overlapDays / docDuration) * 100;

    const totalTripDays = differenceInDays(tripEnd, tripStart) + 1;

    return {
      hasOverlap: true,
      documentInTrip,
      overlapDays,
      totalTripDays,
      overlapPercentage
    };
  }

  /**
   * Get document type reliability score (0-1)
   * Based on typical booking confirmation quality
   */
  private getTypeReliability(docType: string): number {
    const reliability: Record<string, number> = {
      'flight': 1.0,      // Highest: structured data, confirmation codes
      'hotel': 0.95,      // Very high: structured bookings
      'train': 0.95,      // Very high: structured tickets
      'car': 0.90,        // High: structured bookings
      'event': 0.80,      // Medium-high: varies by provider
      'restaurant': 0.70, // Medium: often informal
      'other': 0.50       // Low: unknown format
    };

    return reliability[docType.toLowerCase()] || 0.5;
  }

  /**
   * Calculate confidence score (0-100) for a trip-document match
   * Based on research-backed multi-factor scoring
   */
  private calculateConfidence(
    parsedEmail: any,
    trip: any,
    overlap: OverlapResult
  ): number {
    let confidence = 0;

    // Scoring weights (total = 100)
    const weights = {
      dateOverlap: 40,      // Primary signal
      location: 30,         // Secondary signal (future enhancement)
      documentType: 15,     // Type reliability
      parsingConfidence: 10, // AI parsing quality
      userPattern: 5        // Historical accuracy (future enhancement)
    };

    // 1. Date Overlap Score (0-40 points)
    if (overlap.documentInTrip) {
      // Document completely within trip = perfect match
      confidence += weights.dateOverlap;
    } else {
      // Partial overlap = proportional score
      const score = (overlap.overlapPercentage / 100) * weights.dateOverlap;
      confidence += Math.max(score, 0);
    }

    // 2. Location Match Score (0-30 points)
    // TODO: Implement location matching when destination data is available
    // For now, give neutral score (50% of max)
    confidence += weights.location * 0.5;

    // 3. Document Type Reliability (0-15 points)
    const typeReliability = this.getTypeReliability(parsedEmail.detected_type || 'other');
    confidence += typeReliability * weights.documentType;

    // 4. AI Parsing Confidence (0-10 points)
    if (parsedEmail.parsing_confidence && parsedEmail.parsing_confidence > 0) {
      // parsing_confidence is 0-1, convert to points
      confidence += parsedEmail.parsing_confidence * weights.parsingConfidence;
    } else {
      // No parsing confidence data, give neutral score
      confidence += weights.parsingConfidence * 0.5;
    }

    // 5. User Pattern Score (0-5 points)
    // TODO: Learn from user corrections (future enhancement)
    // For now, give neutral score
    confidence += weights.userPattern * 0.5;

    // Normalize to 0-100 scale
    return Math.min(Math.round(confidence), 100);
  }

  /**
   * Build human-readable match reasons
   */
  private buildMatchReasons(
    parsedEmail: any,
    trip: any,
    overlap: OverlapResult
  ): string[] {
    const reasons: string[] = [];

    if (overlap.documentInTrip) {
      reasons.push(`Document dates (${parsedEmail.parsed_data?.start_date || 'unknown'} - ${parsedEmail.parsed_data?.end_date || 'unknown'}) are completely within trip dates`);
    } else if (overlap.overlapPercentage >= 50) {
      reasons.push(`${Math.round(overlap.overlapPercentage)}% of document dates overlap with trip`);
    } else {
      reasons.push(`Partial date overlap (${overlap.overlapDays} days)`);
    }

    const typeReliability = this.getTypeReliability(parsedEmail.detected_type || 'other');
    if (typeReliability >= 0.9) {
      reasons.push(`High-confidence ${parsedEmail.detected_type} booking`);
    }

    return reasons;
  }

  /**
   * Determine matching strategy based on confidence scores
   */
  private determineStrategy(candidates: MatchCandidate[]): MatchResult {
    if (candidates.length === 0) {
      return {
        action: MatchAction.UNMATCHED,
        tripId: null,
        confidence: 0,
        candidates: [],
        reason: 'No matching trips found'
      };
    }

    const topMatch = candidates[0];
    const secondMatch = candidates[1];

    // Case 1: Clear winner (≥85% confidence, 20+ point gap from second)
    if (topMatch.confidence >= 85 &&
        (!secondMatch || topMatch.confidence - secondMatch.confidence > 20)) {
      return {
        action: MatchAction.AUTO_ASSIGNED,
        tripId: topMatch.tripId,
        confidence: topMatch.confidence,
        candidates
      };
    }

    // Case 2: High confidence but close competition (suggest with alternatives)
    if (topMatch.confidence >= 70 && secondMatch &&
        topMatch.confidence - secondMatch.confidence <= 20) {
      return {
        action: MatchAction.SUGGESTED,
        tripId: topMatch.tripId,
        confidence: topMatch.confidence,
        candidates
      };
    }

    // Case 3: Medium confidence (suggest single)
    if (topMatch.confidence >= 70) {
      return {
        action: MatchAction.SUGGESTED,
        tripId: topMatch.tripId,
        confidence: topMatch.confidence,
        candidates
      };
    }

    // Case 4: Low-medium confidence (manual review needed)
    if (topMatch.confidence >= 50) {
      return {
        action: MatchAction.REVIEW_NEEDED,
        tripId: null,
        confidence: topMatch.confidence,
        candidates
      };
    }

    // Case 5: Low confidence - don't suggest
    return {
      action: MatchAction.UNMATCHED,
      tripId: null,
      confidence: topMatch.confidence,
      candidates,
      reason: 'Confidence too low for suggestion'
    };
  }

  /**
   * Find trips with overlapping dates (with fuzzy tolerance)
   */
  private async findOverlappingTrips(
    userId: string,
    docStart: Date,
    docEnd: Date,
    tolerance: number
  ): Promise<any[]> {
    try {
      // Apply fuzzy tolerance
      const fuzzyStart = addDays(docStart, -tolerance);
      const fuzzyEnd = addDays(docEnd, tolerance);

      // Query using efficient date range comparison
      // Uses: start_date < docEnd AND end_date > docStart
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('owner_email', userId)
        .lt('start_date', fuzzyEnd.toISOString())
        .gt('end_date', fuzzyStart.toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        console.error('[DocumentMatchingService] Error querying trips:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[DocumentMatchingService] Error finding overlapping trips:', error);
      return [];
    }
  }

  /**
   * Main entry point: Match a parsed email to trips
   */
  async matchDocumentToTrips(
    parsedEmailId: string,
    userId: string
  ): Promise<MatchResult> {
    try {
      console.log(`[DocumentMatchingService] Matching document ${parsedEmailId} for user ${userId}`);

      // 1. Fetch parsed email with booking data
      const { data: parsedEmail, error: fetchError } = await supabase
        .from('parsed_emails')
        .select('*')
        .eq('id', parsedEmailId)
        .single();

      if (fetchError || !parsedEmail) {
        console.error('[DocumentMatchingService] Failed to fetch parsed email:', fetchError);
        return {
          action: MatchAction.UNMATCHED,
          tripId: null,
          confidence: 0,
          candidates: [],
          reason: 'Document not found'
        };
      }

      // 2. Extract date range from parsed data
      const dateRange = this.extractDateRange(parsedEmail);
      if (!dateRange) {
        return {
          action: MatchAction.UNMATCHED,
          tripId: null,
          confidence: 0,
          candidates: [],
          reason: 'No dates found in document'
        };
      }

      console.log(`[DocumentMatchingService] Date range: ${dateRange.start.toISOString()} - ${dateRange.end.toISOString()} (±${dateRange.tolerance} days)`);

      // 3. Query database for overlapping trips
      const trips = await this.findOverlappingTrips(
        userId,
        dateRange.start,
        dateRange.end,
        dateRange.tolerance
      );

      console.log(`[DocumentMatchingService] Found ${trips.length} overlapping trips`);

      // 4. Calculate confidence scores for each candidate
      const candidates: MatchCandidate[] = trips.map(trip => {
        const tripStart = parseISO(trip.start_date);
        const tripEnd = parseISO(trip.end_date);

        const overlap = this.calculateOverlap(
          dateRange.start,
          dateRange.end,
          tripStart,
          tripEnd
        );

        const confidence = this.calculateConfidence(parsedEmail, trip, overlap);
        const reasons = this.buildMatchReasons(parsedEmail, trip, overlap);

        return {
          tripId: trip.id,
          tripName: trip.name,
          tripDestination: trip.destination,
          confidence,
          matchReasons: reasons,
          dateOverlap: overlap
        };
      }).sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending

      // 5. Determine action based on confidence
      const strategy = this.determineStrategy(candidates);

      console.log(`[DocumentMatchingService] Match result: ${strategy.action} (${strategy.confidence}% confidence)`);

      // 6. Update parsed_emails with match metadata
      const updateData: any = {
        match_confidence: strategy.confidence,
        match_candidates: candidates,
        match_action: strategy.action,
        updated_at: new Date().toISOString()
      };

      // If auto-assigning, set trip_id
      if (strategy.action === MatchAction.AUTO_ASSIGNED && strategy.tripId) {
        updateData.trip_id = strategy.tripId;
        updateData.matched_at = new Date().toISOString();
        console.log(`[DocumentMatchingService] Auto-assigning to trip ${strategy.tripId}`);
      }

      const { error: updateError } = await supabase
        .from('parsed_emails')
        .update(updateData)
        .eq('id', parsedEmailId);

      if (updateError) {
        console.error('[DocumentMatchingService] Failed to update parsed email:', updateError);
      }

      return strategy;
    } catch (error) {
      console.error('[DocumentMatchingService] Match error:', error);
      return {
        action: MatchAction.UNMATCHED,
        tripId: null,
        confidence: 0,
        candidates: [],
        reason: error instanceof Error ? error.message : 'Matching failed'
      };
    }
  }

  /**
   * Batch process all unmatched documents for a user
   */
  async batchMatchUnassigned(userId: string): Promise<{
    processed: number;
    auto_assigned: number;
    suggested: number;
    review_needed: number;
    unmatched: number;
  }> {
    try {
      const { data: unmatched, error } = await supabase
        .from('parsed_emails')
        .select('*')
        .is('trip_id', null)
        .eq('user_action', 'imported')
        .order('email_date', { ascending: false });

      if (error) {
        console.error('[DocumentMatchingService] Failed to fetch unmatched documents:', error);
        return { processed: 0, auto_assigned: 0, suggested: 0, review_needed: 0, unmatched: 0 };
      }

      const results = {
        processed: 0,
        auto_assigned: 0,
        suggested: 0,
        review_needed: 0,
        unmatched: 0
      };

      for (const doc of unmatched || []) {
        const result = await this.matchDocumentToTrips(doc.id, userId);
        results.processed++;

        if (result.action === MatchAction.AUTO_ASSIGNED) results.auto_assigned++;
        else if (result.action === MatchAction.SUGGESTED) results.suggested++;
        else if (result.action === MatchAction.REVIEW_NEEDED) results.review_needed++;
        else results.unmatched++;
      }

      console.log(`[DocumentMatchingService] Batch match complete:`, results);
      return results;
    } catch (error) {
      console.error('[DocumentMatchingService] Batch match error:', error);
      return { processed: 0, auto_assigned: 0, suggested: 0, review_needed: 0, unmatched: 0 };
    }
  }
}

// Export singleton instance
export const documentMatchingService = DocumentMatchingService.getInstance();

// Export for backward compatibility
export default documentMatchingService;
