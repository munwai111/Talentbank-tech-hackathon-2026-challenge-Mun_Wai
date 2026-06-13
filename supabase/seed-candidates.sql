-- ─────────────────────────────────────────────────────────────────────────────
-- Career OS — Demo Candidate Seed Data
-- Run AFTER seed-jobs.sql. Creates 6 realistic Malaysian candidates so the
-- employer's ranked-candidate view has data to show immediately.
--
-- Safe to re-run: users/profiles use ON CONFLICT DO NOTHING.
-- Skills are idempotent via DELETE + INSERT (scoped to demo profile IDs only).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- User UUIDs
  u_ahmad    uuid := 'c0000000-0000-0000-0000-000000000001';
  u_siti     uuid := 'c0000000-0000-0000-0000-000000000002';
  u_jayden   uuid := 'c0000000-0000-0000-0000-000000000003';
  u_priya    uuid := 'c0000000-0000-0000-0000-000000000004';
  u_marcus   uuid := 'c0000000-0000-0000-0000-000000000005';
  u_zara     uuid := 'c0000000-0000-0000-0000-000000000006';

  -- Profile UUIDs (candidate_profiles.id — what skills.candidate_id references)
  p_ahmad    uuid := 'd0000000-0000-0000-0000-000000000001';
  p_siti     uuid := 'd0000000-0000-0000-0000-000000000002';
  p_jayden   uuid := 'd0000000-0000-0000-0000-000000000003';
  p_priya    uuid := 'd0000000-0000-0000-0000-000000000004';
  p_marcus   uuid := 'd0000000-0000-0000-0000-000000000005';
  p_zara     uuid := 'd0000000-0000-0000-0000-000000000006';
BEGIN

-- ── Demo candidate user accounts ─────────────────────────────────────────────
INSERT INTO users (id, clerk_id, email, role) VALUES
  (u_ahmad,  'demo_candidate_ahmad',  'ahmad.razali@demo.career-os.local',   'candidate'),
  (u_siti,   'demo_candidate_siti',   'siti.aisyah@demo.career-os.local',    'candidate'),
  (u_jayden, 'demo_candidate_jayden', 'jayden.lim@demo.career-os.local',     'candidate'),
  (u_priya,  'demo_candidate_priya',  'priya.ramasamy@demo.career-os.local', 'candidate'),
  (u_marcus, 'demo_candidate_marcus', 'marcus.wong@demo.career-os.local',    'candidate'),
  (u_zara,   'demo_candidate_zara',   'zara.ismail@demo.career-os.local',    'candidate')
ON CONFLICT (clerk_id) DO NOTHING;

-- ── Candidate profiles ────────────────────────────────────────────────────────

INSERT INTO candidate_profiles (
  id, user_id, name, first_name, last_name,
  headline, bio, location,
  career_data, verified_candidate, onboarding_completed
) VALUES

-- 1. Ahmad Razali — Senior Full Stack (strong match for Axiata SSE)
(p_ahmad, u_ahmad,
 'Ahmad Razali', 'Ahmad', 'Razali',
 'Senior Full Stack Developer · React + Node.js + TypeScript',
 'Full stack engineer with 6 years building high-traffic consumer products in Malaysia and Singapore. I own features end-to-end — from system design through to production deployment. Comfortable in React/Next.js frontends and Node.js backends, with solid PostgreSQL and Docker skills.',
 'Kuala Lumpur, Malaysia',
 '{
   "current_situation": "employed",
   "education_level": "degree",
   "education_field": "Computer Science",
   "education_institution": "Universiti Malaya",
   "graduation_year": 2019,
   "years_experience": 6,
   "current_or_last_role": "Senior Software Engineer",
   "current_or_last_company": "Grab Financial Group",
   "preferred_industries": ["Technology", "Fintech", "E-commerce"],
   "preferred_job_functions": ["Full Stack Development", "Backend Engineering"],
   "preferred_company_types": ["Large tech company", "Scale-up"],
   "preferred_work_arrangement": "hybrid",
   "open_to_relocation": false,
   "preferred_locations": ["Kuala Lumpur", "Petaling Jaya"],
   "values_priorities": ["growth", "impact", "salary"],
   "work_style": ["collaborative", "fast-paced", "ownership"],
   "goal_1_year": "Lead a full-stack squad at a product company, owning a critical feature end-to-end.",
   "goal_5_year": "Engineering Manager or Principal Engineer at a Series B or later tech company in SEA.",
   "dream_role": "Staff Engineer at a hyper-growth APAC tech company.",
   "deal_breakers": "No growth path, pure waterfall, no code ownership.",
   "life_chapter_context": null,
   "career_identity_summary": "Ahmad is a battle-tested full-stack engineer who thrives in high-stakes consumer products. His strength is architectural clarity — he simplifies complexity without losing nuance.",
   "synthesized_at": "2026-06-01T08:00:00Z"
 }'::jsonb,
 true, true),

