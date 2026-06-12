-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: user_preferences table
-- Stores per-user preferences that previously lived in localStorage:
--   • UI language
--   • News channel follows + saved post IDs
--   • Event registrations + host request
-- Run once in the Supabase SQL Editor.
-- Safe to re-run: CREATE TABLE IF NOT EXISTS + IF NOT EXISTS trigger guard.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id        uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language       text NOT NULL DEFAULT 'en',
  news_followed  text[] NOT NULL DEFAULT '{}',
  news_saved     text[] NOT NULL DEFAULT '{}',
  event_tickets  text[] NOT NULL DEFAULT '{}',
  host_request   jsonb DEFAULT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Only create the trigger if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
