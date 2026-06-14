# Career OS — Asia's Career Co-Pilot, Built for Malaysia

> Skills-first hiring for APAC. Built solo for the **Talentbank Tech Hackathon 2026**.

Career OS treats your **skills as your résumé** — not your degree, not your last job title, not the university name on your CV. In a region where AI automation is reshaping which skills matter year by year, we give candidates a live career GPS, and give employers a way to understand a person beyond a plain resume.

- **Live demo:** https://career-os-dusky.vercel.app
- **Repo:** https://github.com/munwai111/Talentbank-tech-hackathon-2026-challenge-Mun_Wai
- **Status:** Demo-ready, deployed on Vercel. Built May 28 – June 14, 2026.

---

## Table of contents

- [What it is](#what-it-is)
- [Module coverage](#module-coverage)
- [Feature map](#feature-map)
- [AI features & disclosure](#ai-features--disclosure)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Local setup](#local-setup)
- [Malaysian market context](#malaysian-market-context)
- [Companion docs](#companion-docs)

---

## What it is

Career OS is a **dual-sided career marketplace**:

- **Candidates** build a living, sourced profile (skills, work history, portfolio, AI persona), get AI-powered career navigation, and apply to skills-first roles.
- **Employers** post roles by required vs. nice-to-have skills, and see talent ranked by genuine fit — skill overlap *and* career-goal alignment.

The product's thesis: hiring in Asia is broken because it filters on credentials and keywords. Career OS filters on **demonstrated capability** and **trajectory**.

---

## Module coverage

Compulsory module plus six optional Challenge Modules:

| Module | Status | Where it lives |
|---|---|---|
| **Career OS / Marketplace** (compulsory) | ✅ Full | Dual-sided platform, end-to-end apply→review loop |
| **C-01 Career Path Navigator** | ✅ Full | `/paths` · `lib/ai/path-navigator.ts` |
| **C-02 Living Portfolio** | ✅ Full | `/portfolio`, Skills Vault · GitHub + PDF import |
| **C-03 AI Career Coach** | ✅ Full | `/coach`, Floating AI orb · `lib/ai/coach.ts` |
| **C-05 Life Chapter Designer** | ✅ Full | Step 5 of Career Identity (`/discover`) |
| **C-04 Fair Pay Engine** | ⚡ Embedded | MYR bands in paths + coach salary reference |
| **E-01 Smart Talent Matching** | ⚡ Live | Skill overlap (70%) + goal alignment (30%) |

---

## Feature map

### Candidate side

| Feature | What it does |
|---|---|
| **Guided registration wizard** | 5-phase onboarding that builds a real profile, not just an account |
| **AI Resume / PDF / URL import** | Upload a CV or paste LinkedIn/Seek text — Claude extracts structured profile, work history, and skills |
| **Skills Vault (gamified)** | A 5-tier mastery ladder. Each skill opens an AI "professional read" — which roles need it, real use cases + impact, and where it shows in *your own* work history |
| **GitHub import** | Claude reads your repos' languages + READMEs to infer verified skills |
| **Career Identity** | Guided form → Claude writes your professional narrative (`career_identity_summary`) |
| **AI Persona engine** | Whole-person, evidence-grounded persona: MBTI-style read, Big Five (OCEAN), and a workplace behavioural profile for hiring teams (indicative, with disclaimers) |
| **Path Navigator** | Three realistic directions — Strong Match (1–6 mo), Emerging (6–18 mo), Stretch (18–36 mo) — in navigation language, never prediction |
| **Job matches** | Every open role ranked by skill overlap; matched ✓ and missing ✗ skills in plain view |
| **Application loop** | Apply, track status (applied → reviewing → interview → offer / rejected) |
| **AI Coach + Floating AI orb** | Streaming chat that knows your live profile and APAC market context, reachable anywhere via a floating orb |
| **News & Events** | Followed channels feed, saved items, event discovery/tickets/hosting (Supabase-backed preferences) |
| **Profile view/edit** | A "scroll journey" public profile (Hinge-style) with linked accounts (GitHub, LinkedIn, website, FB/IG/TikTok), theme-aware |
| **Settings + 12-language support** | APAC language switcher (see below); account & privacy controls; PDPA-aligned account deletion |

### Employer side

| Feature | What it does |
|---|---|
| **Skills-first job posting** | Required vs. nice-to-have skills, MYR salary bands, remote/location |
| **Ranked candidates per role** | Talent pool scored by combined skill + goal-alignment match |
| **Applicants panel** | See who actually applied, their match %, matched/missing skills, and advance/reject through the pipeline |
| **Company + Culture identity** | AI-generated employer brand from a culture questionnaire |
| **Demo setup** | One-click seeding of a ready-to-explore employer workspace |

---

## AI features & disclosure

All in-product AI runs on **Anthropic Claude (Haiku 4.5)**. Every Claude integration is isolated in `src/lib/ai/` — never called directly from a route handler.

| Library | Feature | How AI is used |
|---|---|---|
| `profile-extractor.ts` | Resume / PDF / URL import | Extracts structured profile from raw documents (native document blocks + text fallback) |
| `career-synthesizer.ts` | Career & employer identity | Writes the candidate narrative and employer culture brand |
| `persona-profiler.ts` | AI Persona engine | MBTI-style + Big Five + workplace behavioural read, evidence-grounded with calibrated confidence |
| `skill-insight.ts` | Skills Vault | Per-skill recruiter-grade read, grounded in the candidate's own work history |
| `path-navigator.ts` | Path Navigator | Three contextual career paths in JSON, grounded in APAC market data |
| `coach.ts` | AI Coach | Streaming, personalised career advice with a Malaysian salary reference table |
| `minutes.ts` | Conversation minutes | Summary + key points + action items from a contact conversation |

**Responsible-AI practices baked in:**
- **Navigation framing** — Claude says *"professionals with similar profiles typically…"*, never *"you will…"*. Outcomes are ranges, not predictions.
- **Evidence-grounded** — persona/skill insights cite only what the candidate actually provided; empty when there's no evidence, never fabricated.
- **No protected characteristics** — the persona and (planned) hiring-council prompts are explicitly barred from inferring age, gender, ethnicity, religion, family status, or disability.
- **Prompt caching** on all static system prompts → ~70–80% latency/cost reduction on repeat calls.
- **User-triggered** — no AI output is stored unless the user explicitly generates it; everything is regenerable.
- **Localised output** — AI content (e.g. skill insights) generates in the user's selected language.

> **Build-time AI:** This project was built with **Claude Code** (Anthropic) for code generation, debugging, architecture review, and documentation. Disclosed in full.

### Multi-language (APAC)

A real i18n layer (`src/lib/i18n/`) ships **12 APAC locales**: English, Bahasa Melayu, Bahasa Indonesia, 中文(简体), 中文(繁體), 日本語, 한국어, ภาษาไทย, Tiếng Việt, Filipino, हिंदी, தமிழ். A `LanguageProvider` hydrates instantly from `localStorage`, syncs from the user's saved preference, and exposes a `t()` helper. UI strings (nav, settings) switch instantly; AI-generated content is requested in the active language. Coverage is expanding across the app (see [ROADMAP.md](ROADMAP.md)).

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Auth | Clerk v7 |
| Database | Supabase (PostgreSQL + pgvector) |
| AI inference | Anthropic Claude Haiku 4.5 |
| UI | Tailwind CSS v4 + shadcn/ui + Base UI |
| Motion | GSAP 3 + ScrollTrigger + `@gsap/react` |
| Theming | `next-themes` (dark "Aurora-Navy" + light), semantic tokens |
| Language | TypeScript (strict) |
| Deploy | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/                # sign-in, sign-up
│   ├── onboarding/            # 5-phase registration wizard
│   ├── (candidate)/           # candidate pages
│   │   ├── dashboard/  coach/  discover/  paths/
│   │   ├── profile/    portfolio/  jobs/  applications/
│   │   ├── news/  events/  settings/
│   ├── (employer)/employer/   # employer pages
│   │   ├── dashboard/  jobs/  candidates/[jobId]/
│   │   ├── company/   culture/  talent/
│   └── api/                   # ~33 route handlers
│       ├── candidate/         # profile, skills, matches, paths, coach, ai-profile, …
│       └── employer/          # jobs, company, culture, applications, demo-setup
├── lib/
│   ├── ai/                    # 7 Claude integrations (isolated from routes)
│   ├── i18n/                  # 12-locale translation layer + LanguageProvider
│   ├── matching.ts            # deterministic skill + goal-alignment scoring
│   └── supabase/              # server (service_role) + browser (anon) clients
├── components/                # UI, animations, shared, floating-ai
└── types/database.ts          # full DB schema as TypeScript types

supabase/                      # 11 SQL files — schema, migrations, seeds
```

**Architectural decisions** (full rationale in [DECISIONS.md](DECISIONS.md)):
- Server Components for data fetching; Client Components only where interactivity is required.
- `createServerClient()` (service_role) server-side; `createBrowserClient()` (anon) client-side.
- All AI calls go through `src/lib/ai/` — never inline in routes.
- Skill matching is **deterministic** overlap scoring with synonym normalisation — no embeddings required for the core match path; pgvector available for semantic extensions.
- JSONB blobs (`career_data`, `culture_data`) keep schema migrations minimal as the product evolves.
- Query standards enforced: no `SELECT *`, explicit columns, composite indexes on every query pattern.

---

## Local setup

### Prerequisites
Node.js 18+ · a Supabase project · a Clerk app · an Anthropic API key.

### 1. Install
```bash
git clone https://github.com/munwai111/Talentbank-tech-hackathon-2026-challenge-Mun_Wai.git
cd career-os
npm install
```

### 2. Environment variables — `.env.local`
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

# App URL (server-to-server calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database — run in Supabase SQL editor, in order
```
supabase/schema.sql
supabase/add-career-data-columns.sql
supabase/add-work-experience-columns.sql
supabase/add-registration-columns.sql
supabase/add-user-preferences.sql
supabase/add-profile-extended.sql
supabase/add-deletion-columns.sql
supabase/add-performance-indexes.sql
supabase/seed-jobs.sql          # 15 demo jobs
supabase/seed-candidates.sql    # demo candidates (optional)
```
> Shortcut: `supabase/run-all-migrations.sql` bundles the migrations.

### 4. Clerk webhook
Clerk Dashboard → Webhooks → endpoint `https://<your-domain>/api/webhooks`, event `user.created`. Copy the signing secret to `CLERK_WEBHOOK_SECRET`.

### 5. Run
```bash
npm run dev   # http://localhost:3000
```

---

## Malaysian market context

Career OS is built for Malaysia's actual talent pool — not the LinkedIn-native, English-fluent demographic.

| Decision | Why it matters for Malaysia |
|---|---|
| MYR salary ranges throughout | Most candidates have no market salary data — guessing costs them. |
| TVET/diploma-aware framing | Malaysia's graduate pipeline is heavily diploma + TVET, not degree-first. |
| B40/M40 awareness | Coach references SOCSO, PERKESO, JKM reskilling grants where relevant. |
| HRDC-funded upskilling | Employer-funded training is widely available — Coach surfaces it. |
| 12-language APAC support | The region is multilingual; the product shouldn't assume English. |
| MYSkills / MQF alignment (planned) | National skills + qualification frameworks as the verified-credential backbone. |

**Integration story:** Career OS is built to run *on top of* Talentbank, not replace it. The schema maps directly to candidate profiles, employer companies, and job listings; the AI layer is modular and API-callable. Adoption is a configuration + data-migration exercise, not a rebuild.

---

## Companion docs

- **[BUILD-JOURNAL.md](BUILD-JOURNAL.md)** — what we built, when, and *why* (phase-by-phase, grounded in git history).
- **[ROADMAP.md](ROADMAP.md)** — what's next, and the future vision if this is adopted.
- **[DECISIONS.md](DECISIONS.md)** — architectural decision records.
- **[HACKATHON-INTENT-FORM.md](HACKATHON-INTENT-FORM.md)** — the hackathon submission content.

---

*Solo submission — Talentbank Tech Hackathon 2026. Built by Looi Mun Wai.*
