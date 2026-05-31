-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add career_data and culture_data JSONB columns
-- Run once in the Supabase SQL Editor.
-- Safe to re-run: IF NOT EXISTS guards prevent errors.
-- ─────────────────────────────────────────────────────────────────────────────

-- Career identity data for candidates
-- Stores: situation, education, preferences, values, goals, AI synthesis
ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS career_data JSONB DEFAULT NULL;

-- Culture and hiring identity data for employers
-- Stores: culture, work arrangement, benefits, what they look for, AI synthesis
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS culture_data JSONB DEFAULT NULL;

-- Optional: GIN index for querying inside the JSON blobs later
-- Only needed if you add JSON filtering queries. Skip for now.
-- CREATE INDEX IF NOT EXISTS idx_candidate_career_data ON candidate_profiles USING GIN (career_data);
-- CREATE INDEX IF NOT EXISTS idx_company_culture_data  ON companies         USING GIN (culture_data);
