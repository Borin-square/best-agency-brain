ALTER TABLE agency_skills
  ADD COLUMN IF NOT EXISTS guide_correlate JSONB NOT NULL DEFAULT '[]'::jsonb;
