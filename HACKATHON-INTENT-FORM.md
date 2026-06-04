# Talentbank Tech Hackathon 2026 — Intent Form
# Solo submission | Due: June 15, 2026
# ─────────────────────────────────────────────────────────────────────────────

---

## Project Name
**Career OS — Asia's Career Co-Pilot, Built for Malaysia**

---

## Module Selections

**Compulsory:**
- ✅ Career OS / Career Marketplace — dual-sided platform (candidates + employers)

**Optional modules tackled:**
- ✅ C-01 Career Path Navigator
- ✅ C-02 Living Portfolio
- ✅ C-03 AI Career Coach
- ✅ C-05 Life Chapter Designer
- ⚡ C-04 Fair Pay Engine *(salary data embedded in career paths; standalone salary signal live)*
- ⚡ E-01 Smart Talent Matching *(skills-overlap matching + career goal alignment weighting)*

---

## Concept Brief (~800 words)

### The problem

For most people across Asia, no one tells you what's next. You make the most consequential decisions of your professional life — which skills to build, which moves to make, when to push and when to pivot — with no data, no map, and no co-pilot. Just guesses, peer pressure, and hope.

This is especially acute in Malaysia. A TVET graduate from Kedah with genuine technical ability has no way to show it. A mid-career professional wondering whether to pivot into data engineering has no way to see what that move actually looks like for someone with their background. A fresh IT diploma holder applying to 30 jobs has no idea which ones are realistic and which are out of reach — and why.

Career OS is the answer to that problem. Not a job board. A career co-pilot.

### What we built

Career OS is a dual-sided Career OS / Career Marketplace: candidates build living profiles and get AI-powered career navigation; employers post skills-first roles and see talent ranked by genuine fit.

**Compulsory module — Career OS / Career Marketplace:**
The platform connects both sides of Malaysia's hiring market. Candidates are not filtered by keyword — they're matched by skill overlap and career trajectory. Employers see not just who qualifies today, but who is heading in the right direction.

**C-01 — Career Path Navigator:**
Claude maps three realistic directions from a candidate's current skill set: a Strong Match (1–6 months away), an Emerging Path (6–18 months), and a Stretch Goal (18–36 months). Every path uses navigation language — "professionals with similar profiles in Malaysia typically..." — not prediction language. Salaries in MYR. Timelines in realistic ranges. No false certainty.

**C-02 — Living Portfolio:**
A candidate's skills don't live in a CV — they live in GitHub repositories, past projects, and worked examples. Career OS imports skills directly from GitHub (Claude reads repo languages and READMEs), CV/PDF uploads (Claude extracts structured work history and skills), or manual entry. The Skills Vault is a living, sourced record of what the candidate can actually do.

**C-03 — AI Career Coach:**
A streaming chat interface powered by Claude that knows the candidate's actual profile — skills, work history, education, career goals. It gives APAC-specific advice: real MYR salary bands, honest assessments of whether a goal is realistic, concrete skill recommendations based on what the KL market actually demands. Not a chatbot. A senior mentor.

**C-05 — Life Chapter Designer:**
Career planning that fits actual life. A new step in the Career Identity flow asks candidates about life context: caregiving responsibilities, planned career breaks, location constraints, health, return after a gap. The Path Navigator and AI Coach use this context to give advice grounded in the candidate's reality — not just their skills.

**E-01 — Smart Talent Matching (goal-aligned):**
Matching is not just "does this candidate have these keywords." Career OS scores candidates on skill overlap (70%) and career goal alignment (30%) — surfacing people who are genuinely heading toward the role, not just those who happened to use the right words. Both sides see matched skills, missing skills, and goal alignment in plain view.

**C-04 — Fair Pay Engine:**
Salary ranges in MYR are embedded in every career path the Path Navigator generates. The AI Coach holds a full salary reference table for Malaysian tech roles at junior, mid, and senior levels — so candidates can ask "am I underpaid?" and get a specific, grounded answer, not a generic response.

### Technical approach

Next.js 16 (App Router) · Supabase + pgvector · Clerk auth · Claude Haiku 4.5 · TypeScript strict · Vercel

All AI calls are prompt-cached — static system prompts are cached across calls, reducing API latency and cost ~70–80%. Skill matching is deterministic overlap scoring with synonym normalisation, augmented by keyword-based goal alignment. The architecture is designed to run on top of an existing candidate/employer database — not just as a greenfield app. Career OS could be deployed against Talentbank's existing talent graph with configuration changes, not a rebuild.

### Malaysian market context

Career OS is built for Malaysia's actual talent pool — not the LinkedIn-native, English-fluent developer demographic. Skills map to roles common in the Malaysian market. Salary ranges are calibrated for MYR, with Singapore noted for comparison. The platform's skills framework is aligned with MYSkills (Malaysia's national skills recognition system) and supports HRDC-funded upskilling tracks as a future integration layer. The career path logic accounts for Malaysia's graduate pipeline: diploma holders, TVET graduates, fresh degree holders entering a market in rapid transition. Candidates in B40/M40 income brackets can be pointed toward SOCSO, PERKESO, and JKM reskilling grants via the AI Coach.

### Integration story

Career OS is not built to replace Talentbank — it's built to run on top of it. The database schema maps directly to candidate profiles, employer companies, and job listings. The AI layer (path navigator, coach, profile extractor) is modular and callable via API. A Talentbank integration path would involve: pointing the auth layer at Talentbank's existing user database, mapping the candidate and employer profile schemas, and activating the AI features against existing data. No rebuild required — configuration changes and data migration.

### Why this matters

Talentbank is building Asia's Career OS. This submission is built with that goal in mind — not a generic platform adapted to Malaysia, but one designed from the start to serve the talent Talentbank knows best. The code is open, the architecture is adoptable, and the product is demo-ready today.

---

## Team
**Solo submission** — Looi Mun Wai

---

## Prototype
**Live URL:** https://career-os-dusky.vercel.app
**Demo accounts:** Sign up at `/sign-up` — choose Candidate or Employer (15 seed jobs pre-loaded)
**Demo video:** *(to be recorded by June 13 — Malaysian candidate persona, Shah Alam, IT diploma, career pivot scenario)*
