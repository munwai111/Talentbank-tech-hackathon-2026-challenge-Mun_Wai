// Shared matching utilities — used by both the candidate /matches route
// and the employer /candidates/[jobId] page.
//
// E-01: Combined score = 70% skills overlap + 30% career goal alignment.
// Falls back to pure skill score when candidate has no career_data.

import type { CareerData } from '@/types/database'

// ── Skill normalisation ───────────────────────────────────────────────────────

const SYNONYMS: Record<string, string> = {
  'microsoft excel':        'excel',
  'ms excel':               'excel',
  'microsoft word':         'word',
  'microsoft powerpoint':   'powerpoint',
  'ms office':              'microsoft office',
  'ai/machine learning':    'machine learning',
  'artificial intelligence': 'ai',
  'ui/ux design':           'ux design',
  'ui/ux':                  'ux design',
  'user experience design': 'ux design',
  'data analyst':           'data analysis',
  'business development':   'business development',
  'generative ai':          'ai',
  'stakeholder management': 'stakeholder management',
  'reactjs':                'react',
  'react.js':               'react',
  'nodejs':                 'node.js',
  'node js':                'node.js',
  'postgresql':             'postgresql',
  'postgres':               'postgresql',
  'typescript':             'typescript',
  'javascript':             'javascript',
  'js':                     'javascript',
  'ts':                     'typescript',
  'python3':                'python',
  'scikit learn':           'scikit-learn',
  'sklearn':                'scikit-learn',
}

export function normaliseSkill(skill: string): string {
  const lower = skill.toLowerCase()
  return SYNONYMS[lower] ?? lower
}

// ── Goal alignment scoring (E-01) ─────────────────────────────────────────────
// Returns 0–100. Keyword overlap between candidate goals / preferred fields
// and the job title + description. Simple but effective for v1.

const STOPWORDS = new Set([
  'that', 'with', 'this', 'from', 'have', 'will', 'want', 'been',
  'they', 'their', 'into', 'more', 'some', 'also', 'what', 'when',
  'where', 'which', 'about', 'after', 'before', 'other', 'than',
])

export function scoreGoalAlignment(
  careerData: CareerData | null,
  job: { title: string; description: string },
): number {
  if (!careerData) return 0

  const goalText = [
    careerData.goal_1_year,
    careerData.goal_5_year,
    careerData.dream_role,
    ...(careerData.preferred_job_functions ?? []),
    ...(careerData.preferred_industries ?? []),
  ].filter(Boolean).join(' ').toLowerCase()

  if (!goalText.trim()) return 0

  const jobText = `${job.title} ${job.description}`.toLowerCase()

  const goalWords = new Set(
    goalText.split(/\W+/).filter(w => w.length > 3 && !STOPWORDS.has(w))
  )
  if (goalWords.size === 0) return 0

  const jobWords = jobText.split(/\W+/).filter(w => w.length > 3 && !STOPWORDS.has(w))
  const matchCount = jobWords.filter(w => goalWords.has(w)).length

  // ×3 scale so sparse keyword matches still produce meaningful scores
  const raw = (matchCount / goalWords.size) * 100
  return Math.min(100, Math.round(raw * 3))
}

// ── Goal alignment label ──────────────────────────────────────────────────────

export function deriveGoalLabel(
  skillPct: number,
  goalPct: number,
): 'goal_match' | 'career_pivot' | null {
  if (goalPct >= 60 && skillPct < 50) return 'career_pivot'
  if (goalPct >= 50) return 'goal_match'
  return null
}

// ── Career data has goals check ───────────────────────────────────────────────

export function candidateHasGoals(careerData: CareerData | null): boolean {
  if (!careerData) return false
  return !!(
    careerData.goal_1_year ||
    careerData.goal_5_year ||
    careerData.dream_role ||
    (careerData.preferred_job_functions?.length ?? 0) > 0 ||
    (careerData.preferred_industries?.length ?? 0) > 0
  )
}

// ── Combined score ────────────────────────────────────────────────────────────
// skill_score: 0.0–1.0 (raw skills fraction)
// goalAlignmentPct: 0–100
// Returns combined 0.0–1.0

export function combinedMatchScore(
  skillScore: number,
  goalAlignmentPct: number,
  hasGoals: boolean,
): number {
  if (!hasGoals) return skillScore
  return skillScore * 0.7 + (goalAlignmentPct / 100) * 0.3
}
