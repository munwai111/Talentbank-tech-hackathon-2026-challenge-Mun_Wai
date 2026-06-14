# Talentbank Tech Hackathon 2026 — Intent Form
# Team: LVMY (Solo) | Due: June 15, 2026
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

For most people, there is no single right decision that guarantees success, but there's always a sound decision. The great opportunity is always out there, yet our lack of connection to the right insights, guidance, community, and information can tunnel-vision our abilities to venture beyond our current capabilities — struggling to break from limited preconceptions, views, ambitions, and understanding of the real world's opportunities; failing to envision bigger and longer-term goals; choosing the wrong job or company; building the wrong skill; or struggling to grow into the right connection to be ahead of the game at all times. Worst of all is the growing population of the silently unemployed. This is not linearly and single-handedly correlated to the most feared issue of the "AI job-pocalypse," the rising scams of phantom jobs, or the hidden job-market dominations that greatly deteriorate job seekers' trust in the market itself. But the constant broadcasting and exposure to the amalgamated sense of job-market chaos — through social media, job rejections, peer feedback, and news — normalises cynicism in our worldviews, demonising people's perception of all large companies and the market as exploitative and heartless. Data alone doesn't decide careers — connection does. And without a space that promotes, hosts, and interconnects opportunities with the right stakeholders, even the best candidate in the market will be unknowingly filtered out. Hence, Career OS is not a tool, but a space that guides and journals throughout one's life-development cycle — to truly promote every phase, growth, and achievement of an individual to the right audience, business connection, and community that provides or supports similar efforts, interests, and qualities. To rebuild and regain trust in the market, in people, and most importantly, in ourselves.

### The response — what we built

So we built the space. Career OS is a dual-sided Career OS / Career Marketplace: candidates build living profiles and get AI-powered career navigation; employers post skills-first roles and see talent ranked by genuine fit. It does not just match a CV to a keyword — it journals a person's growth and connects it to the people, communities, and opportunities that would actually value it.

**Compulsory module — Career OS / Career Marketplace:**
The platform connects both sides of Malaysia's hiring market. Candidates are not filtered by keyword — they're matched by skill overlap and career trajectory. Employers see not just who qualifies today, but who is heading in the right direction.

**C-01 — Career Path Navigator:**
Claude maps three realistic directions from a candidate's current skill set: a Strong Match (1–6 months away), an Emerging Path (6–18 months), and a Stretch Goal (18–36 months). Every path uses navigation language — "professionals with similar profiles in Malaysia typically..." — not prediction language. Salaries in MYR. Timelines in realistic ranges. No false certainty.

**C-02 — Living Portfolio:**
A candidate's skills don't live in a CV — they live in GitHub repositories, past projects, and worked examples. Career OS imports skills directly from GitHub (Claude reads repo languages and READMEs), CV/PDF uploads (Claude extracts structured work history and skills), or manual entry. The Skills Vault is a living, sourced record of what the candidate can actually do.

**C-03 — AI Career Coach:**
A streaming chat interface powered by Claude that knows the candidate's actual profile — skills, work history, education, career goals. It gives APAC-specific advice: real MYR salary bands, honest assessments of whether a goal is realistic, concrete skill recommendations based on what the KL market actually demands. Not a chatbot. A senior mentor.

The coach now persists. A **ChatGPT-style session sidebar** saves every conversation to Supabase — candidates can return to any past session, rename it, or start a fresh one. More significantly, the coach builds an **evolving memory**: after each conversation, a compact summary is updated and stored per candidate in their profile (`career_data.coach_memory`). Every future session begins with the coach already aware of who this person is, what they've worked through, and where they're heading. The memory fires off the streaming hot path (zero latency impact) and deepens the coach's understanding across weeks of use — exactly the quality that makes a mentor valuable over time.

**C-05 — Life Chapter Designer:**
Career planning that fits actual life. A new step in the Career Identity flow asks candidates about life context: caregiving responsibilities, planned career breaks, location constraints, health, return after a gap. The Path Navigator and AI Coach use this context to give advice grounded in the candidate's reality — not just their skills.

**E-01 — Smart Talent Matching (goal-aligned):**
Matching is not just "does this candidate have these keywords." Career OS scores candidates on skill overlap (70%) and career goal alignment (30%) — surfacing people who are genuinely heading toward the role, not just those who happened to use the right words. Both sides see matched skills, missing skills, and goal alignment in plain view.

**C-04 — Fair Pay Engine:**
Salary ranges in MYR are embedded in every career path the Path Navigator generates. The AI Coach holds a full salary reference table for Malaysian tech roles at junior, mid, and senior levels — so candidates can ask "am I underpaid?" and get a specific, grounded answer, not a generic response.

**Beyond the resume — whole-person profiles:**
The product's deepest bet is that an employer should *understand* a candidate, not just scan them. Career OS builds an evidence-grounded AI persona (an MBTI-style read, Big Five / OCEAN, and a workplace behavioural profile for hiring teams) — drawn only from what the candidate actually provides, with explicit guardrails against inferring age, gender, ethnicity, religion, family status, or disability. Profiles render as an editorial "scroll journey": viewing someone feels like being walked through a person, chapter by chapter — for the candidate building it and the employer reading it. And because APAC isn't English-first, the entire experience runs through a 12-language layer (English, Bahasa Melayu/Indonesia, 中文 簡/繁, 日本語, 한국어, ไทย, Tiếng Việt, Filipino, हिंदी, தமிழ்), with AI output generated in the candidate's chosen language.

### Technical approach

Next.js 16 (App Router) · Supabase + pgvector · Clerk auth · Claude Haiku 4.5 · TypeScript strict · GSAP motion · 12-locale i18n · Vercel

