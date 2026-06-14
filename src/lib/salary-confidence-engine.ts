// Salary Confidence Engine
// ─────────────────────────────────────────────────────────────────────────────
// Deterministic 4-source cross-reference engine. No LLM, no I/O.
//
// DATA SOURCES (embedded, from annual reports — update annually):
//   • JobStreet Malaysia Salary Report 2024–25   (volume: all employer types, KL/PJ)
//   • Robert Walters Malaysia Salary Survey 2025  (specialist tech/finance recruitment)
//   • Michael Page Malaysia Salary Guide 2025     (premium MNC/listed-company pool)
//   • DOSM Labour Force Survey (wages by occupation) — sanity floor ONLY
//
// ALGORITHM (see computeSalaryConfidence for the sequence):
//   1. Classify free-text role → role_key (keyword priority order)
//   2. Derive seniority from years_experience or explicit param
//   3. DOSM floor applied as hard lower bound, not a convergence participant
//   4. Weight JS/RW/MP by seniority: JS heavy for junior/mid, RW heavy for senior
//   5. Pairwise convergence between 3 market sources (midpoints within 10%)
//   6. HIGH if ≥ 2 pairs converge AND midpoint spread ≤ 20%
//      VOLATILE if spread > 25% AND ≤ 1 pair converges
//      MEDIUM otherwise
//   7. Narrow band for HIGH; full market spread for VOLATILE
//   8. Apply contextual adjustments (MNC, skills premium, location)
//   9. Return typed result with full source metadata

// ── Types ─────────────────────────────────────────────────────────────────────

export type Seniority = 'junior' | 'mid' | 'senior'
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'VOLATILE'
export type SourceKey = 'jobstreet' | 'robert_walters' | 'michael_page'

export type RoleKey =
  | 'software_engineer'
  | 'data_analyst'
  | 'data_engineer'
  | 'data_scientist_ml'
  | 'product_manager'
  | 'ux_ui_designer'
  | 'devops_cloud'
  | 'business_analyst'
  | 'frontend_developer'
  | 'backend_developer'
  | 'digital_marketing'
  | 'general_tech'

export type Band = { min: number; max: number }

export type SalaryEngineInput = {
  role: string
  years_experience?: number
  seniority?: Seniority        // explicit override takes precedence
  location?: string            // 'Kuala Lumpur' | 'Penang' | 'Johor Bahru' | 'Singapore'
  company_type?: 'mnc' | 'local_large' | 'sme' | 'startup'
  skills?: string[]            // premium-skill check (cloud, ML/AI, security)
}

export type SourceContribution = {
  source: SourceKey | 'dosm'
  label: string
  weight: number               // 0.0–1.0 (0 for DOSM — floor only)
  range: Band
  midpoint: number
}

export type ConvergencePair = {
  source_a: string
  source_b: string
  variance_pct: number
  converges: boolean
}

export type ContextualAdjustment = {
  factor: string
  impact_pct: number           // signed: positive = uplift, negative = discount
  reason: string
}

export type SalaryConfidenceResult = {
  role_key: RoleKey
  role_label: string
  seniority: Seniority

  min_salary: number           // final MYR/month gross (after adjustments)
  max_salary: number

  confidence_score: number     // 0–100
  confidence_level: ConfidenceLevel

  market_insights_text: string

  source_convergence_metadata: {
    sources_used: SourceContribution[]
    convergence_pairs: ConvergencePair[]
    dosm_floor: number
    dosm_floor_applied: boolean
    contextual_adjustments: ContextualAdjustment[]
    relative_midpoint_spread: number   // spread / mean of 3 market source midpoints
    weighted_midpoint: number          // before adjustments
    data_vintage: string
  }
}

// ── Source data ───────────────────────────────────────────────────────────────
// MYR/month gross, Klang Valley (KL/PJ) baseline, 2025–2026.
// All ranges represent the ~25th–75th percentile of sampled postings/placements
// for each source. DOSM reflects national all-employer averages.

type RoleSourceData = Record<RoleKey, Record<'junior' | 'mid' | 'senior', Band>>

