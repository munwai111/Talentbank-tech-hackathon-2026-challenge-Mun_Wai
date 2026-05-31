-- Performance indexes for Career OS
-- Run this in Supabase SQL editor after schema.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Every auth check resolves clerk_id → users.id on every request.
-- At 100k users this becomes a full table scan without an index.
create index if not exists idx_users_clerk_id
  on users(clerk_id);

-- Every candidate page resolves user_id → candidate_profiles.
create index if not exists idx_candidate_profiles_user_id
  on candidate_profiles(user_id);

-- Job matching always filters status = 'open'.
-- Composite: (status, company_id) covers both the global job feed
-- and employer-specific job listings in one index.
create index if not exists idx_jobs_status_company
  on jobs(status, company_id);

-- Applications are queried by candidate_id (candidate's application history).
create index if not exists idx_applications_candidate_id
  on applications(candidate_id);

-- Employer signals are queried by company_id for employer dashboards.
create index if not exists idx_employer_signals_company_id
  on employer_signals(company_id);
