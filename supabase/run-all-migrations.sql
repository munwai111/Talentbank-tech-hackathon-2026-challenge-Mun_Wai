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

-- ── 4. User Preferences ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id        uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language       text NOT NULL DEFAULT 'en',
  news_followed  text[] NOT NULL DEFAULT '{}',
  news_saved     text[] NOT NULL DEFAULT '{}',
  event_tickets  text[] NOT NULL DEFAULT '{}',
  host_request   jsonb DEFAULT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- AI Coach chat sessions + persistent memory (add-coach-memory.sql)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS coach_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'New conversation',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coach_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_sessions_user
  ON coach_sessions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_messages_session
  ON coach_messages (session_id, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_coach_sessions_updated_at'
  ) THEN
    CREATE TRIGGER trg_coach_sessions_updated_at
      BEFORE UPDATE ON coach_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- Done.
-- ═══════════════════════════════════════════════════════════════
