-- Add unique constraint on name_ascii + county for localities
ALTER TABLE localities ADD CONSTRAINT localities_name_ascii_county_unique UNIQUE (name_ascii, county);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_localities_name_ascii ON localities (name_ascii);
CREATE INDEX IF NOT EXISTS idx_localities_county ON localities (county);
CREATE INDEX IF NOT EXISTS idx_localities_coords ON localities (latitude, longitude);