-- 2. Siti Nur Aisyah — Data Engineer (strong match for Axiata Data Engineer)
(p_siti, u_siti,
 'Siti Nur Aisyah', 'Siti', 'Aisyah',
 'Data Engineer · Python · Spark · dbt · AWS',
 'Data engineer with 4 years building robust ETL pipelines and analytics platforms for telco and e-commerce companies. AWS Solutions Architect certified. Passionate about data quality and observability.',
 'Bangsar South, Kuala Lumpur',
 '{
   "current_situation": "employed",
   "education_level": "degree",
   "education_field": "Data Science",
   "education_institution": "Universiti Teknologi Malaysia",
   "graduation_year": 2021,
   "years_experience": 4,
   "current_or_last_role": "Data Engineer",
   "current_or_last_company": "Celcom Axiata",
   "preferred_industries": ["Technology", "Telco", "Financial Services"],
   "preferred_job_functions": ["Data Engineering", "Analytics Engineering"],
   "preferred_company_types": ["Large tech company", "Scale-up"],
   "preferred_work_arrangement": "hybrid",
   "open_to_relocation": false,
   "preferred_locations": ["Kuala Lumpur"],
   "values_priorities": ["growth", "impact", "flexibility"],
   "work_style": ["analytical", "ownership", "collaborative"],
   "goal_1_year": "Lead the data platform for a company with millions of users — design the lake, own the quality.",
   "goal_5_year": "Head of Data Engineering at a company building at APAC scale.",
   "dream_role": "Principal Data Engineer designing data infrastructure from the ground up.",
   "life_chapter_context": null,
   "career_identity_summary": "Siti builds data infrastructure the way civil engineers build bridges — with load tolerance and long-term maintainability. She is motivated by correctness and data systems that do not silently lie.",
   "synthesized_at": "2026-06-03T10:30:00Z"
 }'::jsonb,
 true, true),

-- 3. Jayden Lim Wei Jian — Junior Frontend (entry-level, partial match)
(p_jayden, u_jayden,
 'Jayden Lim Wei Jian', 'Jayden', 'Lim',
 'Junior Frontend Developer · React · JavaScript',
 'Recently graduated CS grad from Sunway University. Building with React since second year, shipped two personal projects. Fast learner looking for first production role with strong mentorship.',
 'Subang Jaya, Selangor',
 '{
   "current_situation": "fresh_grad",
   "education_level": "degree",
   "education_field": "Computer Science",
   "education_institution": "Sunway University",
   "graduation_year": 2025,
   "years_experience": 0,
   "preferred_industries": ["Technology", "E-commerce", "Startup"],
   "preferred_job_functions": ["Frontend Development", "Full Stack Development"],
   "preferred_company_types": ["Startup", "SME"],
   "preferred_work_arrangement": "hybrid",
   "open_to_relocation": true,
   "preferred_locations": ["Kuala Lumpur", "Petaling Jaya"],
   "values_priorities": ["growth", "learning", "mentorship"],
   "work_style": ["curious", "detail-oriented"],
   "goal_1_year": "Ship production-quality features at a real product company, level up to full-stack.",
   "goal_5_year": "Senior Full Stack Developer who can architect small systems independently.",
   "dream_role": "Full Stack Engineer at a product-led company where design matters.",
   "life_chapter_context": null,
   "career_identity_summary": "Jayden is a sharp fresh grad who builds things to understand them. Self-directed and ships — rare for someone just starting out.",
   "synthesized_at": "2026-05-28T14:00:00Z"
 }'::jsonb,
 false, true),

