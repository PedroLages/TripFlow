-- Add RLS policies for parsed_emails table
-- This fixes 406 (Not Acceptable) errors when querying for duplicates

-- Enable RLS on parsed_emails table
ALTER TABLE parsed_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own parsed emails
CREATE POLICY "Users can view own parsed emails"
  ON parsed_emails
  FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM email_connections WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert parsed emails for their connections
CREATE POLICY "Users can insert parsed emails"
  ON parsed_emails
  FOR INSERT
  WITH CHECK (
    connection_id IN (
      SELECT id FROM email_connections WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own parsed emails
CREATE POLICY "Users can update own parsed emails"
  ON parsed_emails
  FOR UPDATE
  USING (
    connection_id IN (
      SELECT id FROM email_connections WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    connection_id IN (
      SELECT id FROM email_connections WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own parsed emails
CREATE POLICY "Users can delete own parsed emails"
  ON parsed_emails
  FOR DELETE
  USING (
    connection_id IN (
      SELECT id FROM email_connections WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE parsed_emails IS 'Stores parsed email data with RLS policies for user access control';