const JOBSTREET: RoleSourceData = {
  software_engineer:  { junior: {min:3300,max:5200}, mid: {min:6200,max:10500}, senior: {min:10500,max:17500} },
  data_analyst:       { junior: {min:3200,max:5000}, mid: {min:5500,max:9000},  senior: {min:9000,max:14500} },
  data_engineer:      { junior: {min:4500,max:6500}, mid: {min:7000,max:12000}, senior: {min:12000,max:18000} },
  data_scientist_ml:  { junior: {min:4500,max:7500}, mid: {min:8000,max:14000}, senior: {min:13000,max:20000} },
  product_manager:    { junior: {min:4500,max:7000}, mid: {min:7000,max:13000}, senior: {min:13000,max:22000} },
  ux_ui_designer:     { junior: {min:3000,max:5000}, mid: {min:5500,max:9000},  senior: {min:9000,max:15000} },
  devops_cloud:       { junior: {min:4500,max:7000}, mid: {min:7500,max:13000}, senior: {min:13000,max:20000} },
  business_analyst:   { junior: {min:3500,max:5500}, mid: {min:6000,max:10000}, senior: {min:10000,max:16000} },
  frontend_developer: { junior: {min:3200,max:5200}, mid: {min:5500,max:9500},  senior: {min:9500,max:15000} },
  backend_developer:  { junior: {min:3800,max:5800}, mid: {min:6000,max:10500}, senior: {min:10500,max:17000} },
  digital_marketing:  { junior: {min:2500,max:4200}, mid: {min:4500,max:7500},  senior: {min:7500,max:12000} },
  general_tech:       { junior: {min:3000,max:5000}, mid: {min:5500,max:9500},  senior: {min:9500,max:16000} },
}

const ROBERT_WALTERS: RoleSourceData = {
  software_engineer:  { junior: {min:4200,max:6200}, mid: {min:7000,max:11000}, senior: {min:12000,max:20000} },
  data_analyst:       { junior: {min:3800,max:5800}, mid: {min:6200,max:10000}, senior: {min:10500,max:16000} },
  data_engineer:      { junior: {min:5000,max:7000}, mid: {min:7500,max:13000}, senior: {min:14000,max:21000} },
  data_scientist_ml:  { junior: {min:6000,max:9000}, mid: {min:11000,max:18000},senior: {min:18000,max:30000} },
  product_manager:    { junior: {min:5000,max:8000}, mid: {min:8000,max:14000}, senior: {min:15000,max:25000} },
  ux_ui_designer:     { junior: {min:3500,max:5500}, mid: {min:6000,max:10000}, senior: {min:11000,max:18000} },
  devops_cloud:       { junior: {min:5000,max:7500}, mid: {min:8000,max:14000}, senior: {min:14000,max:22000} },
  business_analyst:   { junior: {min:3800,max:5800}, mid: {min:6500,max:10500}, senior: {min:11000,max:17500} },
  frontend_developer: { junior: {min:3500,max:5500}, mid: {min:6000,max:10500}, senior: {min:10500,max:17000} },
  backend_developer:  { junior: {min:4000,max:6000}, mid: {min:6500,max:11000}, senior: {min:11500,max:18500} },
  digital_marketing:  { junior: {min:2800,max:4500}, mid: {min:5000,max:8500},  senior: {min:9000,max:14000} },
  general_tech:       { junior: {min:3800,max:5800}, mid: {min:6500,max:11000}, senior: {min:11000,max:18000} },
}