-- 4. Priya Ramasamy — Product Manager (strong match for Axiata PM Growth)
(p_priya, u_priya,
 'Priya Ramasamy', 'Priya', 'Ramasamy',
 'Product Manager — Growth & Analytics · ex-Shopee',
 'Growth PM with 5 years driving activation and retention for consumer apps across SEA. At Shopee, I owned the Malaysian new-user funnel — 3M MAU — and lifted D30 retention by 22% through experimentation. Highly data-driven and deeply collaborative.',
 'Damansara, Kuala Lumpur',
 '{
   "current_situation": "employed",
   "education_level": "degree",
   "education_field": "Business Administration",
   "education_institution": "Universiti Malaya",
   "graduation_year": 2020,
   "years_experience": 5,
   "current_or_last_role": "Senior Product Manager — Growth",
   "current_or_last_company": "Shopee Malaysia",
   "preferred_industries": ["Technology", "E-commerce", "Fintech"],
   "preferred_job_functions": ["Product Management", "Growth", "Product Strategy"],
   "preferred_company_types": ["Scale-up", "Large tech company"],
   "preferred_work_arrangement": "hybrid",
   "open_to_relocation": false,
   "preferred_locations": ["Kuala Lumpur"],
   "values_priorities": ["impact", "growth", "salary"],
   "work_style": ["data-driven", "collaborative", "outcome-focused"],
   "goal_1_year": "Own a product that grows from 1M to 5M users with measurable experiment-driven wins.",
   "goal_5_year": "Head of Product at a Malaysian or SEA-focused tech company.",
   "dream_role": "VP of Product at a post-Series B company building the next consumer platform for SEA.",
   "life_chapter_context": null,
   "career_identity_summary": "Priya is a product manager who thinks in systems and ships in sprints. Unusually comfortable in both a SQL query and a user interview. She builds conviction through data, then moves fast.",
   "synthesized_at": "2026-06-05T09:00:00Z"
 }'::jsonb,
 true, true),

-- 5. Marcus Wong Kah Yew — DevOps/Cloud (strong match for Axiata DevOps)
(p_marcus, u_marcus,
 'Marcus Wong Kah Yew', 'Marcus', 'Wong',
 'DevOps / Cloud Engineer · AWS · Kubernetes · Terraform',
 'Cloud and platform engineer with 7 years building high-availability infrastructure. AWS Solutions Architect (Professional) and CKA certified. Designed Kubernetes clusters for telco and e-commerce at scale.',
 'Mont Kiara, Kuala Lumpur',
 '{
   "current_situation": "employed",
   "education_level": "degree",
   "education_field": "Computer Engineering",
   "education_institution": "Multimedia University",
   "graduation_year": 2018,
   "years_experience": 7,
   "current_or_last_role": "Lead DevOps Engineer",
   "current_or_last_company": "Time dotCom",
   "preferred_industries": ["Technology", "Telco", "Financial Services"],
   "preferred_job_functions": ["DevOps", "Cloud Engineering", "Platform Engineering"],
   "preferred_company_types": ["Large tech company", "Scale-up"],
   "preferred_work_arrangement": "hybrid",
   "open_to_relocation": false,
   "preferred_locations": ["Kuala Lumpur"],
   "values_priorities": ["impact", "salary", "technical excellence"],
   "work_style": ["systematic", "automation-first"],
   "goal_1_year": "Own the entire cloud platform for a company with 99.99% SLA requirements.",
   "goal_5_year": "Head of Platform Engineering at a company building critical infrastructure.",
   "dream_role": "Principal Cloud Architect designing platform strategy for a top APAC tech company.",
   "life_chapter_context": null,
   "career_identity_summary": "Marcus builds infrastructure that does not get noticed — and that is the highest compliment in his field. He is the kind of engineer who reads the post-mortem before the incident happens.",
   "synthesized_at": "2026-06-02T11:00:00Z"
 }'::jsonb,
 true, true),

