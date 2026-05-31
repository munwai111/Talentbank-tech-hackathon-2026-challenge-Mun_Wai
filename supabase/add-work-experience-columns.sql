-- Add work history + education columns to candidate_profiles
-- Run in Supabase SQL editor after add-performance-indexes.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- These JSONB columns store structured data imported from resumes,
-- LinkedIn paste-text, or any professional profile.
--
-- Design choice: JSONB blobs rather than separate tables.
-- Rationale: experience and education entries vary significantly in shape;
-- JSONB lets us evolve the schema without migrations as we learn more about
-- what qualitative data matters for AI analysis.
-- ─────────────────────────────────────────────────────────────────────────────

-- work_experience: array of WorkExperienceEntry objects
--   { title, company, start_date, end_date, duration_months, description, key_technologies[] }
alter table candidate_profiles
  add column if not exists work_experience jsonb default '[]'::jsonb;

-- education: array of EducationEntry objects
--   { institution, degree, field, graduation_year }
alter table candidate_profiles
  add column if not exists education jsonb default '[]'::jsonb;

-- Index for future queries that filter/search within these JSONB arrays.
-- GIN index makes jsonb array queries fast at scale.
create index if not exists idx_candidate_profiles_work_experience
  on candidate_profiles using gin (work_experience);

create index if not exists idx_candidate_profiles_education
  on candidate_profiles using gin (education);
