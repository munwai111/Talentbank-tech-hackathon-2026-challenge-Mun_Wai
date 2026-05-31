-- ═══════════════════════════════════════════════════════════════
-- Career OS — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Enable pgvector extension for AI embeddings
-- This lets us store 1536-dimension vectors and do cosine similarity search
create extension if not exists vector;

-- ── Helper: auto-update "updated_at" timestamp ─────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── USERS ──────────────────────────────────────────────────────
-- Created by our Clerk webhook when a user signs up.
-- clerk_id is the foreign key linking Clerk auth ↔ our database.
create table users (
  id          uuid primary key default gen_random_uuid(),
  clerk_id    text unique not null,
  email       text unique not null,
  role        text not null check (role in ('candidate', 'employer')),
  created_at  timestamptz default now()
);

-- ── CANDIDATE PROFILES ─────────────────────────────────────────
create table candidate_profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade unique,
  name           text not null,
  headline       text,
  bio            text,
  location       text,
  github_url     text,
  linkedin_url   text,
  salary_min     integer,
  salary_max     integer,
  availability   text default 'immediate' check (
                   availability in ('immediate', 'one_month', 'three_months', 'not_looking')
                 ),
  -- 1536 dimensions = OpenAI text-embedding-3-small output size
  -- This vector is generated from the candidate's skills text
  embedding      vector(1536),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create trigger trg_candidate_profiles_updated_at
  before update on candidate_profiles
  for each row execute function update_updated_at();

-- ── SKILLS ─────────────────────────────────────────────────────
create table skills (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  name         text not null,
  level        integer not null check (level between 1 and 5),
  -- source tracks HOW this skill was verified — key for trust scoring
  source       text not null default 'manual' check (source in ('manual', 'github', 'assessment')),
  evidence_url text,
  created_at   timestamptz default now()
);
create index idx_skills_candidate_id on skills(candidate_id);

-- ── PORTFOLIO ITEMS ────────────────────────────────────────────
create table portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  title        text not null,
  description  text,
  url          text,
  repo_url     text,
  tech_stack   text[] default '{}',
  impact       text,         -- e.g. "Reduced API latency by 40%"
  ai_summary   text,         -- Claude-generated summary of what skills this demonstrates
  created_at   timestamptz default now()
);
create index idx_portfolio_candidate_id on portfolio_items(candidate_id);

-- ── COMPANIES ──────────────────────────────────────────────────
create table companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade unique,
  name        text not null,
  industry    text,
  size        text check (size in ('startup', 'sme', 'mid', 'large')),
  description text,
  website     text,
  logo_url    text,
  created_at  timestamptz default now()
);

