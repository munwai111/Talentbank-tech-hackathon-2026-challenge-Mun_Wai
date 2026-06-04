-- ─────────────────────────────────────────────────────────────────────────────
-- Career OS — Guided Registration Columns
-- Run this in the Supabase SQL Editor after the initial schema.
-- Safe to re-run: uses IF NOT EXISTS throughout.
-- ─────────────────────────────────────────────────────────────────────────────

-- Phase 1: Personal Identity
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS middle_name text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Phase 5: SAQ (Short Answer Questions)
-- Stores character assessment, hobbies, goals, and platform intention
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS saq_data jsonb;

-- Registration progress and trust signals
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS verified_candidate boolean DEFAULT false;

-- Indexes for fast querying on verified/completed status
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_onboarding
  ON candidate_profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_verified
  ON candidate_profiles(verified_candidate);
