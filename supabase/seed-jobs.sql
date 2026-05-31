-- ─────────────────────────────────────────────────────────────────────────────
-- Career OS — Demo Job Seed Data
-- Run this once in the Supabase SQL Editor to populate demo jobs for matching.
-- Safe to re-run: uses ON CONFLICT DO NOTHING throughout.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  u1 uuid := 'a0000000-0000-0000-0000-000000000001';
  u2 uuid := 'a0000000-0000-0000-0000-000000000002';
  u3 uuid := 'a0000000-0000-0000-0000-000000000003';
  c1 uuid := 'b0000000-0000-0000-0000-000000000001';
  c2 uuid := 'b0000000-0000-0000-0000-000000000002';
  c3 uuid := 'b0000000-0000-0000-0000-000000000003';
BEGIN

-- ── Demo employer users ───────────────────────────────────────────────────────
INSERT INTO users (id, clerk_id, email, role) VALUES
  (u1, 'demo_employer_axiata',    'talent@axiata.com.my',   'employer'),
  (u2, 'demo_employer_finflow',   'careers@finflow.io',     'employer'),
  (u3, 'demo_employer_shopmatic', 'jobs@shopmatic.com',     'employer')
ON CONFLICT (clerk_id) DO NOTHING;

-- ── Demo companies ────────────────────────────────────────────────────────────
INSERT INTO companies (id, user_id, name, industry, size, description, website) VALUES
  (c1, u1, 'Axiata Digital', 'Technology',
   'large',
   'Digital and technology arm of Axiata Group — one of Asia''s leading telecoms. Building the next generation of digital services across 11 APAC markets.',
   'https://www.axiata.com'),
  (c2, u2, 'FinFlow', 'Financial Services',
   'startup',
   'SEA''s fastest-growing payments infrastructure startup. We process RM 2B+ in transactions monthly and are scaling across Malaysia, Indonesia, and Thailand.',
   'https://finflow.io'),
  (c3, u3, 'Shopmatic MY', 'E-commerce',
   'sme',
   'Malaysia''s leading SME e-commerce enabler. We help 50,000+ small businesses sell online with AI-powered storefronts, logistics, and payments.',
   'https://shopmatic.com')
ON CONFLICT (user_id) DO NOTHING;

-- ── Jobs — Axiata Digital (5 roles) ──────────────────────────────────────────
INSERT INTO jobs (company_id, title, description, required_skills, nice_to_have_skills,
                  salary_min, salary_max, location, remote, status) VALUES

(c1, 'Senior Full Stack Developer',
 'You will architect and build high-traffic consumer-facing products used by millions across APAC. Working in a cross-functional team, you will own features end-to-end — from API design through to React UI. We move fast and care deeply about code quality.',
 ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
 ARRAY['AWS', 'Redis', 'GraphQL', 'Kubernetes'],
 9000, 14000, 'Kuala Lumpur, Malaysia', 'hybrid', 'open'),

(c1, 'DevOps / Cloud Engineer',
 'Own the infrastructure that powers 11 APAC markets. You will build CI/CD pipelines, manage Kubernetes clusters, and ensure 99.9% uptime for mission-critical services. Strong Linux and automation mindset is essential.',
 ARRAY['AWS', 'Docker', 'Kubernetes', 'Linux', 'CI/CD'],
 ARRAY['Terraform', 'Prometheus', 'Python', 'Ansible'],
 10000, 15000, 'Kuala Lumpur, Malaysia', 'hybrid', 'open'),

(c1, 'Data Engineer',
 'Build the data pipelines that power our AI products and executive dashboards. You will work with terabytes of telco and digital-service data, designing robust ETL workflows and ensuring data quality across our lake.',
 ARRAY['Python', 'SQL', 'Apache Spark', 'Airflow', 'AWS'],
 ARRAY['dbt', 'Kafka', 'Scala', 'Redshift'],
 8000, 13000, 'Kuala Lumpur, Malaysia', 'hybrid', 'open'),

(c1, 'Product Manager — Growth',
 'Lead the growth product squad for our super-app. You will own the activation and retention funnel, running experiments that move metrics for 3M+ users. Strong command of analytics and user psychology required.',
 ARRAY['Product Management', 'Agile', 'SQL', 'User Research', 'A/B Testing'],
 ARRAY['Python', 'Figma', 'Mixpanel', 'JIRA'],
 9000, 15000, 'Kuala Lumpur, Malaysia', 'hybrid', 'open'),