-- ── JOBS ───────────────────────────────────────────────────────
create table jobs (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references companies(id) on delete cascade,
  title               text not null,
  description         text not null,
  required_skills     text[] default '{}',
  nice_to_have_skills text[] default '{}',
  salary_min          integer,
  salary_max          integer,
  location            text,
  remote              text default 'hybrid' check (remote in ('onsite', 'hybrid', 'remote')),
  status              text default 'open' check (status in ('draft', 'open', 'closed')),
  -- Vector generated from: title + description + required_skills
  -- Used for cosine similarity matching against candidate embeddings
  embedding           vector(1536),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create trigger trg_jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at();

-- Vector index for fast similarity search
-- ivfflat = approximate nearest neighbour (fast for <1M rows)
-- lists = 100 is a good default for this scale
create index idx_jobs_embedding on jobs
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index idx_candidate_embedding on candidate_profiles
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── MATCHES ────────────────────────────────────────────────────
create table matches (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references jobs(id) on delete cascade,
  candidate_id  uuid references candidate_profiles(id) on delete cascade,
  score         float not null check (score between 0 and 1),
  gap_analysis  jsonb,  -- { matched_skills, missing_skills, recommendations }
  created_at    timestamptz default now(),
  unique(job_id, candidate_id)
);
create index idx_matches_candidate on matches(candidate_id);
create index idx_matches_job on matches(job_id);
create index idx_matches_score on matches(score desc);

-- ── APPLICATIONS ───────────────────────────────────────────────
create table applications (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid references jobs(id) on delete cascade,
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  match_id     uuid references matches(id),
  status       text default 'applied' check (
                 status in ('applied', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn')
               ),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(job_id, candidate_id)
);
create trigger trg_applications_updated_at
  before update on applications
  for each row execute function update_updated_at();

-- ── EMPLOYER SIGNALS ───────────────────────────────────────────
-- THE FEEDBACK LOOP. Every employer action is recorded here.
-- Future: use these signals to re-weight the matching algorithm.
-- E.g. if employer keeps rejecting candidates missing "Docker",
-- increase Docker's weight in their match scores.
create table employer_signals (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  company_id     uuid references companies(id) on delete cascade,
  candidate_id   uuid references candidate_profiles(id) on delete cascade,
  signal_type    text not null check (
                   signal_type in ('shortlisted', 'rejected', 'interviewed', 'hired', 'not_hired')
                 ),
  reason         text,  -- Optional free text: "No system design experience"
  created_at     timestamptz default now()
);

-- ── COACHING SESSIONS ──────────────────────────────────────────
-- Stores full conversation history for each candidate's AI coach chat.
-- messages stored as JSONB array for simplicity at this scale.
create table coaching_sessions (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidate_profiles(id) on delete cascade unique,
  messages     jsonb default '[]'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create trigger trg_coaching_sessions_updated_at
  before update on coaching_sessions
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════
-- Enable RLS on all tables (default: no access)
alter table users               enable row level security;
alter table candidate_profiles  enable row level security;
alter table skills              enable row level security;
alter table portfolio_items     enable row level security;
alter table companies           enable row level security;
alter table jobs                enable row level security;
alter table matches             enable row level security;
alter table applications        enable row level security;
alter table employer_signals    enable row level security;
alter table coaching_sessions   enable row level security;

-- NOTE: We use the service_role key in our API routes (bypasses RLS).
-- RLS here acts as a safety net for any direct browser client access.
-- Policies below define what the anon/authenticated Supabase keys can see.

-- Jobs are publicly readable (anyone can browse open jobs)
create policy "Public can read open jobs"
  on jobs for select
  using (status = 'open');

-- Companies are publicly readable
create policy "Public can read companies"
  on companies for select
  using (true);

-- ═══════════════════════════════════════════════════════════════
-- MATCHING FUNCTION
-- ═══════════════════════════════════════════════════════════════
-- This SQL function finds the top N jobs matching a candidate's embedding.
-- Called from our API: SELECT * FROM match_jobs_for_candidate(embedding, 20)
-- The <=> operator = cosine distance (lower = more similar)
-- We convert to similarity score: 1 - distance
create or replace function match_jobs_for_candidate(
  candidate_embedding vector(1536),
  match_count         int default 20
)
returns table (
  job_id     uuid,
  score      float,
  title      text,
  company_id uuid
)
language sql stable
as $$
  select
    j.id as job_id,
    1 - (j.embedding <=> candidate_embedding) as score,
    j.title,
    j.company_id
  from jobs j
  where j.status = 'open'
    and j.embedding is not null
  order by j.embedding <=> candidate_embedding
  limit match_count;
$$;

-- Finds top N candidates matching a job's embedding (for employers)
create or replace function match_candidates_for_job(
  job_embedding vector(1536),
  match_count   int default 20
)
returns table (
  candidate_id uuid,
  score        float,
  name         text
)
language sql stable
as $$
  select
    cp.id as candidate_id,
    1 - (cp.embedding <=> job_embedding) as score,
    cp.name
  from candidate_profiles cp
  where cp.embedding is not null
  order by cp.embedding <=> job_embedding
  limit match_count;
$$;