const MICHAEL_PAGE: RoleSourceData = {
  software_engineer:  { junior: {min:4000,max:6000}, mid: {min:7500,max:12000}, senior: {min:13000,max:21000} },
  data_analyst:       { junior: {min:3600,max:5600}, mid: {min:6000,max:9800},  senior: {min:10000,max:15500} },
  data_engineer:      { junior: {min:4800,max:7000}, mid: {min:7800,max:13500}, senior: {min:14500,max:22000} },
  data_scientist_ml:  { junior: {min:5500,max:8500}, mid: {min:10000,max:17000},senior: {min:17000,max:28000} },
  product_manager:    { junior: {min:5500,max:8500}, mid: {min:9000,max:16000}, senior: {min:17000,max:28000} },
  ux_ui_designer:     { junior: {min:3500,max:5800}, mid: {min:6200,max:10500}, senior: {min:11500,max:19000} },
  devops_cloud:       { junior: {min:4800,max:7500}, mid: {min:8200,max:14500}, senior: {min:14500,max:23000} },
  business_analyst:   { junior: {min:3800,max:6000}, mid: {min:6500,max:11000}, senior: {min:11500,max:18500} },
  frontend_developer: { junior: {min:3500,max:5500}, mid: {min:6000,max:10500}, senior: {min:11000,max:18000} },
  backend_developer:  { junior: {min:4000,max:6200}, mid: {min:6800,max:11500}, senior: {min:12000,max:19000} },
  digital_marketing:  { junior: {min:2800,max:4800}, mid: {min:5200,max:9000},  senior: {min:9500,max:15000} },
  general_tech:       { junior: {min:3800,max:6000}, mid: {min:6500,max:11000}, senior: {min:11500,max:19000} },
}

// DOSM: national average across all industries — conservative floor, not a market rate.
// Reflects SOC 25 (ICT professionals) and SOC 35 (ICT associates) aggregates.
const DOSM: RoleSourceData = {
  software_engineer:  { junior: {min:2800,max:4200}, mid: {min:5000,max:8000},  senior: {min:8000,max:13000} },
  data_analyst:       { junior: {min:2500,max:4000}, mid: {min:4200,max:7000},  senior: {min:7000,max:11000} },
  data_engineer:      { junior: {min:3500,max:5500}, mid: {min:5500,max:9000},  senior: {min:9000,max:14000} },
  data_scientist_ml:  { junior: {min:3500,max:6000}, mid: {min:6000,max:10000}, senior: {min:9000,max:14000} },
  product_manager:    { junior: {min:3500,max:6000}, mid: {min:6000,max:10000}, senior: {min:10000,max:16000} },
  ux_ui_designer:     { junior: {min:2500,max:4000}, mid: {min:4000,max:7000},  senior: {min:7000,max:12000} },
  devops_cloud:       { junior: {min:3500,max:6000}, mid: {min:6000,max:10000}, senior: {min:10000,max:16000} },
  business_analyst:   { junior: {min:2800,max:4500}, mid: {min:4500,max:7500},  senior: {min:7500,max:12000} },
  frontend_developer: { junior: {min:2800,max:4200}, mid: {min:4500,max:7500},  senior: {min:7500,max:12000} },
  backend_developer:  { junior: {min:3000,max:4800}, mid: {min:4800,max:8000},  senior: {min:8000,max:13000} },
  digital_marketing:  { junior: {min:2000,max:3500}, mid: {min:3500,max:6000},  senior: {min:6000,max:10000} },
  general_tech:       { junior: {min:2800,max:4200}, mid: {min:4500,max:7500},  senior: {min:7500,max:12500} },
}

// ── Role classifier ────────────────────────────────────────────────────────────
// Evaluated in order — more specific patterns first to avoid false matches.

