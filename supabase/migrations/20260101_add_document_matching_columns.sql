-- Add document matching metadata columns to parsed_emails table
-- This enables automatic trip-document matching with confidence scoring

-- Add matching metadata columns
ALTER TABLE parsed_emails
ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS match_confidence DECIMAL(5,2), -- 0.00 to 100.00
ADD COLUMN IF NOT EXISTS match_candidates JSONB, -- Array of {tripId, confidence, reasons}
ADD COLUMN IF NOT EXISTS match_action TEXT CHECK (match_action IN ('auto_assigned', 'suggested', 'review_needed', 'unmatched', 'manual')),
ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_parsed_emails_trip_id ON parsed_emails(trip_id);
CREATE INDEX IF NOT EXISTS idx_parsed_emails_match_action ON parsed_emails(match_action);
CREATE INDEX IF NOT EXISTS idx_parsed_emails_user_unmatched
  ON parsed_emails(connection_id)
  WHERE trip_id IS NULL AND user_action = 'imported';

-- Create matching feedback table for learning from user corrections
CREATE TABLE IF NOT EXISTS matching_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_email_id UUID REFERENCES parsed_emails(id) ON DELETE CASCADE,
  suggested_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  actual_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  confidence DECIMAL(5,2),
  corrected_by UUID REFERENCES auth.users(id),
  corrected_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(parsed_email_id, corrected_at)
);

CREATE INDEX IF NOT EXISTS idx_matching_feedback_email ON matching_feedback(parsed_email_id);
CREATE INDEX IF NOT EXISTS idx_matching_feedback_user ON matching_feedback(corrected_by);

-- Add comment for documentation
COMMENT ON COLUMN parsed_emails.trip_id IS 'Associated trip (null if not matched yet)';
COMMENT ON COLUMN parsed_emails.match_confidence IS 'Matching confidence score (0-100)';
COMMENT ON COLUMN parsed_emails.match_candidates IS 'Array of potential trip matches with scores';
COMMENT ON COLUMN parsed_emails.match_action IS 'Matching action taken: auto_assigned, suggested, review_needed, unmatched, manual';
COMMENT ON COLUMN parsed_emails.matched_at IS 'Timestamp when document was matched to trip';
