# PRD — E-01 Smart Talent Matching (Goal-Based Enhancement)
**Module:** Talentbank Challenge E-01  
**Status:** Partial (skills-based only) → Upgrade to goal-aligned  
**Effort estimate:** 3–5 hours  
**Dependencies:** `/api/candidate/matches/route.ts`, `candidate_profiles.career_data`, job schema

---

## Problem Statement

Talentbank's E-01 module asks: *"What if hiring read where someone is heading, not just where they've been?"* Career OS's current matching is purely skills-overlap — it scores how many of a candidate's current skills match a job's required skills. This is better than keyword matching but still backwards-looking. A candidate who has 3 of 5 required skills but whose career goal is "become a senior data engineer" is a stronger match for a data engineering role than someone with 4 of 5 skills whose goal is product management. The current scoring ignores trajectory entirely.

---

## Goals

1. Match score reflects both skills alignment AND career goal alignment
2. Employers see candidates ranked by genuine fit — not just who has the most current skills
3. Candidates see why they match: skill overlap + goal alignment clearly shown
4. E-01 explicitly claimed in hackathon submission as addressed
5. Differentiate Career OS from keyword-matching incumbents in the demo

---

## Non-Goals

- Real ML/embedding-based semantic matching — v2 (pgvector exists but not needed for v1 enhancement)
- Employer ability to specify "growth trajectory" in job posts — v2
- Automated re-ranking over time as candidate skills update — v2

---

## User Stories

**As an employer,** I want to see candidates ranked by how well their career direction matches my role, so that I'm talking to people who actually want this kind of work — not just people who happen to have the skills.

**As a candidate,** I want to see a match score that reflects my career goals, not just my current skills, so that roles I'm aiming for appear as strong matches even when I'm not fully qualified yet.

**As a candidate targeting a career pivot,** I want roles in my target field to rank higher than my current field, even if my current skills match my current field better.

---

## Requirements

### P0 — Must Have

**Goal alignment scoring**
- Current match score (0–100%) is skills overlap only
- New score = 70% skills overlap + 30% career goal alignment
- Goal alignment calculated as: does the job's title/description keywords overlap with candidate's `goal_1_year`, `goal_5_year`, `dream_role`, `preferred_job_functions`, `preferred_industries`?
- Implementation: simple keyword intersection (no embeddings needed for v1)
- Score displayed to both candidate and employer as before

**Goal alignment chip on job match card**
- New chip: "Goal match" (green) or "Career pivot" (yellow) shown alongside skill chips
- "Goal match" = candidate's stated goals overlap with this role's function/industry
- "Career pivot" = skills overlap < 50% but goal alignment > 60% (candidate is targeting this field)

**Plain-language explanation**
- Below match score, show: "X of Y required skills · Career goal aligned" or "Skills partial match · Career direction aligned — growth role"

### P1 — Nice to Have

- Employer talent pool view shows a "Goal match" column alongside skill match %
- Separate score breakdown in tooltip: "Skills: 65% · Goals: 80% · Combined: 70%"
- Candidates whose goals are "emerging" in this field show a "High potential" badge

### P2 — Future

- Use pgvector embeddings to compute semantic similarity between candidate goals and job descriptions
- Employer can specify desired trajectory in job post ("looking for someone growing into X")
- Re-rank dynamically as candidate adds skills or updates goals

---

## Acceptance Criteria

- [ ] Match score on `/jobs` page reflects combined skills + goal alignment
- [ ] Goal alignment chip appears on job cards where candidate goals overlap with role
- [ ] "Career pivot" chip appears where goals align but skills are partial
- [ ] Employer's `/employer/candidates/[jobId]` view ranks candidates by combined score
- [ ] Existing pure-skills-match behaviour preserved as fallback when no career_data present
- [ ] Score explanation visible on hover or as inline text

---

## Implementation Notes

```ts
// In /api/candidate/matches/route.ts

function scoreGoalAlignment(
  careerData: CareerData | null,
  job: { title: string; description: string; skills_required: string[] }
): number {
  if (!careerData) return 0
  
  const goalText = [
    careerData.goal_1_year,
    careerData.goal_5_year,
    careerData.dream_role,
    ...(careerData.preferred_job_functions ?? []),
    ...(careerData.preferred_industries ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
  
  const jobText = `${job.title} ${job.description}`.toLowerCase()
  
  // Keyword intersection — simple but effective for v1
  const goalWords = new Set(goalText.split(/\W+/).filter(w => w.length > 3))
  const jobWords = jobText.split(/\W+/).filter(w => w.length > 3)
  const matches = jobWords.filter(w => goalWords.has(w)).length
  
  return Math.min(100, (matches / Math.max(jobWords.length, 1)) * 300) // scale up
}

// Combined score:
const skillScore = (matchedSkills.length / requiredSkills.length) * 100
const goalScore = scoreGoalAlignment(careerData, job)
const combinedScore = Math.round(skillScore * 0.7 + goalScore * 0.3)
```

---

## Timeline

**Target:** Shipped by June 9 (Day 7 of sprint)  
**Effort:** ~3–5 hours (scoring logic + UI chip additions)
