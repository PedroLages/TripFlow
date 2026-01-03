-- Email Scanner Schema Migration
-- Creates tables for Gmail OAuth integration and email parsing functionality

-- =====================================================
-- Table: email_connections
-- Purpose: Store Gmail OAuth tokens and connection status for users
-- =====================================================
CREATE TABLE IF NOT EXISTS email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- OAuth credentials
  -- SECURITY NOTE: Tokens are stored in plain text with the following mitigations:
  --   1. Database encrypted at rest (SOC2/HIPAA compliant)
  --   2. Row Level Security (RLS) restricts access to token owner only
  --   3. Tokens transmitted via secure headers (not URLs)
  --   4. Tokens are short-lived (1-hour access tokens, auto-refresh)
  -- Future: Consider Supabase Vault encryption when it reaches GA status
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Connection metadata
  email_address TEXT NOT NULL,
  provider TEXT DEFAULT 'gmail' CHECK (provider IN ('gmail', 'outlook')),
  connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'expired', 'revoked', 'error')),

  -- Sync tracking
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  sync_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(user_id, email_address)
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_email_connections_user_id ON email_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_status ON email_connections(connection_status);

-- =====================================================
-- Table: parsed_emails
-- Purpose: Store raw email data and AI parsing results
-- =====================================================
CREATE TABLE IF NOT EXISTS parsed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES email_connections(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  document_id UUID REFERENCES travel_documents(id) ON DELETE SET NULL,

  -- Email metadata
  email_id TEXT NOT NULL, -- Gmail message ID
  email_subject TEXT,
  email_from TEXT,
  email_date TIMESTAMPTZ,

  -- Raw email content (for re-parsing if needed)
  email_body_text TEXT,
  email_body_html TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment metadata

  -- AI parsing results
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  parsing_confidence DECIMAL(3,2), -- 0.00 to 1.00
  parsed_data JSONB, -- Structured data extracted by Gemini AI
  parsing_error TEXT,

  -- Document type detection
  detected_type TEXT CHECK (detected_type IN ('flight', 'hotel', 'car_rental', 'event', 'restaurant', 'train', 'bus', 'other')),

  -- Duplicate detection
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES parsed_emails(id),

  -- User actions
  user_reviewed BOOLEAN DEFAULT false,
  user_action TEXT CHECK (user_action IN ('imported', 'ignored', 'pending')),

  -- Timestamps
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(connection_id, email_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_parsed_emails_connection_id ON parsed_emails(connection_id);
CREATE INDEX IF NOT EXISTS idx_parsed_emails_trip_id ON parsed_emails(trip_id);
CREATE INDEX IF NOT EXISTS idx_parsed_emails_status ON parsed_emails(parsing_status);
CREATE INDEX IF NOT EXISTS idx_parsed_emails_type ON parsed_emails(detected_type);
CREATE INDEX IF NOT EXISTS idx_parsed_emails_email_id ON parsed_emails(email_id);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_emails ENABLE ROW LEVEL SECURITY;

-- email_connections policies: users can only access their own connections
CREATE POLICY "Users can view their own email connections"
  ON email_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email connections"
  ON email_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email connections"
  ON email_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email connections"
  ON email_connections FOR DELETE
  USING (auth.uid() = user_id);

-- parsed_emails policies: users can access emails from their connections
CREATE POLICY "Users can view parsed emails from their connections"
  ON parsed_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM email_connections
      WHERE email_connections.id = parsed_emails.connection_id
      AND email_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert parsed emails to their connections"
  ON parsed_emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_connections
      WHERE email_connections.id = parsed_emails.connection_id
      AND email_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update parsed emails from their connections"
  ON parsed_emails FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM email_connections
      WHERE email_connections.id = parsed_emails.connection_id
      AND email_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete parsed emails from their connections"
  ON parsed_emails FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM email_connections
      WHERE email_connections.id = parsed_emails.connection_id
      AND email_connections.user_id = auth.uid()
    )
  );

-- =====================================================
-- Triggers for updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_connections_updated_at
  BEFORE UPDATE ON email_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsed_emails_updated_at
  BEFORE UPDATE ON parsed_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE email_connections IS 'Stores Gmail OAuth credentials and connection status for email scanning';
COMMENT ON TABLE parsed_emails IS 'Stores raw email data and AI-parsed booking information';

COMMENT ON COLUMN email_connections.access_token IS 'OAuth access token (should be encrypted at application layer)';
COMMENT ON COLUMN email_connections.refresh_token IS 'OAuth refresh token (should be encrypted at application layer)';
COMMENT ON COLUMN parsed_emails.parsed_data IS 'Structured JSON data extracted by Gemini AI (flight details, hotel info, etc.)';
COMMENT ON COLUMN parsed_emails.parsing_confidence IS 'AI confidence score from 0.00 to 1.00';
COMMENT ON COLUMN parsed_emails.attachments IS 'Array of attachment metadata (filename, mimetype, size, download_url)';
