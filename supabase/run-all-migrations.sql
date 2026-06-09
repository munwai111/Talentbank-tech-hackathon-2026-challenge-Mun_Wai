-- ═══════════════════════════════════════════════════════════════
-- Career OS — All Pending Migrations (Combined)
-- Paste this entire file into Supabase SQL Editor and click Run.
-- All statements use IF NOT EXISTS — safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Registration Columns ───────────────────────────────────
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS middle_name text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS saq_data jsonb;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS verified_candidate boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_onboarding
  ON candidate_profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_verified
  ON candidate_profiles(verified_candidate);

-- ── 2. Soft-Delete Columns ────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at           timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason      text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_feedback    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_purge_at  timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_scheduled_purge
  ON users(scheduled_purge_at)
  WHERE deleted_at IS NOT NULL;

-- ── 3. Work Experience + Education Columns ────────────────────
ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS work_experience jsonb DEFAULT '[]'::jsonb;

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_work_experience
  ON candidate_profiles USING gin (work_experience);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_education
  ON candidate_profiles USING gin (education);

-- ═══════════════════════════════════════════════════════════════
-- Done. Registration wizard is now unblocked.
-- ═══════════════════════════════════════════════════════════════