-- 6. Zara Ismail — Backend Engineer (partial match FinFlow, Axiata)
(p_zara, u_zara,
 'Zara Ismail', 'Zara', 'Ismail',
 'Backend Engineer · Node.js · PostgreSQL · API Design',
 'Backend engineer with 3 years building REST APIs and payment-adjacent systems for SMEs. Node.js and TypeScript at scale, PostgreSQL, Docker. Actively studying Go and distributed systems to level up.',
 'Petaling Jaya, Selangor',
 '{
   "current_situation": "employed",
   "education_level": "degree",
   "education_field": "Software Engineering",
   "education_institution": "HELP University",
   "graduation_year": 2022,
   "years_experience": 3,
   "current_or_last_role": "Backend Engineer",
   "current_or_last_company": "Revenue Monster",
   "preferred_industries": ["Financial Services", "Fintech", "Technology"],
   "preferred_job_functions": ["Backend Engineering", "API Development", "System Design"],
   "preferred_company_types": ["Startup", "Scale-up"],
   "preferred_work_arrangement": "remote",
   "open_to_relocation": false,
   "preferred_locations": ["Kuala Lumpur", "Petaling Jaya"],
   "values_priorities": ["growth", "technical excellence", "impact"],
   "work_style": ["systematic", "ownership"],
   "goal_1_year": "Become the go-to backend engineer on a payments product with real scale.",
   "goal_5_year": "Senior or Staff Backend Engineer specialising in distributed financial systems.",
   "dream_role": "Backend lead at a fintech startup building core payments infrastructure for SEA.",
   "life_chapter_context": null,
   "career_identity_summary": "Zara writes backend code like she is writing contracts — precise and explicit, with edge cases accounted for. She is methodical and self-motivated at the phase where the right environment will accelerate her sharply.",
   "synthesized_at": "2026-06-04T15:00:00Z"
 }'::jsonb,
 false, true)

ON CONFLICT (user_id) DO NOTHING;

-- ── Skills — clear demo skills first so the seed is idempotent ────────────────
DELETE FROM skills WHERE candidate_id IN (
  p_ahmad, p_siti, p_jayden, p_priya, p_marcus, p_zara
);

-- ── Skills — Ahmad Razali (Full Stack) ───────────────────────────────────────
INSERT INTO skills (candidate_id, name, level, source) VALUES
  (p_ahmad, 'React',         4, 'github'),
  (p_ahmad, 'Node.js',       4, 'github'),
  (p_ahmad, 'TypeScript',    4, 'github'),
  (p_ahmad, 'PostgreSQL',    4, 'manual'),
  (p_ahmad, 'Docker',        3, 'github'),
  (p_ahmad, 'AWS',           3, 'assessment'),
  (p_ahmad, 'Redis',         3, 'manual'),
  (p_ahmad, 'GraphQL',       3, 'github'),
  (p_ahmad, 'Next.js',       4, 'github'),
  (p_ahmad, 'System Design', 3, 'manual');

