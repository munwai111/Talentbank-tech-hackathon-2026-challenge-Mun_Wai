-- ─────────────────────────────────────────────────────────────────────────────
-- Career OS — Account Soft-Delete Columns
-- Run this in the Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS throughout.
--
-- Design: accounts are SOFT-DELETED on user request.
--   • deleted_at         — when deletion was requested
--   • deletion_reason    — user's selected reason (e.g. 'got_job', 'privacy')
--   • deletion_feedback  — free-text elaboration
--   • scheduled_purge_at — deleted_at + 6 months; a cron job hard-deletes after this date
--
-- Hard-delete cron (run monthly via Supabase pg_cron or Vercel Cron):
--   DELETE FROM users
--   WHERE deleted_at IS NOT NULL
--     AND scheduled_purge_at < NOW();
-- This cascades to candidate_profiles, skills, portfolio_items etc. via ON DELETE CASCADE.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at           timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason      text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_feedback    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_purge_at  timestamptz;

-- Index for the monthly purge job — only scans deleted rows
CREATE INDEX IF NOT EXISTS idx_users_scheduled_purge
  ON users(scheduled_purge_at)
  WHERE deleted_at IS NOT NULL;
