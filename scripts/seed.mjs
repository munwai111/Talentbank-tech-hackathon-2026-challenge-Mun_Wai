#!/usr/bin/env node
// Career OS — Demo seed runner
// Usage: node scripts/seed.mjs
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ── Load .env.local ───────────────────────────────────────────────────────────
const env = {}
try {
  const raw = readFileSync('.env.local', 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
} catch {
  console.error('Could not read .env.local — run from the project root.')
  process.exit(1)
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Fixed UUIDs — safe to re-run (ON CONFLICT handled below) ─────────────────
const u1 = 'a0000000-0000-0000-0000-000000000001'
const u2 = 'a0000000-0000-0000-0000-000000000002'
const u3 = 'a0000000-0000-0000-0000-000000000003'
const u4 = 'a0000000-0000-0000-0000-000000000004'
const u5 = 'a0000000-0000-0000-0000-000000000005'
const c1 = 'b0000000-0000-0000-0000-000000000001'
const c2 = 'b0000000-0000-0000-0000-000000000002'
const c3 = 'b0000000-0000-0000-0000-000000000003'
const c4 = 'b0000000-0000-0000-0000-000000000004'
const c5 = 'b0000000-0000-0000-0000-000000000005'

async function upsert(table, rows, conflictCol = 'id') {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictCol, ignoreDuplicates: true })
  if (error) console.warn(`  ⚠  ${table}: ${error.message}`)
  else        console.log(`  ✓  ${table} (${rows.length} rows)`)
}