-- ── Skills — Siti Nur Aisyah (Data Engineer) ─────────────────────────────────
INSERT INTO skills (candidate_id, name, level, source) VALUES
  (p_siti, 'Python',        5, 'github'),
  (p_siti, 'SQL',           4, 'assessment'),
  (p_siti, 'Apache Spark',  3, 'manual'),
  (p_siti, 'Airflow',       3, 'manual'),
  (p_siti, 'AWS',           3, 'assessment'),
  (p_siti, 'dbt',           3, 'github'),
  (p_siti, 'Kafka',         2, 'manual'),
  (p_siti, 'Redshift',      2, 'manual'),
  (p_siti, 'Scala',         2, 'manual'),
  (p_siti, 'Tableau',       3, 'manual');

-- ── Skills — Jayden Lim (Junior Frontend) ────────────────────────────────────
INSERT INTO skills (candidate_id, name, level, source) VALUES
  (p_jayden, 'React',        3, 'github'),
  (p_jayden, 'JavaScript',   3, 'github'),
  (p_jayden, 'HTML',         4, 'github'),
  (p_jayden, 'CSS',          3, 'github'),
  (p_jayden, 'Git',          3, 'github'),
  (p_jayden, 'TypeScript',   2, 'github'),
  (p_jayden, 'Tailwind CSS', 3, 'github'),
  (p_jayden, 'Next.js',      2, 'github');

-- ── Skills — Priya Ramasamy (Product Manager) ────────────────────────────────
INSERT INTO skills (candidate_id, name, level, source) VALUES
  (p_priya, 'Product Management', 4, 'manual'),
  (p_priya, 'Agile',              4, 'manual'),
  (p_priya, 'SQL',                3, 'assessment'),
  (p_priya, 'User Research',      4, 'manual'),
  (p_priya, 'A/B Testing',        4, 'manual'),
  (p_priya, 'Python',             2, 'github'),
  (p_priya, 'Figma',              3, 'manual'),
  (p_priya, 'Mixpanel',           3, 'manual'),
  (p_priya, 'JIRA',               4, 'manual'),
  (p_priya, 'Data Analysis',      3, 'manual');

-- ── Skills — Marcus Wong (DevOps/Cloud) ──────────────────────────────────────
INSERT INTO skills (candidate_id, name, level, source) VALUES
  (p_marcus, 'AWS',           5, 'assessment'),
  (p_marcus, 'Docker',        4, 'github'),
  (p_marcus, 'Kubernetes',    4, 'manual'),
  (p_marcus, 'Linux',         4, 'manual'),
  (p_marcus, 'CI/CD',         4, 'github'),
  (p_marcus, 'Terraform',     4, 'github'),
  (p_marcus, 'Prometheus',    3, 'manual'),
  (p_marcus, 'Python',        3, 'github'),
  (p_marcus, 'Ansible',       3, 'manual'),
  (p_marcus, 'Grafana',       3, 'manual');

-- ── Skills — Zara Ismail (Backend Engineer) ──────────────────────────────────
INSERT INTO skills (candidate_id, name, level, source) VALUES
  (p_zara, 'Node.js',         3, 'github'),
  (p_zara, 'PostgreSQL',      3, 'manual'),
  (p_zara, 'Docker',          3, 'github'),
  (p_zara, 'REST API Design', 3, 'manual'),
  (p_zara, 'TypeScript',      3, 'github'),
  (p_zara, 'System Design',   2, 'manual'),
  (p_zara, 'Go',              2, 'github'),
  (p_zara, 'Redis',           2, 'manual'),
  (p_zara, 'Git',             4, 'github');

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Expected matching results against seeded Axiata jobs (approximate):
--
--   Senior Full Stack Developer:  Ahmad 92%  Zara 42%  Jayden 32%
--   DevOps / Cloud Engineer:      Marcus 96%  Ahmad 23%
--   Data Engineer:                Siti 87%  Ahmad 21%
--   Product Manager — Growth:     Priya 91%
--   Junior Frontend Developer:    Jayden 75%  Ahmad 56%
--   FinFlow Backend — Payments:   Zara 66%  Ahmad 46%
-- ─────────────────────────────────────────────────────────────────────────────