const ROLE_CLASSIFIERS: Array<{ key: RoleKey; patterns: string[] }> = [
  { key: 'data_scientist_ml', patterns: ['data scien', 'machine learn', 'ml engineer', 'ai engineer', 'deep learn', 'nlp engineer', 'computer vision', 'mlops', 'llm engineer', 'foundation model'] },
  { key: 'data_engineer',     patterns: ['data engineer', 'data pipeline', 'data platform', 'analytics engineer', 'etl engineer', 'data architect', 'data infrastructure'] },
  { key: 'data_analyst',      patterns: ['data analyst', 'business intelligence', 'bi analyst', 'reporting analyst', 'analytics analyst', 'insights analyst'] },
  { key: 'devops_cloud',      patterns: ['devops', 'sre', 'site reliability', 'cloud engineer', 'platform engineer', 'infrastructure engineer', 'devsecops', 'cloud architect', 'solutions architect'] },
  { key: 'product_manager',   patterns: ['product manager', 'product lead', 'head of product', 'vp product', 'chief product', 'product owner', 'product director', 'gpm', 'group product'] },
  { key: 'ux_ui_designer',    patterns: ['ux designer', 'ui designer', 'product designer', 'interaction designer', 'visual designer', 'ux researcher', 'design lead', 'ux lead', 'service designer'] },
  { key: 'business_analyst',  patterns: ['business analyst', 'systems analyst', 'functional analyst', 'process analyst', 'requirements analyst', 'it analyst'] },
  { key: 'frontend_developer',patterns: ['frontend', 'front-end', 'front end', 'react developer', 'vue developer', 'angular developer', 'javascript developer', 'next.js developer', 'web developer', 'ui developer'] },
  { key: 'backend_developer', patterns: ['backend', 'back-end', 'back end', 'node developer', 'python developer', 'java developer', 'go developer', 'ruby developer', 'api developer', 'server-side', '.net developer', 'spring developer'] },
  { key: 'digital_marketing', patterns: ['digital marketing', 'seo', 'sem specialist', 'growth hacker', 'performance marketing', 'social media manager', 'content market', 'email market', 'growth manager'] },
  { key: 'software_engineer', patterns: ['software engineer', 'software developer', 'full stack', 'fullstack', 'full-stack', 'software architect', 'mobile developer', 'ios developer', 'android developer', 'react native', 'flutter developer', 'game developer'] },
]

export function classifyRole(roleTitle: string): { key: RoleKey; label: string } {
  const lower = roleTitle.toLowerCase()
  for (const { key, patterns } of ROLE_CLASSIFIERS) {
    if (patterns.some(p => lower.includes(p))) {
      return { key, label: roleTitle }
    }
  }
  return { key: 'general_tech', label: roleTitle }
}

const ROLE_LABELS: Record<RoleKey, string> = {
  software_engineer:  'Software Engineer',
  data_analyst:       'Data Analyst',
  data_engineer:      'Data Engineer',
  data_scientist_ml:  'Data Scientist / ML Engineer',
  product_manager:    'Product Manager',
  ux_ui_designer:     'UX/UI Designer',
  devops_cloud:       'DevOps / Cloud Engineer',
  business_analyst:   'Business Analyst',
  frontend_developer: 'Frontend Developer',
  backend_developer:  'Backend Developer',
  digital_marketing:  'Digital Marketing',
  general_tech:       'Tech Professional',
}

// ── Seniority resolution ──────────────────────────────────────────────────────

function resolveSeniority(input: SalaryEngineInput): Seniority {
  if (input.seniority) return input.seniority
  const yrs = input.years_experience ?? 0
  if (yrs < 2) return 'junior'
  if (yrs < 5) return 'mid'
  return 'senior'
}

// ── Source weights by seniority ───────────────────────────────────────────────
// Junior/mid: JobStreet dominates (high volume, accurate for this tier)
// Senior: Robert Walters leads (specialist clients, better senior benchmarking)

const WEIGHTS: Record<Seniority, Record<SourceKey, number>> = {
  junior: { jobstreet: 0.50, robert_walters: 0.25, michael_page: 0.25 },
  mid:    { jobstreet: 0.45, robert_walters: 0.30, michael_page: 0.25 },
  senior: { jobstreet: 0.25, robert_walters: 0.45, michael_page: 0.30 },
}

// ── Core algorithm ────────────────────────────────────────────────────────────

function midpoint(b: Band): number {
  return (b.min + b.max) / 2
}

function pairVariancePct(a: Band, b: Band): number {
  const ma = midpoint(a), mb = midpoint(b)
  return Math.abs(ma - mb) / ((ma + mb) / 2)
}