All AI calls are prompt-cached — static system prompts are cached across calls, reducing API latency and cost ~70–80%. Skill matching is deterministic overlap scoring with synonym normalisation, augmented by keyword-based goal alignment. Coach sessions and messages persist to Supabase (`coach_sessions`, `coach_messages`); an evolving memory summary is maintained per candidate (`career_data.coach_memory`) and updated off the streaming hot path by a second Haiku call — adding zero latency to the conversation while accumulating meaningful context over time. The architecture is designed to run on top of an existing candidate/employer database — not just as a greenfield app. Career OS could be deployed against Talentbank's existing talent graph with configuration changes, not a rebuild.

### Malaysian market context

Career OS is built for Malaysia's actual talent pool — not the LinkedIn-native, English-fluent developer demographic. Skills map to roles common in the Malaysian market. Salary ranges are calibrated for MYR, with Singapore noted for comparison. The platform's skills framework is aligned with MYSkills (Malaysia's national skills recognition system) and supports HRDC-funded upskilling tracks as a future integration layer. The career path logic accounts for Malaysia's graduate pipeline: diploma holders, TVET graduates, fresh degree holders entering a market in rapid transition. Candidates in B40/M40 income brackets can be pointed toward SOCSO, PERKESO, and JKM reskilling grants via the AI Coach.

### How we operationalise and scale it — with Talentbank

A space like this only works if it runs where the people already are. Career OS is built to run *on top of* Talentbank, not beside it. The schema maps one-to-one onto candidate profiles, employer companies, and job listings; every AI capability lives behind a modular `src/lib/ai/` boundary and is callable as a service. Adoption is therefore a configuration-and-data-migration exercise, not a rebuild — point auth at Talentbank's existing user base, map the profiles, and switch the AI on against the live talent graph. Scalability is engineered in from day one: static system prompts are prompt-cached (~70–80% latency and cost reduction), matching is deterministic and explainable (so it stays cheap and auditable at millions of rows), and the whole experience already speaks 12 APAC languages. Talentbank brings the trust, the reach, and the employer network; Career OS brings the connective intelligence that turns that network into individual journeys.

### Why now

The need is foundational and the timing is exact. Every person carries the same deep desires — to be seen for what they can truly do, to grow, to belong to a community that values their direction, and to trust that the system is not rigged against them. Those desires are going unmet at scale: APAC's graduate pipeline (TVET, diploma, and degree holders), mid-career pivoters, and the quietly disengaged are entering a market that is being reshaped faster than anyone can read it. Two forces make *now* the moment. First, the trust crisis is real — phantom jobs, opaque filters, and a relentless feed of rejection and chaos have made people cynical precisely when they most need to act with confidence. Second, for the first time, the technology to give every individual personalised, grounded, in-language guidance — at the cost of a few cents per interaction — actually exists. The gap between what people need and what is now technically possible has never been smaller. Waiting only deepens the disengagement.

### The north star

The ultimate impact we are reaching for: that every person in Asia has a lifelong career co-pilot and a living space that promotes who they are becoming — connecting their growth, phase by phase, to the right opportunities, mentors, and communities — so that no capable person is ever unknowingly filtered out again. A market where trust is the default, because connection, not noise, decides careers.

### The resolution

So, back to the question underneath all of this: how do we actually solve — or at least meaningfully attend to — the quiet erosion of opportunity and trust, with the tools and knowledge we have today? Not by building another job board, and not by promising certainty no one can deliver. We solve it by building the *space* — one that journals a person's real growth, translates it into language any stakeholder can understand (literally, in 12 languages, and figuratively, as evidence-grounded insight), and places it in front of the people who would value it. The technology is here, the architecture is adoptable, the product is demo-ready today, and the team has shown it can ship the whole arc. Talentbank is building Asia's Career OS; this is built, from the first line, to be exactly that — and to give people back their trust in the market, in each other, and most importantly, in themselves.

---

## Team

**Team name:** LVMY  
**Format:** Solo submission  

| Field | Details |
|---|---|
| Full name | Looi Mun Wai |
| Role | Team Lead / Solo Developer |
| Email | l_munwai@yahoo.com |
| Mobile | +601111026284 |
| Country | Malaysia |
| Affiliation | No university affiliation — currently employed full-time as Senior Assistant, Store Development and Design at UNIQLO Malaysia HQ |
| LinkedIn | linkedin.com/in/mun-wai-looi-086886225 |
| GitHub | github.com/munwai111/Talentbank-tech-hackathon-2026-challenge-Mun_Wai |

---

## AI Usage Disclosure

This project was built with AI assistance. Claude Code (Anthropic) was used throughout development for code generation, debugging, architecture review, and documentation. The product itself uses Claude Haiku 4.5 (Anthropic) as its AI inference engine for all career navigation, coaching, and matching features. All AI usage is intentional, disclosed, and constitutes the core of the product's value proposition.

---

## Build Scope

**Primary audience:** Cross-audience (Candidates + Employers)  
**Scope:** Career OS / Career Marketplace (compulsory) + 6 optional Challenge Modules

---

## Prototype
**Live URL:** https://career-os-dusky.vercel.app
**Demo accounts:** Sign up at `/sign-up` — choose Candidate or Employer (15 seed jobs pre-loaded; employer side has one-click demo setup)
**Access notes:** No credentials required — self-serve sign-up. Candidate flow: sign up → guided wizard → Skills Vault → Path Navigator → Coach → apply. Employer flow: sign up as Employer → demo setup → post a role → review ranked applicants.
**Demo video:** *(optional supporting material — Malaysian candidate persona: Shah Alam, IT diploma, career-pivot scenario)*
