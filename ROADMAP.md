# Roadmap — Career OS

> Where the product stands today, what we'd build next, and the vision if Career OS is adopted on top of Talentbank.

---

## Where we are today (v1 — hackathon build)

A demo-ready, dual-sided career marketplace, deployed on Vercel:

- **Candidates** build a living profile (skills, work history, portfolio, AI persona), navigate three realistic career paths, chat with an AI coach that knows their profile, and apply to skills-first roles. The coach now persists: a **ChatGPT-style session sidebar** saves every conversation to Supabase, and an **evolving memory** compresses each session into a running summary that deepens the coach's understanding of the person over time.
- **Employers** post skills-first roles, see talent ranked by skill + goal fit, and move applicants through a real review pipeline.
- **Foundations** in place for what comes next: a 12-locale i18n layer, an evidence-grounded AI persona engine, a deterministic+explainable matching core, coach memory infrastructure, and a conversation-minutes AI.

This solves the core problem: **hiring on demonstrated capability and trajectory, not credentials and keywords.**

---

## The honest gap list (what v1 does *not* yet do)

Recording these openly — knowing the gap is part of the craft.

| Area | Current state | Why it's not done |
|---|---|---|
| Multi-language coverage | Layer + 12 locales built; nav/settings/dashboard/coach/paths/jobs/apps/news/events all wired; AI content generated in selected language | Minor gaps remain: some static strings on employer pages still in English |
| Employer deep-view of applicants | Ranked panel + advance/reject pipeline live | The full scroll-journey applicant view + AI Hiring Council is **designed, not yet built** (see below) |
| AI Career Pathway Generator (deep) | Path Navigator gives 3 directions today | The fully detailed, resourced, blocker-aware version is next (see below) |
| Achievement & event posts with photos | Events/News pages exist (follow/save/tickets) | Media-rich posting is roadmap |
| Verified credentials | Skills are self-/GitHub-/CV-sourced | MYSkills / MQF verification is an integration, not a hackathon-week build |

---

## Next up (the immediate roadmap)

### 1. Employer applicant deep-view + AI Hiring Council
Bring the candidate's own scroll-journey profile into the employer's account: when an applicant applies to a role, the employer sees the **same immersive, chaptered profile** the candidate sees — not a thin card. A floating decision card at the bottom carries **Progress** and **Reject**, and an **AI Hiring Council** briefing sits above the buttons.

The "Council" is a multi-perspective Claude briefing — distinct lenses (e.g. *skills-fit*, *trajectory*, *risk/gaps*, *team-add*) synthesised into one clear recommendation, with the reasoning shown so the employer decides with clarity rather than being told what to do. Hard guardrail: **no inference of protected characteristics** (age, gender, ethnicity, religion, family status, disability). *(The `minutes.ts` + persona engine groundwork already exists; this is the next feature to ship.)*

### 2. Deep AI Career Pathway Generator
Expand the Path Navigator from "three directions" into a full, navigable journey:
- **Current state → realistic milestones → stretch goal**, on an honest timeline.
- For each milestone: the **resources** that accelerate it (HRDC-funded training, free courses, communities), the **blockers/limitations** likely to appear and when, and the **skills to build**.
- Grounded in the candidate's **personal & professional values, priorities, and life context** (from the Life Chapter Designer), not just their skills.
- Always navigation framing: ranges and likelihoods, never promises.

### 3. AI Job-Match consultation
When a candidate views a role, a detailed, conversational match read: **why** the match rate is what it is, which gaps matter and which don't, and the concrete steps to close the distance — turning a percentage into a plan.

### 4. Rich profile posts (achievements & events, with photos)
Let candidates post achievements, events attended/hosted, and community activity — with images — so an employer understands the person, not just the resume. Builds on the existing News/Events surfaces.

### 5. Full multi-language rollout
Complete string extraction so every page, predetermined description, and AI output renders in any of the 12 APAC locales; add locale-aware formatting (dates, currency) end-to-end.

---

## The vision if adopted on top of Talentbank

Career OS is built to **run on top of Talentbank, not replace it.**

- **Auth & identity:** point the auth layer at Talentbank's existing user database; map candidate/employer schemas.
- **Data:** the schema mirrors candidate profiles, companies, and job listings — adoption is data migration + configuration, not a rebuild.
- **AI layer:** every Claude integration is modular and API-callable (`src/lib/ai/`), so the navigator, coach, persona engine, and matching can activate against Talentbank's existing talent graph.
- **Credential backbone:** swap self-reported skills/education for **MYSkills** (skills recognition) and **MQF** (qualifications) verification — turning the Living Portfolio into a trusted, verified record.
- **Funding rails:** wire **HRDC**-funded upskilling and **B40/M40** grant pathways (SOCSO, PERKESO, JKM) directly into the coach and pathway generator.

The end state: every member of Talentbank's talent graph has a live career co-pilot, and every employer sees people by what they can do and where they're heading — across all of APAC, in their own language.

---

## Guiding principles for everything on this roadmap

1. **Navigation, not prediction** — ranges and likelihoods, never false certainty.
2. **Evidence-grounded AI** — cite what the user provided; never fabricate; never infer protected characteristics.
3. **Deterministic where trust matters; AI for judgement** — explainable matching; AI for synthesis and advice.
4. **Built for Malaysia first, APAC by design** — language, salary, credentials, and funding reflect the real market.
5. **Restraint over flash** — ship the simpler thing when it's better (see the Higgsfield badge reversion in [BUILD-JOURNAL.md](BUILD-JOURNAL.md)).

---

*See [README.md](README.md) for the full feature map and [BUILD-JOURNAL.md](BUILD-JOURNAL.md) for how we got here.*
