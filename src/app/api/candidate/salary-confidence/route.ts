// GET /api/candidate/salary-confidence
// Returns a deterministic 4-source salary cross-reference result for a given role.
//
// Query params:
//   role        (required)  Free-text role title, e.g. "Senior Software Engineer"
//   years       (optional)  Years of experience — derives seniority if 'seniority' not set
//   seniority   (optional)  'junior' | 'mid' | 'senior' — explicit override
//   location    (optional)  e.g. "Kuala Lumpur", "Penang", "Singapore"
//   company     (optional)  'mnc' | 'local_large' | 'sme' | 'startup'
//   skills      (optional)  Comma-separated skill names, e.g. "AWS,Kubernetes"
//
// No DB access — pure computation. Auth required to prevent open scraping.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { computeSalaryConfidence } from '@/lib/salary-confidence-engine'
import type { Seniority } from '@/lib/salary-confidence-engine'

export const dynamic = 'force-dynamic'

const VALID_SENIORITY: Seniority[] = ['junior', 'mid', 'senior']
const VALID_COMPANY = ['mnc', 'local_large', 'sme', 'startup'] as const

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  const role = searchParams.get('role')?.trim()
  if (!role) {
    return NextResponse.json({ error: 'role is required' }, { status: 400 })
  }

  const yearsRaw = searchParams.get('years')
  const years_experience = yearsRaw ? parseInt(yearsRaw, 10) : undefined
  if (years_experience !== undefined && (isNaN(years_experience) || years_experience < 0)) {
    return NextResponse.json({ error: 'years must be a non-negative integer' }, { status: 400 })
  }

  const seniorityRaw = searchParams.get('seniority')
  const seniority = seniorityRaw && VALID_SENIORITY.includes(seniorityRaw as Seniority)
    ? (seniorityRaw as Seniority)
    : undefined

  const companyRaw = searchParams.get('company')
  const company_type = companyRaw && VALID_COMPANY.includes(companyRaw as typeof VALID_COMPANY[number])
    ? (companyRaw as typeof VALID_COMPANY[number])
    : undefined

  const skillsRaw = searchParams.get('skills')
  const skills = skillsRaw
    ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : undefined

  const location = searchParams.get('location')?.trim() ?? undefined

  const result = computeSalaryConfidence({
    role,
    years_experience,
    seniority,
    location,
    company_type,
    skills,
  })

  return NextResponse.json(result)
}