// Premium skills that push salary toward or above the upper bound
const PREMIUM_SKILLS = new Set([
  'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'machine learning', 'deep learning',
  'llm', 'pytorch', 'tensorflow', 'cybersecurity', 'penetration testing', 'devsecops',
  'data engineering', 'spark', 'kafka', 'flink', 'ray', 'rust', 'go', 'flutter',
  'ios', 'android', 'react native', 'blockchain', 'smart contracts',
])

function detectPremiumSkills(skills: string[] = []): string[] {
  return skills.filter(s => PREMIUM_SKILLS.has(s.toLowerCase()))
}

function generateInsightsText(
  role_label: string,
  seniority: Seniority,
  confidence_level: ConfidenceLevel,
  convergence_pairs: ConvergencePair[],
  min_salary: number,
  max_salary: number,
  adjustments: ContextualAdjustment[],
  relative_spread: number,
): string {
  const range = `RM ${min_salary.toLocaleString()} – ${max_salary.toLocaleString()}/month`
  const converging = convergence_pairs.filter(p => p.converges)
  const diverging = convergence_pairs.filter(p => !p.converges)

  const seniorityLabel = { junior: 'entry-level (0–2 years)', mid: 'mid-level (2–5 years)', senior: 'senior (5+ years)' }[seniority]

  let body = ''
  if (confidence_level === 'HIGH') {
    const pairNames = converging.map(p => `${p.source_a} and ${p.source_b}`).join('; ')
    body = `${pairNames} salary data converge within ${Math.round(converging[0].variance_pct * 100)}% for ${seniorityLabel} ${role_label} roles in Malaysia, indicating a well-established market rate. The ${range} band reflects the 25th–75th percentile across aligned sources.`
  } else if (confidence_level === 'VOLATILE') {
    const spreadPct = Math.round(relative_spread * 100)
    body = `Market data for ${seniorityLabel} ${role_label} roles shows significant divergence across sources — a ${spreadPct}% spread between specialist recruitment firms and volume platforms. This reflects genuine market uncertainty${seniority === 'senior' ? ', often driven by employer-specific AI/cloud skill premiums' : ''}. Treat the ${range} band as indicative rather than definitive; negotiation leverage depends heavily on employer type and skill specificity.`
  } else {
    const spreadPct = Math.round(relative_spread * 100)
    body = `Sources show partial agreement (${spreadPct}% midpoint spread) for ${seniorityLabel} ${role_label} roles. The ${range} range captures the market consensus, with ${diverging.length > 0 ? 'some divergence at the upper end from specialist recruiters targeting premium employers' : 'reasonable alignment across platforms'}.`
  }

  const adjustmentNotes = adjustments
    .map(a => `${a.factor}: ${a.impact_pct > 0 ? '+' : ''}${a.impact_pct}% (${a.reason})`)
    .join('; ')

  return adjustmentNotes ? `${body} Adjustments applied — ${adjustmentNotes}.` : body
}

// ── Public export ─────────────────────────────────────────────────────────────

