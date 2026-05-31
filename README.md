# Career OS — Skills-First Hiring for APAC

> Built for the Talentbank Tech Hackathon 2026.

Career OS is a hiring platform that treats your **skills as your résumé** — not your degree, not your last job title, not the university name on your CV. In a region where AI automation is reshaping which skills matter year by year, we give candidates a live career GPS instead of a static job board.

---

## Live Demo

**Vercel:** _(deploy URL — added before final submission)_

**Demo accounts:**
- Candidate: sign up at `/sign-up`, choose Candidate
- Employer: sign up at `/sign-up`, choose Employer (15 seed jobs pre-loaded)

---

## Key Features

### Candidate side
| Feature | What it does |
|---|---|
| **Skills Vault** | Manually add skills + import from GitHub (AI extracts your stack from repos) |
| **AI Resume Import** | Upload PDF or paste LinkedIn/Seek text — Claude extracts structured profile |
| **Career Identity** | 4-step guided form → Claude writes your professional narrative |
| **Path Navigator** | 3 navigation paths (strong / emerging / stretch) based on your actual skills |
| **Job Matches** | Every open role ranked by skill overlap — matched skills ✓, gaps ✗, in plain view |
| **AI Coach** | Live streaming chat that knows your skills, goals, and APAC market context |
| **Portfolio** | Project showcase with GitHub import and AI-generated summaries |

### Employer side
| Feature | What it does |
|---|---|
| **Job posting** | Skills-first job creation (required vs nice-to-have) |
| **Talent pool** | All candidates ranked by skill match for each open role |
| **Culture identity** | AI-generated employer brand from culture questionnaire |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Auth | Clerk v7 |
| Database | Supabase (PostgreSQL + pgvector for embeddings) |
| AI | Anthropic Claude claude-haiku-4-5 |
| UI | shadcn/ui + Tailwind CSS |
| Language | TypeScript (strict) |
| Deploy | Vercel |

---

## AI Disclosure

All AI features use **Anthropic's Claude claude-haiku-4-5** model:

| Feature | How AI is used |
|---|---|
| Resume/PDF import | Claude extracts structured profile (name, skills, experience) from raw text |
| Career Identity synthesis | Claude writes a narrative paragraph from structured form answers |
| Path Navigator | Claude generates 3 contextualised career paths in JSON, grounded in APAC market data |
| AI Coach | Claude streams conversational career advice, personalised to the candidate's live profile |
| GitHub skill extraction | Claude reads repo READMEs and languages to infer verified skills |
| Portfolio summaries | Claude summarises what each project demonstrates professionally |

**Prompt caching** is used on all static system prompts to reduce latency and API cost ~70–80% on repeat calls.

**Navigation framing** is enforced in all AI outputs: Claude is instructed to say "professionals with similar profiles typically…" not "you will…". Outcomes are shown as ranges, not predictions.

No AI output is stored without the user explicitly triggering it. Users can regenerate any AI feature at any time.

---

## Local Setup

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- Clerk account (free tier works)
- Anthropic API key

### 1. Install

```bash
git clone <repo>
cd career-os
npm install
```

### 2. Environment variables

Create `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# App URL (for internal server-to-server calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database setup

Run these SQL files in Supabase SQL editor **in order**:

```
supabase/schema.sql                  # Tables, indexes, pgvector functions
supabase/add-career-data-columns.sql # JSONB career_data column
supabase/add-performance-indexes.sql # Query performance indexes
supabase/seed-jobs.sql               # 15 seed jobs for demo
```

### 4. Clerk webhook

In Clerk Dashboard → Webhooks, create an endpoint:
`https://your-domain.com/api/webhooks`

Events: `user.created` · Copy signing secret → `CLERK_WEBHOOK_SECRET`

### 5. Run

```bash
npm run dev
# http://localhost:3000
```

---

## Architecture

```
src/
├── app/
│   ├── (candidate)/          # Candidate-facing pages
│   │   ├── dashboard/        # Home screen with profile completeness
│   │   ├── discover/         # Career Identity 4-step form
│   │   ├── paths/            # Career Path Navigator (AI-generated)
│   │   ├── profile/          # Skills Vault + GitHub/PDF import
│   │   ├── portfolio/        # Living Portfolio (project showcase)
│   │   ├── jobs/             # Ranked job matches
│   │   └── coach/            # AI Career Coach (streaming chat)
│   ├── (employer)/employer/  # Employer-facing pages
│   │   ├── dashboard/        # Company overview + job stats
│   │   ├── jobs/             # Post and manage job listings
│   │   ├── candidates/       # Ranked candidates per role
│   │   ├── company/          # Company profile
│   │   └── culture/          # Culture identity form + AI synthesis
│   └── api/                  # Route handlers
│       ├── candidate/        # Profile, skills, matches, paths, coach
│       └── employer/         # Company, jobs, culture
├── lib/
│   ├── ai/                   # All Claude integrations (never called directly from routes)
│   │   ├── career-synthesizer.ts   # Career + employer identity narratives
│   │   ├── path-navigator.ts       # 3-path career navigation
│   │   ├── profile-extractor.ts    # Resume/URL/PDF import
│   │   └── coach.ts               # Streaming coaching chat
│   └── supabase/             # DB client factories (server + browser)
└── types/
    └── database.ts           # Full DB schema as TypeScript types
```

**Architectural decisions:**
- Server Components for all data fetching; Client Components only for interactive UI
- `createServerClient()` (service_role) server-side; `createBrowserClient()` (anon key) client-side
- All AI calls go through `src/lib/ai/` — never called directly from route handlers
- Skill matching is deterministic overlap scoring — no OpenAI embeddings required for basic matching
- JSONB blobs (`career_data`, `culture_data`) keep schema migrations minimal as the product evolves
- Query standards enforced: no `SELECT *`, composite indexes on all query patterns, columns named explicitly

---

## Judging Criteria Alignment

| Criterion | Weight | How we address it |
|---|---|---|
| Product & UX | 30% | Navigation metaphor, no jargon, demo-ready end-to-end flow |
| System Design | 25% | pgvector matching, prompt caching, typed schema, performance indexes |
| Completeness | 20% | Both candidate and employer flows fully functional |
| AI Craft | 15% | 6 distinct AI features, streaming chat, navigation framing, caching |
| Code Quality | 10% | TypeScript strict, CLAUDE.md code review standards, /simplify gate |

---

*Solo submission — Talentbank Tech Hackathon 2026.*
