# Talentbank Tech Hackathon 2026 — Intent Form Draft
# Solo submission | Due: June 15, 2026
# ─────────────────────────────────────────────────────────────────────────────
# Copy the section below into the form. ~800 words.
# ─────────────────────────────────────────────────────────────────────────────

---

## Project Name
**Career OS — A Skills-First Career GPS for APAC**

---

## Concept Brief (~800 words)

### The problem we're solving

The job market in Southeast Asia is breaking in a specific, underreported way. It's not that jobs are disappearing — it's that the skills required for any given job are changing faster than hiring systems can keep up with. A candidate who was perfectly qualified eighteen months ago may now be missing three critical skills that didn't exist on any job description until recently. Meanwhile, hiring platforms built on résumés and keywords are filtering candidates the same way they did in 2005.

The people hit hardest are those without a prestigious university brand or a Fortune 500 name on their CV — which is most of the talent pool in Malaysia and the wider APAC region. They have real skills, built through bootcamps, freelance work, open source contributions, and self-teaching. But the hiring system can't see them.

Career OS is built to fix this.

### What we built

Career OS is a skills-first hiring platform with two sides: candidates who build a living skills profile, and employers who define jobs by what they actually need someone to be able to do.

The core insight is a shift in framing: instead of asking "does this person's résumé match this job description?" we ask "which of this candidate's verified skills overlap with what this role requires, and what's the gap?" The answer is shown in plain language to both sides — not a black-box percentage, but a specific list of matched and missing skills.

**For candidates, the platform has six interconnected features:**

1. **Skills Vault** — A living inventory of verified skills, each tagged with a proficiency level (1–5) and a source (self-reported, GitHub-extracted, or formally assessed). Candidates can import skills directly from GitHub repositories, where Claude reads READMEs and commit history to infer their actual tech stack.

2. **AI Resume Import** — Upload a PDF or paste a LinkedIn/Seek profile. Claude parses the raw text and extracts a structured profile — experience, education, skills, and career preferences — which the candidate reviews before applying. No locked-in data.

3. **Career Identity** — A guided 4-step form that captures where the candidate is now, what they're looking for, what matters to them, and where they want to be in five years. Claude synthesises their answers into a concise Career Identity narrative — a paragraph that captures who this person is professionally without the hollow language of most "professional summaries."

4. **Career Path Navigator** — The centrepiece feature. Claude takes the candidate's current skill set and career stage and maps out three realistic directions: a Strong Match (roles they can step into in 1–6 months), an Emerging Path (6–18 months of focused development), and a Stretch Goal (18–36 months). Critically, every path uses navigation language — "professionals with similar profiles in Malaysia typically move here within X months" — not prediction language. We show ranges, not certainties.

5. **Job Matches** — Every open role on the platform is scored against the candidate's skills using deterministic overlap matching. Green chips show matched skills; red chips show missing required skills. No black-box scores. The candidate can see exactly why they match or don't match any role.

6. **AI Coach** — A live streaming chat interface powered by Claude that knows the candidate's actual profile. It gives APAC-specific advice: real salary bands in MYR, which companies in KL are actively hiring, which skills are worth learning given what the market actually demands right now.

**For employers**, the platform provides a talent pool that's ranked by genuine skill fit for each open role, with gap analysis visible at a glance. Employers can also build a Culture Identity — an AI-synthesised employer brand from a culture questionnaire — making their company legible to candidates before they apply.

### Technical approach

The platform is built on Next.js 16 with Supabase for data and pgvector for semantic matching, Clerk for authentication, and Claude claude-haiku-4-5 for all AI features. Skill matching is deterministic overlap scoring — no OpenAI embeddings required for the core flow. Prompt caching is applied to all static AI system prompts, reducing API latency and cost by approximately 70–80% on repeat calls. The full stack is TypeScript with strict mode.

### Why this matters

We built Career OS with a specific vision in mind: a world where your career trajectory isn't determined by where you went to school or which companies happened to hire you early on. In a region undergoing rapid economic transition driven by AI adoption, the candidates who'll navigate this best aren't the ones with the most credentials — they're the ones who can see clearly where they are, where similar people have gone, and what they need to learn next.

That's what Career OS is: not a job board. A career GPS.

---

## Team
**Solo submission** — Looi Mun Wai

---

## Prototype
**URL:** _(Vercel deploy URL — available by July 26 submission)_
**Demo video:** _(to be recorded once deployed)_

---

## Module Selections
_(Fill in based on the specific tracks listed at techhackathon.com)_
- AI/ML Integration
- Job & Career Platform
- _(add any additional relevant tracks)_
