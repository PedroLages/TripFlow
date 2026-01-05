-- =============================================
-- Migration: Update Wishlist Places Table
-- Description: Add missing fields to match WishlistPlace interface
-- =============================================

-- Add location field (address/location description)
ALTER TABLE wishlist_places
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add image_url for photos
ALTER TABLE wishlist_places
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add price_range (1-4 for $ to $$$$)
ALTER TABLE wishlist_places
ADD COLUMN IF NOT EXISTS price_range INTEGER CHECK (price_range >= 1 AND price_range <= 4);

-- Add operating hours
ALTER TABLE wishlist_places
ADD COLUMN IF NOT EXISTS hours TEXT;

-- Add best time to visit
ALTER TABLE wishlist_places
ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT;

-- Add visited status tracking
ALTER TABLE wishlist_places
ADD COLUMN IF NOT EXISTS visited BOOLEAN NOT NULL DEFAULT false;

-- Add updated_at timestamp
ALTER TABLE wishlist_places
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create indexes on new columns
CREATE INDEX IF NOT EXISTS wishlist_places_visited_idx ON wishlist_places(visited);

-- Create function for updating updated_at
CREATE OR REPLACE FUNCTION update_wishlist_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS wishlist_places_updated_at_trigger ON wishlist_places;

CREATE TRIGGER wishlist_places_updated_at_trigger
  BEFORE UPDATE ON wishlist_places
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_places_updated_at();

-- Comments for new columns
COMMENT ON COLUMN wishlist_places.location IS 'Address or location description';
COMMENT ON COLUMN wishlist_places.image_url IS 'URL to place photo/image';
COMMENT ON COLUMN wishlist_places.price_range IS 'Price range 1-4 ($ to $$$$)';
COMMENT ON COLUMN wishlist_places.hours IS 'Operating hours (e.g., "9:00 AM - 6:00 PM")';
COMMENT ON COLUMN wishlist_places.best_time_to_visit IS 'Recommended visiting time';
COMMENT ON COLUMN wishlist_places.visited IS 'Whether the place has been visited';

-- Note: Keep latitude/longitude for backward compatibility
-- New code should use both for coordinates array: [latitude, longitude]