async function seed() {
  console.log('\n🌱 Seeding Career OS demo data…\n')

  // ── Demo employer users ────────────────────────────────────────────────────
  await upsert('users', [
    { id: u1, clerk_id: 'demo_employer_axiata',    email: 'talent@axiata.com.my',  role: 'employer' },
    { id: u2, clerk_id: 'demo_employer_finflow',   email: 'careers@finflow.io',    role: 'employer' },
    { id: u3, clerk_id: 'demo_employer_shopmatic', email: 'jobs@shopmatic.com',    role: 'employer' },
  ], 'clerk_id')

  // ── Demo employer users (business-focused companies) ──────────────────────
  await upsert('users', [
    { id: u4, clerk_id: 'demo_employer_talentlab',  email: 'careers@talentlab.my',    role: 'employer' },
    { id: u5, clerk_id: 'demo_employer_uniqlo',     email: 'jobs@uniqlo.com.my',       role: 'employer' },
  ], 'clerk_id')

  // ── Demo companies ─────────────────────────────────────────────────────────
  await upsert('companies', [
    { id: c1, user_id: u1, name: 'Axiata Digital', industry: 'Technology', size: 'large',
      description: "Digital and technology arm of Axiata Group — one of Asia's leading telecoms. Building the next generation of digital services across 11 APAC markets.",
      website: 'https://www.axiata.com' },
    { id: c2, user_id: u2, name: 'FinFlow', industry: 'Financial Services', size: 'startup',
      description: "SEA's fastest-growing payments infrastructure startup. We process RM 2B+ in transactions monthly and are scaling across Malaysia, Indonesia, and Thailand.",
      website: 'https://finflow.io' },
    { id: c3, user_id: u3, name: 'Shopmatic MY', industry: 'E-commerce', size: 'sme',
      description: "Malaysia's leading SME e-commerce enabler. We help 50,000+ small businesses sell online with AI-powered storefronts, logistics, and payments.",
      website: 'https://shopmatic.com' },
    { id: c4, user_id: u4, name: 'TalentLab Asia', industry: 'Human Resources', size: 'sme',
      description: "Malaysia's leading behavioural science-driven talent consultancy. We help 200+ organisations build high-performance cultures through evidence-based talent strategy, psychometric assessment, and AI-powered workforce analytics.",
      website: 'https://talentlab.my' },
    { id: c5, user_id: u5, name: 'UNIQLO Malaysia', industry: 'Retail', size: 'large',
      description: "Part of Fast Retailing Group — one of the world's largest apparel retailers. UNIQLO Malaysia operates 50+ stores and is expanding aggressively across Southeast Asia, backed by a data-driven retail operations model.",
      website: 'https://www.uniqlo.com/my' },
  ], 'user_id')

  // ── Jobs — Axiata Digital ──────────────────────────────────────────────────
  const axiataJobs = [
    { company_id: c1, title: 'Senior Full Stack Developer',
      description: 'You will architect and build high-traffic consumer-facing products used by millions across APAC. Working in a cross-functional team, you will own features end-to-end — from API design through to React UI. We move fast and care deeply about code quality.',
      required_skills: ['React','Node.js','TypeScript','PostgreSQL','Docker'],
      nice_to_have_skills: ['AWS','Redis','GraphQL','Kubernetes'],
      salary_min: 9000, salary_max: 14000, location: 'Kuala Lumpur, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c1, title: 'DevOps / Cloud Engineer',
      description: 'Own our CI/CD pipelines and AWS infrastructure across multiple products. You will drive reliability, security, and cost optimisation as we scale from millions to tens of millions of users.',
      required_skills: ['AWS','Docker','Kubernetes','Terraform','Linux'],
      nice_to_have_skills: ['GitHub Actions','Ansible','Prometheus','Grafana'],
      salary_min: 8000, salary_max: 13000, location: 'Kuala Lumpur, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c1, title: 'Data Engineer',
      description: 'Build and maintain the data pipelines that power our analytics platform. You will work closely with data scientists and product teams to ensure clean, reliable data at scale.',
      required_skills: ['Python','Apache Spark','SQL','Airflow','AWS'],
      nice_to_have_skills: ['dbt','Kafka','Scala','Snowflake'],
      salary_min: 7000, salary_max: 11000, location: 'Kuala Lumpur, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c1, title: 'Mobile Developer (React Native)',
      description: 'Build the mobile experience for our flagship consumer app — millions of downloads across Android and iOS. You will own the full mobile layer from architecture to App Store deployment.',
      required_skills: ['React Native','TypeScript','iOS','Android','REST API Design'],
      nice_to_have_skills: ['GraphQL','Firebase','Fastlane','Redux'],
      salary_min: 7500, salary_max: 12000, location: 'Kuala Lumpur, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c1, title: 'Machine Learning Engineer',
      description: 'Design and productionise ML models that power personalisation and fraud detection across our digital products. You will bridge research and production — from experiment to deployed, monitored service.',
      required_skills: ['Python','TensorFlow','scikit-learn','SQL','Docker'],
      nice_to_have_skills: ['MLflow','Kubernetes','Spark','AWS SageMaker'],
      salary_min: 9000, salary_max: 15000, location: 'Kuala Lumpur, Malaysia', remote: 'remote', status: 'open' },
  ]

  // ── Jobs — FinFlow ─────────────────────────────────────────────────────────
  const finflowJobs = [
    { company_id: c2, title: 'Backend Engineer (Payments)',
      description: 'Build the core payment processing engine that handles billions of ringgit in transactions. You will work on high-concurrency, fault-tolerant systems where correctness and reliability are non-negotiable.',
      required_skills: ['Go','PostgreSQL','Redis','Docker','REST API Design'],
      nice_to_have_skills: ['Kafka','Kubernetes','gRPC','AWS'],
      salary_min: 8000, salary_max: 14000, location: 'Petaling Jaya, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c2, title: 'Frontend Engineer',
      description: 'Build the merchant dashboard used by thousands of businesses to manage their payments, payouts, and analytics. You care about performance, accessibility, and delightful UX.',
      required_skills: ['React','TypeScript','CSS','REST API Design'],
      nice_to_have_skills: ['Next.js','Tailwind CSS','GraphQL','Playwright'],
      salary_min: 6000, salary_max: 10000, location: 'Petaling Jaya, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c2, title: 'Security Engineer',
      description: 'Own security across our payment infrastructure — threat modelling, penetration testing, PCI-DSS compliance, and incident response. You will embed security into every part of the engineering lifecycle.',
      required_skills: ['Network Security','OWASP','Penetration Testing','Python','Linux'],
      nice_to_have_skills: ['AWS Security','Burp Suite','SIEM','PCI-DSS'],
      salary_min: 9000, salary_max: 15000, location: 'Petaling Jaya, Malaysia', remote: 'remote', status: 'open' },
    { company_id: c2, title: 'Site Reliability Engineer',
      description: 'Ensure FinFlow stays up — always. You will own SLOs, incident response, and the on-call rotation. When things go wrong at 3am, you are the person who fixes them and then makes sure they never happen again.',
      required_skills: ['Kubernetes','Prometheus','Linux','Python','AWS'],
      nice_to_have_skills: ['Grafana','Terraform','Go','PagerDuty'],
      salary_min: 8500, salary_max: 13000, location: 'Petaling Jaya, Malaysia', remote: 'hybrid', status: 'open' },
  ]

  // ── Jobs — Shopmatic MY ────────────────────────────────────────────────────
  const shopmaticJobs = [
    { company_id: c3, title: 'Full Stack Developer',
      description: 'Build the e-commerce platform features used by 50,000+ SME merchants. You will work across the stack — Next.js storefronts, Node.js APIs, and PostgreSQL — shipping features that directly grow merchant revenue.',
      required_skills: ['React','Node.js','PostgreSQL','TypeScript'],
      nice_to_have_skills: ['Next.js','Redis','AWS','Stripe'],
      salary_min: 5500, salary_max: 9000, location: 'Shah Alam, Malaysia', remote: 'onsite', status: 'open' },
    { company_id: c3, title: 'Junior Frontend Developer',
      description: 'Build and maintain the merchant-facing UI. Great opportunity to grow from junior to mid-level — you will be mentored by senior engineers and own full features from day one.',
      required_skills: ['React','JavaScript','CSS','HTML'],
      nice_to_have_skills: ['TypeScript','Next.js','Tailwind CSS'],
      salary_min: 3500, salary_max: 5500, location: 'Shah Alam, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c3, title: 'Python Backend Developer',
      description: 'Build the data processing pipelines and APIs that power merchant analytics and AI-generated product descriptions. You will work closely with the data team to turn raw data into actionable merchant insights.',
      required_skills: ['Python','FastAPI','PostgreSQL','Docker'],
      nice_to_have_skills: ['Celery','Redis','AWS Lambda','scikit-learn'],
      salary_min: 5000, salary_max: 8000, location: 'Shah Alam, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c3, title: 'QA / Test Automation Engineer',
      description: 'Own test quality across the platform. You will write automated test suites, define QA processes, and work closely with developers to ship reliable software.',
      required_skills: ['Playwright','Python','API Testing','SQL'],
      nice_to_have_skills: ['Cypress','k6','CI/CD','Docker'],
      salary_min: 4500, salary_max: 7000, location: 'Shah Alam, Malaysia', remote: 'hybrid', status: 'open' },
  ]

  // ── Jobs — TalentLab Asia (behavioural science / HR tech) ─────────────────
  const talentlabJobs = [
    { company_id: c4, title: 'Behavioural Insights Consultant',
      description: 'Apply behavioural science and psychometric frameworks to help Fortune 500 clients redesign hiring, onboarding, and performance management. You will design research studies, synthesise findings, and present evidence-based recommendations to C-suite stakeholders across APAC.',
      required_skills: ['Behavioural Science','Research Methodology','Data Analysis','Stakeholder Management','Academic Writing'],
      nice_to_have_skills: ['IBM SPSS','Customer Research','Team Leadership','Strategic Planning','AI/Machine Learning'],
      salary_min: 7000, salary_max: 11000, location: 'Kuala Lumpur, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c4, title: 'Talent Analytics Manager',
      description: 'Lead our people analytics function — building dashboards, running predictive models, and turning workforce data into strategic insights for clients. You will work directly with HR leaders and executive teams to design data-informed talent strategies.',
      required_skills: ['Data Analysis','Data Management','Strategic Planning','Stakeholder Management','Research Methodology'],
      nice_to_have_skills: ['IBM SPSS','Microsoft Excel','Generative AI','Team Leadership','Technical Writing'],
      salary_min: 9000, salary_max: 14000, location: 'Kuala Lumpur, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c4, title: 'UX Research Lead — HR Products',
      description: 'Own the user research practice for our suite of psychometric and talent assessment tools. You will recruit participants, run moderated sessions, synthesise findings into actionable design recommendations, and work closely with product and engineering teams.',
      required_skills: ['Customer Research','UI/UX Design','Research Methodology','Stakeholder Management','Academic Writing'],
      nice_to_have_skills: ['Data Analysis','Behavioural Science','Team Leadership','Technical Writing','Project Management'],
      salary_min: 8000, salary_max: 12000, location: 'Kuala Lumpur, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c4, title: 'AI Products Strategist',
      description: 'Define the product roadmap for our AI-powered talent intelligence platform. You will translate behavioural science research into product features, conduct market analysis, and work with engineering to prioritise the backlog. Comfort with AI/ML concepts is essential.',
      required_skills: ['Strategic Planning','AI/Machine Learning','Stakeholder Management','Business Development','Research Methodology'],
      nice_to_have_skills: ['Generative AI','Data Analysis','Project Management','Technical Writing','Customer Research'],
      salary_min: 10000, salary_max: 16000, location: 'Kuala Lumpur, Malaysia', remote: 'remote', status: 'open' },
  ]

  // ── Jobs — UNIQLO Malaysia (retail operations / strategy) ─────────────────
  const uniqloJobs = [
    { company_id: c5, title: 'Store Operations Strategy Manager',
      description: 'Drive strategic initiatives across 50+ Malaysia stores — from workforce planning and staff development to operational efficiency projects. You will analyse operational data, design process improvements, and lead cross-functional change programmes with store leadership teams.',
      required_skills: ['Strategic Planning','Project Management','Stakeholder Management','Data Analysis','Team Leadership'],
      nice_to_have_skills: ['Microsoft Excel','Business Development','Customer Research','Data Management','Legal Compliance'],
      salary_min: 8500, salary_max: 13000, location: 'Kuala Lumpur, Malaysia', remote: 'onsite', status: 'open' },
    { company_id: c5, title: 'Customer Experience & Insights Manager',
      description: 'Own the voice-of-customer programme for UNIQLO Malaysia — designing research studies, analysing customer behaviour data, and translating insights into actionable CX improvements. You will partner with store operations, marketing, and regional HQ in Singapore.',
      required_skills: ['Customer Research','Data Analysis','Behavioural Science','Stakeholder Management','Research Methodology'],
      nice_to_have_skills: ['UI/UX Design','Strategic Planning','Microsoft Excel','IBM SPSS','Technical Writing'],
      salary_min: 7500, salary_max: 11000, location: 'Petaling Jaya, Malaysia', remote: 'hybrid', status: 'open' },
    { company_id: c5, title: 'Corporate Affairs & Compliance Officer',
      description: 'Manage regulatory compliance, corporate governance, and stakeholder communications across our Malaysian operations. You will liaise with government agencies, prepare compliance reports, and support the legal team on local regulatory matters.',
      required_skills: ['Legal Compliance','Stakeholder Management','Academic Writing','Strategic Planning','Project Management'],
      nice_to_have_skills: ['Business Development','Data Management','Team Leadership','Technical Writing','Research Methodology'],
      salary_min: 6500, salary_max: 10000, location: 'Kuala Lumpur, Malaysia', remote: 'onsite', status: 'open' },
  ]

  const allJobs = [...axiataJobs, ...finflowJobs, ...shopmaticJobs, ...talentlabJobs, ...uniqloJobs]
  const companyIds = [c1, c2, c3, c4, c5]

  // DELETE all existing jobs for our demo companies before re-inserting.
  // This prevents duplicates on re-runs (jobs have auto-generated UUIDs so
  // upsert cannot deduplicate them — DELETE + INSERT is the only safe pattern).
  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .in('company_id', companyIds)
  if (deleteError) console.warn(`  ⚠  jobs delete: ${deleteError.message}`)
  else             console.log(`  ✓  jobs cleared`)

  // Salary fields are MYR/month — do NOT multiply by 12.
  const { error: jobError } = await supabase.from('jobs').insert(allJobs)
  if (jobError) console.warn(`  ⚠  jobs insert: ${jobError.message}`)
  else          console.log(`  ✓  jobs (${allJobs.length} rows seeded)`)

  console.log('\n✅ Seed complete! Jobs and companies are ready for demo.\n')
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1) })
