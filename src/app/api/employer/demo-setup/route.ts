// POST /api/employer/demo-setup
// One-shot demo setup for hackathon presentations.
// Creates 3 realistic jobs designed to produce great ranked-candidate results
// against the seeded demo candidates (Ahmad, Siti, Marcus, Priya, Zara, Jayden).
// Idempotent — safe to call repeatedly (skips if 3+ jobs already exist).

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isOwner } from '@/lib/is-owner'

type DemoJob = {
  title: string
  description: string
  required_skills: string[]
  nice_to_have_skills: string[]
  salary_min: number
  salary_max: number
  location: string
  remote: 'hybrid' | 'onsite' | 'remote'
}

const DEMO_JOBS: DemoJob[] = [
  {
    title: 'Senior Full Stack Developer',
    description: `We're looking for a Senior Full Stack Developer to own feature delivery across our consumer-facing web platform. You'll work across a React/Next.js frontend and Node.js backend, collaborating closely with product and design to ship fast without sacrificing quality.

Responsibilities:
• Own features end-to-end — from system design to production deployment
• Build and maintain REST APIs in Node.js and TypeScript
• Architect scalable PostgreSQL schemas and data access patterns
• Code review, technical mentorship of junior engineers
• Drive platform reliability through observability and testing

We care about engineers who take ownership, communicate early, and leave the codebase better than they found it.`,
    required_skills:    ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    nice_to_have_skills:['Docker', 'Redis', 'GraphQL', 'AWS', 'Next.js'],
    salary_min: 8000,
    salary_max: 14000,
    location:   'Kuala Lumpur',
    remote:     'hybrid',
  },
  {
    title: 'Senior Data Engineer',
    description: `We're building a modern data platform to power product analytics, ML pipelines, and business intelligence. We need a Senior Data Engineer to design, build, and operate the data infrastructure that the rest of the company depends on.

Responsibilities:
• Design and maintain batch and streaming ETL pipelines using Apache Spark and Airflow
• Build dbt transformation layers that data analysts can trust
• Instrument data quality checks and observability across the lake
• Collaborate with data scientists on feature engineering pipelines
• Drive data platform reliability — SLAs, backfill strategies, incident response

You'll be working with Python every day. AWS expertise (Redshift, S3, Glue) is a significant advantage.`,
    required_skills:    ['Python', 'SQL', 'Apache Spark', 'Airflow'],
    nice_to_have_skills:['dbt', 'Kafka', 'AWS', 'Scala', 'Tableau'],
    salary_min: 7000,
    salary_max: 12000,
    location:   'Kuala Lumpur',
    remote:     'hybrid',
  },
  {
    title: 'DevOps / Cloud Engineer',
    description: `We operate a high-traffic platform on AWS and need a DevOps / Cloud Engineer to own our infrastructure, CI/CD pipelines, and platform reliability. You'll work closely with engineering teams to ensure our systems are scalable, observable, and resilient.

Responsibilities:
• Design, provision, and maintain AWS infrastructure (EC2, EKS, RDS, S3, CloudFront)
• Manage Kubernetes clusters for our microservices workloads
• Build and maintain CI/CD pipelines that let teams ship confidently
• Define and enforce infrastructure-as-code standards using Terraform
• Drive SRE practices — SLOs, on-call rotation, post-mortems

We're looking for someone with a "systems thinking" mindset who automates everything first.`,
    required_skills:    ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Linux'],
    nice_to_have_skills:['Prometheus', 'Grafana', 'CI/CD', 'Ansible', 'Python'],
    salary_min: 9000,
    salary_max: 16000,
    location:   'Kuala Lumpur',
    remote:     'hybrid',
  },
]

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isOwner()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('clerk_id', userId).single()

  if (!user || user.role !== 'employer') {
    return NextResponse.json({ error: 'Not an employer account' }, { status: 403 })
  }

  const existingCompany = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()

  let companyId: string

  if (existingCompany.data) {
    companyId = existingCompany.data.id
  } else {
    const { data: newCompany } = await supabase
      .from('companies')
      .upsert({ user_id: user.id, name: 'TechCorp' }, { onConflict: 'user_id' })
      .select('id').single()
    if (!newCompany) {
      return NextResponse.json({ error: 'Could not create company' }, { status: 500 })
    }
    companyId = newCompany.id
  }

  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ alreadySetUp: true, message: 'Demo already set up — jobs exist' })
  }

  const jobInserts = DEMO_JOBS.map(j => ({
    company_id:          companyId,
    title:               j.title,
    description:         j.description,
    required_skills:     j.required_skills,
    nice_to_have_skills: j.nice_to_have_skills,
    salary_min:          j.salary_min,
    salary_max:          j.salary_max,
    location:            j.location,
    remote:              j.remote,
    status:              'open' as const,
  }))

  const { data: jobs, error } = await supabase
    .from('jobs').insert(jobInserts).select('id, title')

  if (error) {
    console.error('[demo-setup] job insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, jobs })
}