(c1, 'Junior Frontend Developer',
 'A great entry-level role for a developer who wants to work on real production code from day one. You will build components, fix bugs, and grow under senior mentorship. We value curiosity and a strong fundamentals over years of experience.',
 ARRAY['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
 ARRAY['TypeScript', 'Next.js', 'Tailwind CSS', 'Figma'],
 4500, 7000, 'Kuala Lumpur, Malaysia', 'hybrid', 'open'),

-- ── Jobs — FinFlow (5 roles) ──────────────────────────────────────────────────

(c2, 'Backend Engineer — Payments',
 'Build the payment processing core that handles millions of ringgit daily. You will work on high-concurrency systems where correctness is not optional. Deep understanding of distributed systems and financial compliance required.',
 ARRAY['Node.js', 'PostgreSQL', 'Docker', 'REST API Design', 'System Design'],
 ARRAY['Go', 'Kafka', 'Redis', 'AWS', 'TypeScript'],
 9000, 16000, 'Petaling Jaya, Malaysia', 'remote', 'open'),

(c2, 'Data Analyst — Risk',
 'Use data to catch fraud before it happens. You will build detection models, analyse transaction patterns, and work directly with our risk and compliance teams. SQL fluency and a statistical mindset are non-negotiable.',
 ARRAY['SQL', 'Python', 'Excel', 'Data Visualisation', 'Statistical Analysis'],
 ARRAY['R', 'Tableau', 'Machine Learning', 'Power BI'],
 6000, 9500, 'Petaling Jaya, Malaysia', 'hybrid', 'open'),

(c2, 'Mobile Developer — React Native',
 'Build the consumer-facing app that handles real money for real people across Malaysia, Indonesia, and Thailand. You will own features, performance, and release quality. Prior experience shipping to App Store and Play Store is required.',
 ARRAY['React Native', 'JavaScript', 'TypeScript', 'REST API Design', 'Git'],
 ARRAY['iOS Development', 'Android Development', 'Firebase', 'Redux'],
 7500, 12000, 'Petaling Jaya, Malaysia', 'remote', 'open'),

(c2, 'UI/UX Designer',
 'Design the interfaces that make financial services feel simple and trustworthy for everyday Malaysians. You will work across mobile and web, running user research, building prototypes, and handing off to engineering with precision.',
 ARRAY['Figma', 'User Research', 'Prototyping', 'UI Design', 'UX Design'],
 ARRAY['Motion Design', 'Framer', 'Design Systems', 'Accessibility'],
 6000, 10000, 'Petaling Jaya, Malaysia', 'hybrid', 'open'),

(c2, 'Business Development Manager',
 'Own the merchant acquisition pipeline. You will sell FinFlow''s payment solutions to SMEs, e-commerce platforms, and enterprise accounts. Strong English and Bahasa Malaysia required. Prior payments or fintech sales experience is a bonus.',
 ARRAY['Business Development', 'Sales', 'Stakeholder Management', 'CRM', 'Negotiation'],
 ARRAY['Fintech', 'SQL', 'HubSpot', 'Digital Marketing'],
 6500, 11000, 'Kuala Lumpur, Malaysia', 'onsite', 'open'),

-- ── Jobs — Shopmatic MY (5 roles) ─────────────────────────────────────────────

(c3, 'Machine Learning Engineer',
 'Build the recommendation and search ranking models that help 50,000 SMEs surface the right products to the right buyers. You will take models from research to production and own their continuous improvement.',
 ARRAY['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker'],
 ARRAY['PyTorch', 'MLflow', 'AWS', 'Spark', 'NLP'],
 9500, 16000, 'Shah Alam, Malaysia', 'hybrid', 'open'),

(c3, 'Full Stack Developer — E-commerce',
 'Build the storefronts, checkout flows, and seller dashboards used by tens of thousands of Malaysian SMEs daily. You will work across the stack, shipping features that have immediate measurable impact on seller revenue.',
 ARRAY['React', 'Node.js', 'PostgreSQL', 'REST API Design', 'Git'],
 ARRAY['TypeScript', 'Redis', 'AWS', 'Docker', 'Next.js'],
 6500, 11000, 'Shah Alam, Malaysia', 'hybrid', 'open'),

(c3, 'Business Analyst',
 'Bridge the gap between what our merchants need and what our tech team builds. You will gather requirements, map processes, analyse data, and ensure we are building the right things. Strong SQL and communication skills are essential.',
 ARRAY['SQL', 'Excel', 'Business Analysis', 'Stakeholder Management', 'Agile'],
 ARRAY['Power BI', 'Python', 'JIRA', 'Tableau'],
 5500, 8500, 'Shah Alam, Malaysia', 'hybrid', 'open'),

(c3, 'Digital Marketing Specialist',
 'Run the paid and organic channels that drive merchant acquisition and GMV growth. You will own campaigns across Google, Meta, and TikTok, with a relentless focus on ROAS and cost per acquisition.',
 ARRAY['Digital Marketing', 'Google Ads', 'Meta Ads', 'Analytics', 'Excel'],
 ARRAY['SEO', 'Content Marketing', 'SQL', 'Copywriting', 'TikTok Ads'],
 4500, 7500, 'Shah Alam, Malaysia', 'hybrid', 'open'),

(c3, 'Technical Support Engineer',
 'Be the expert that helps our merchants integrate our APIs, debug edge cases, and get value from the platform fast. You will work at the intersection of technical depth and customer empathy — strong communication is as important as the code.',
 ARRAY['REST API Design', 'JavaScript', 'SQL', 'Troubleshooting', 'Communication'],
 ARRAY['Python', 'Node.js', 'Postman', 'JIRA'],
 4000, 6500, 'Shah Alam, Malaysia', 'onsite', 'open');

END $$;
