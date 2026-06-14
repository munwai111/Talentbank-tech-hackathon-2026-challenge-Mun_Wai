-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: AI Coach chat sessions + persistent memory
--   • coach_sessions  — one row per conversation thread (ChatGPT-style history)
--   • coach_messages  — every user/assistant message, linked to a session
--   • coach memory    — a compact, evolving summary of the candidate's
--                       conditions / topics / concerns. Stored INSIDE the
--                       existing candidate_profiles.career_data JSONB
--                       (career_data.coach_memory) — no schema change needed.
--
-- Run once in the Supabase SQL Editor. Safe to re-run (IF NOT EXISTS guards).
-- The app degrades gracefully if these tables are absent, so deploying the
-- code before running this migration will NOT break anything — coach history
-- simply falls back to local (per-device) storage until the tables exist.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Sessions ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'New conversation',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes (query patterns) ─────────────────────────────────────────────────
-- list a user's sessions, most-recent first:
CREATE INDEX IF NOT EXISTS idx_coach_sessions_user
  ON coach_sessions (user_id, updated_at DESC);
-- load a session's messages in order:
CREATE INDEX IF NOT EXISTS idx_coach_messages_session
  ON coach_messages (session_id, created_at);

-- ── updated_at trigger on sessions (reuses shared function) ───────────────────
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

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- Server access is via the service_role key (which bypasses RLS) and every
-- query is scoped by the authenticated user's id in the API layer. Enabling RLS
-- with no anon/auth policies = deny-by-default for the public anon key, matching
-- the project's existing security posture (see user_preferences).
ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