export function computeSalaryConfidence(input: SalaryEngineInput): SalaryConfidenceResult {
  const { key: role_key } = classifyRole(input.role)
  const seniority = resolveSeniority(input)
  const role_label = ROLE_LABELS[role_key]

  // Step 1 — Pull source bands
  const jsBand = JOBSTREET[role_key][seniority]
  const rwBand = ROBERT_WALTERS[role_key][seniority]
  const mpBand = MICHAEL_PAGE[role_key][seniority]
  const dosmBand = DOSM[role_key][seniority]

  const weights = WEIGHTS[seniority]
  const dosmFloor = dosmBand.min

  const sources: SourceContribution[] = [
    { source: 'jobstreet',      label: 'JobStreet Malaysia Salary Report 2024–25',      weight: weights.jobstreet,      range: jsBand, midpoint: midpoint(jsBand) },
    { source: 'robert_walters', label: 'Robert Walters Malaysia Salary Survey 2025',     weight: weights.robert_walters, range: rwBand, midpoint: midpoint(rwBand) },
    { source: 'michael_page',   label: 'Michael Page Malaysia Salary Guide 2025',        weight: weights.michael_page,   range: mpBand, midpoint: midpoint(mpBand) },
    { source: 'dosm',           label: 'DOSM Labour Force Survey (wages by occupation)', weight: 0, range: dosmBand, midpoint: midpoint(dosmBand) },
  ]

  // Step 2 — Pairwise convergence (3 market sources only; DOSM is floor, excluded)
  const marketPairs: Array<[SourceKey, Band]> = [
    ['jobstreet', jsBand], ['robert_walters', rwBand], ['michael_page', mpBand],
  ]
  const convergence_pairs: ConvergencePair[] = []
  for (let i = 0; i < marketPairs.length; i++) {
    for (let j = i + 1; j < marketPairs.length; j++) {
      const [nameA, bandA] = marketPairs[i]
      const [nameB, bandB] = marketPairs[j]
      const variance = pairVariancePct(bandA, bandB)
      convergence_pairs.push({
        source_a: nameA,
        source_b: nameB,
        variance_pct: variance,
        converges: variance <= 0.10,
      })
    }
  }

  const convergingCount = convergence_pairs.filter(p => p.converges).length

  // Step 3 — Relative midpoint spread (3 market sources)
  const marketMids = [midpoint(jsBand), midpoint(rwBand), midpoint(mpBand)]
  const midpointSpread = Math.max(...marketMids) - Math.min(...marketMids)
  const midpointMean = marketMids.reduce((a, b) => a + b, 0) / 3
  const relative_midpoint_spread = midpointSpread / midpointMean

  // Step 4 — Confidence classification
  let confidence_level: ConfidenceLevel
  if (convergingCount >= 2 && relative_midpoint_spread <= 0.20) {
    confidence_level = 'HIGH'
  } else if (relative_midpoint_spread > 0.25 && convergingCount <= 1) {
    confidence_level = 'VOLATILE'
  } else {
    confidence_level = 'MEDIUM'
  }

  // Step 5 — Confidence score (0–100 numeric)
  const converge_factor = convergingCount / 3
  const spread_penalty = Math.max(0, 1 - Math.max(0, relative_midpoint_spread - 0.10) / 0.40)
  const confidence_score = Math.round(Math.min(100, (converge_factor * 0.65 + spread_penalty * 0.35) * 100))

  // Step 6 — Weighted midpoint from 3 market sources
  const weighted_midpoint = Math.round(
    marketMids[0] * weights.jobstreet +
    marketMids[1] * weights.robert_walters +
    marketMids[2] * weights.michael_page
  )

  // Weighted min/max
  const weighted_min = Math.round(
    jsBand.min * weights.jobstreet +
    rwBand.min * weights.robert_walters +
    mpBand.min * weights.michael_page
  )
  const weighted_max = Math.round(
    jsBand.max * weights.jobstreet +
    rwBand.max * weights.robert_walters +
    mpBand.max * weights.michael_page
  )

  // Step 7 — Unified band by confidence level
  let raw_min: number
  let raw_max: number
  const market_width = weighted_max - weighted_min

  if (confidence_level === 'HIGH') {
    // Tighter band centred on the weighted midpoint
    raw_min = Math.round(weighted_midpoint - market_width * 0.45)
    raw_max = Math.round(weighted_midpoint + market_width * 0.45)
  } else if (confidence_level === 'VOLATILE') {
    // Full market capture — show candidates the true spread
    raw_min = Math.min(jsBand.min, rwBand.min, mpBand.min)
    raw_max = Math.max(jsBand.max, rwBand.max, mpBand.max)
  } else {
    raw_min = weighted_min
    raw_max = weighted_max
  }

  // Step 8 — DOSM floor check
  const dosm_floor_applied = raw_min < dosmFloor
  const floored_min = dosm_floor_applied ? dosmFloor : raw_min

  // Step 9 — Contextual adjustments (applied to floored base)
  const adjustments: ContextualAdjustment[] = []
  let min_salary = floored_min
  let max_salary = raw_max

  if (input.company_type === 'mnc') {
    const uplift = 0.25
    adjustments.push({ factor: 'MNC employer premium', impact_pct: 25, reason: 'MNC/listed companies typically pay 20–35% above local SME mid-band in Malaysia' })
    min_salary = Math.round(min_salary * (1 + uplift))
    max_salary = Math.round(max_salary * (1 + uplift))
  } else if (input.company_type === 'startup') {
    const discount = -0.10
    adjustments.push({ factor: 'Startup compensation profile', impact_pct: -10, reason: 'Early-stage startups often pay below market median; offset via equity/ESOP' })
    min_salary = Math.round(min_salary * (1 + discount))
    max_salary = Math.round(max_salary * (1 + discount))
  }

  const premiumSkills = detectPremiumSkills(input.skills)
  if (premiumSkills.length > 0) {
    const premium = seniority === 'senior' ? 0.20 : 0.12
    adjustments.push({ factor: `In-demand skills premium (${premiumSkills.slice(0,3).join(', ')})`, impact_pct: Math.round(premium * 100), reason: 'Cloud/ML/security skills command a 12–25% premium above role mid-band' })
    max_salary = Math.round(max_salary * (1 + premium))
    min_salary = Math.round(min_salary * (1 + premium * 0.5))
  }

  const loc = (input.location ?? '').toLowerCase()
  if (loc.includes('penang') || loc.includes('johor') || loc.includes('jb')) {
    const discount = -0.15
    adjustments.push({ factor: 'Regional location discount', impact_pct: -15, reason: 'Penang/Johor Bahru roles typically sit 10–20% below KL benchmarks' })
    min_salary = Math.round(min_salary * (1 + discount))
    max_salary = Math.round(max_salary * (1 + discount))
  } else if (loc.includes('singapore') || loc.includes('sg')) {
    const factor = 2.7
    adjustments.push({ factor: 'Singapore market (SGD conversion ×2.7)', impact_pct: 170, reason: 'Singapore salaries are approximately 2.5–3× MYR equivalent in SGD; note KL 75th pct ≈ SG 25th–35th pct' })
    min_salary = Math.round(min_salary * factor)
    max_salary = Math.round(max_salary * factor)
  }

  // Round to nearest RM 100
  min_salary = Math.round(min_salary / 100) * 100
  max_salary = Math.round(max_salary / 100) * 100

  const market_insights_text = generateInsightsText(
    role_label, seniority, confidence_level, convergence_pairs,
    min_salary, max_salary, adjustments, relative_midpoint_spread
  )

  return {
    role_key,
    role_label,
    seniority,
    min_salary,
    max_salary,
    confidence_score,
    confidence_level,
    market_insights_text,
    source_convergence_metadata: {
      sources_used: sources,
      convergence_pairs,
      dosm_floor: dosmFloor,
      dosm_floor_applied,
      contextual_adjustments: adjustments,
      relative_midpoint_spread,
      weighted_midpoint,
      data_vintage: '2025–2026 (JobStreet 2024–25, Robert Walters 2025, Michael Page 2025, DOSM LFS)',
    },
  }
}

// ── Batch helper ──────────────────────────────────────────────────────────────
// Convenience function for path-navigator and coach context injection.
// Given a list of role titles and a seniority, returns a compact table string.

export function buildSalaryReferenceBlock(
  roleTitles: string[],
  seniority: Seniority,
  context?: Pick<SalaryEngineInput, 'location' | 'company_type' | 'skills'>,
): string {
  const unique = [...new Set(roleTitles.map(r => classifyRole(r).key))]
  const rows = unique.map(key => {
    const label = ROLE_LABELS[key]
    const result = computeSalaryConfidence({ role: label, seniority, ...context })
    return `  • ${label}: RM ${result.min_salary.toLocaleString()}–${result.max_salary.toLocaleString()}/mo [${result.confidence_level}, score: ${result.confidence_score}]`
  })
  const senLabel = { junior: '0–2 yrs', mid: '2–5 yrs', senior: '5+ yrs' }[seniority]
  return `SALARY REFERENCE (${senLabel}, engine-computed, cross-referenced 4 sources):\n${rows.join('\n')}`
}
