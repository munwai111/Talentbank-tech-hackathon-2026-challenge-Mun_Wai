# Hackathon Analysis — Talentbank Tech Hackathon 2026
**Generated:** June 2, 2026  
**Deadline:** June 15, 2026 (Intent Form) · Build Phase: June 29 – July 26, 2026  
**Source:** Multi-session LLM Council + full challenge page audit

---

## 1. Challenge Structure (What We Actually Need to Build)

### Layer 1 — Compulsory · All Teams
> **Career OS / Career Marketplace**  
> *"Build the platform that connects employers and candidates across Asia. Cover both sides — how employers find and engage talent, how candidates discover and grow in careers. Architecture, UX, stack, your call."*

This is non-negotiable. Every submission must cover **both candidates AND employers** as the baseline. ✅ Career OS already satisfies this.

### Layer 2 — 18 Optional Modules (pick, combine, or invent)
A reference for where to go deep. "Pick one audience, combine, or invent your own." No requirement to build all 5–6 in a category.

---

## 2. Full Module Map — Career OS Alignment

### CANDIDATES (6 modules)

| # | Module | Talentbank's intent | Career OS | Status |
|---|---|---|---|---|
| C-01 | Career Path Navigator | Realistic next career moves, built on actual data | 3-path navigator (strong/emerging/stretch), MYR salaries, APAC timelines | ✅ Directly built |
| C-02 | Living Portfolio | Auto-updating honest record of what you've done | Portfolio page + GitHub import + AI summaries + Skills Vault | ✅ Built (framing gap — see §4) |
| C-03 | AI Career Coach | Long-run senior mentor, proactive — quiet until something matters | Streaming chat with full candidate context (skills, goals, work history) | ✅ Directly built (reactive only — see §4) |
| C-04 | Fair Pay Engine | Tells you if your salary matches market; helps you raise it at the right moment | Salary bands in Path Navigator; Coach knows MYR rates — no dedicated module | ⚠️ Partial |
| C-05 | Life Chapter Designer | Career planning that makes room for family, health, study, and breaks | Nothing. Career Identity form captures goals but not life chapters | ❌ Not built |
| C-06 | Your Own Track | Propose a candidate problem Talentbank hasn't named | — | — |

### EMPLOYERS (6 modules)

| # | Module | Talentbank's intent | Career OS | Status |
|---|---|---|---|---|
| E-01 | Smart Talent Matching | Match by where someone is *heading*, not just past job titles | Skill-overlap scoring ranks candidates per role — skills-based, not goal-based | ⚠️ Partial |
| E-02 | Talent Retention Signals | Early warning when employee is checking out, before resignation | Nothing. All features are pre-hire | ❌ Not built |
| E-03 | Talent Re-Engagement | Warm pipeline of candidates who said no — revive when right role opens | Nothing. No talent nurturing CRM | ❌ Not built |
| E-04 | Onboarding Success Predictor | Flag new hires struggling in first 60 days | Nothing. No post-hire features | ❌ Not built |
| E-05 | Workforce Resilience Planner | Workforce planning for shrinking working-age population | Nothing. No strategic HR features | ❌ Not built |
| E-06 | Your Own Track | Propose an employer problem Talentbank hasn't named | — | — |

### UNIVERSITIES (6 modules)

| # | Module | Talentbank's intent | Career OS | Status |
|---|---|---|---|---|
| U-01 | Lifelong Outcome Loop | Track graduate outcomes for decades, feed back into curriculum | Nothing | ❌ Not built |
| U-02 | Future-State Curriculum Engine | Help faculty design courses for where market is heading | Nothing | ❌ Not built |
| U-03 | Adaptive Readiness Profile | Show what a student is capable of right now, beyond the degree | Skills Vault shows current capabilities — wrong framing/audience | ⚠️ Partial |
| U-04 | Live Internship Marketplace | Match students to internships by growth trajectory | Job matching exists but not student/internship specific | ⚠️ Partial |
| U-05 | Lifelong Learning Wallet | University stays involved across graduate's whole career; credential re-verifies | Nothing | ❌ Not built |
| U-06 | Your Own Track | Propose a university problem Talentbank hasn't named | — | — |

### Score Summary

| Audience | Compulsory | Direct ✅ | Partial ⚠️ | Missing ❌ |
|---|---|---|---|---|
| Candidates | ✅ | 3 (C-01, C-02, C-03) | 1 (C-04) | 1 (C-05) |
| Employers | ✅ | 0 | 1 (E-01) | 4 |
| Universities | — | 0 | 2 (U-03, U-04) | 3 |

---

## 3. Critical Bugs (from June 1 Council)

These must be fixed before any feature work. If a judge signs up and hits a 404, the demo is over.

| Bug | Severity | Fix approach |
|---|---|---|
| New user 404 on profile/dashboard | 🔴 CRITICAL | Clerk webhook → create profile row on `user.created`; or middleware null-check |
| Wrong badge on AI-imported skills | 🔴 CRITICAL | Likely same code path as duplicate bug — audit `source` field assignment on import |
| Duplicate skills on import | 🔴 CRITICAL | Deduplicate by skill name before insert; upsert pattern |
| Work history not displaying | 🟡 HIGH | Data is in DB — frontend render task |
| Bio save has no feedback | 🟡 HIGH | Optimistic UI or toast on save |

**Status as of June 2:** Unknown — council was June 1. Verify these are fixed before any other work.

---

## 4. Framing & Positioning Gaps

### 4a. C-05 Life Chapter Designer — easiest missing module to close
Add one section to Career Identity form: *"Are there life events that should shape your career plan? (family, health, study break, relocation, caregiving)"* — this counts as meaningful C-05 coverage. 2–4 hour task.

### 4b. C-03 AI Coach — reactive only, not proactive
Talentbank's vision: "quiet most of the time; speaks up when something matters." Career OS's coach waits for the user to ask. A minimal proactive signal: show a prompt suggestion on the dashboard ("Your skills are 2 away from a Senior role — ask your coach") counts as coverage without rebuilding the coach.

### 4c. E-01 Smart Talent Matching — skills-based not goal-based
Talentbank wants matching by *where someone is heading*, not just current skills. Enhancement: weight matching score by candidate's career goals alignment with job's growth opportunities. Medium effort.

### 4d. Missing Malaysian institutional context
The submission has zero mention of:
- **MYSkills** (Malaysia's national skills framework)
- **MQF** (Malaysian Qualifications Framework)  
- **HRDC** (Human Resources Development Corporation — skills funding)
- **TalentCorp / MDEC** (government workforce initiatives)

Even 1–2 paragraphs in the README and intent form acknowledging these as the credential backbone Career OS could plug into signals institutional literacy to the panel.

### 4e. No integration story
Career OS is built greenfield. Talentbank has an existing candidate database and employer network. The submission should include 2–3 sentences on how Career OS could be deployed on Talentbank's existing data — not a code change, a framing change.

### 4f. Intent Form incomplete
`HACKATHON-INTENT-FORM.md` still has `_(add any additional relevant tracks)_` as placeholder. Module selections must be filled in explicitly.

---

## 5. Demo Path (13 days to submission deadline)

The ideal demo is a 3-minute walkthrough a **non-technical judge** can follow:

1. Sign up as candidate → no 404 (bug fix required)
2. Import CV or paste LinkedIn → structured profile extracted
3. View Skills Vault → skills populated from import
4. Complete Career Identity (4-step including Life Chapter field)
5. Generate Career Paths → 3 paths with MYR salaries and timelines
6. Browse Job Matches → see matched and gap skills per role
7. Ask AI Coach a question → streaming response, personalised to profile
8. (Employer side) Sign up as employer → post a job → see ranked candidates

**Persona to demo:** 25-year-old IT diploma graduate from Shah Alam trying to choose between data engineering and cybersecurity. This is Talentbank's median user. Not a developer persona.

---

## 6. Submission Framing (Intent Form rewrite)

### Lead sentence (replace current opening):
> "Career OS is a dual-sided Career OS / Career Marketplace submission — covering the compulsory requirement (candidates + employers) and going deep on three candidate optional modules: C-01 Career Path Navigator, C-02 Living Portfolio, and C-03 AI Career Coach."

### Add to module selections:
- Compulsory: Career OS / Career Marketplace ✅
- C-01 Career Path Navigator ✅
- C-02 Living Portfolio ✅  
- C-03 AI Career Coach ✅
- C-04 Fair Pay Engine ⚠️ (partial — salary data embedded in career paths)
- C-05 Life Chapter Designer (in progress — adding to Sprint)
- E-01 Smart Talent Matching ⚠️ (partial — skills-overlap matching, goal-weighting planned)

---

## 7. Prioritised Execution Plan (13 days)

### Today (June 2)
- [ ] Verify all 3 critical bugs are fixed (test new signup on Vercel)
- [ ] Read full Talentbank judging rubric
- [ ] Update intent form with correct module selections

### Days 1–3 (June 3–5)
- [ ] Fix C-05 Life Chapter Designer — add life events field to Career Identity
- [ ] Fix bio save feedback (toast/optimistic UI)
- [ ] Fix work history display

### Days 4–7 (June 6–9)
- [ ] Improve E-01 matching — add goal-alignment weighting to match score
- [ ] Add Fair Pay Engine signal to job matches (show "your salary expectation vs. market range")
- [ ] Add proactive coach prompt on dashboard (C-03 depth)

### Days 8–10 (June 10–12)
- [ ] Rewrite intent form with correct framing and module selections
- [ ] Add Malaysian institutional context to README (MYSkills, HRDC, MQF)
- [ ] Add integration story paragraph

### Days 11–13 (June 13–15)
- [ ] Walk demo as a judge. Break it deliberately. Fix what breaks.
- [ ] Record demo video with Malaysian candidate persona
- [ ] Final submission review

---

## 8. Talentbank's True Objective (Council Insight)

Talentbank is building Asia's Career OS internally. This hackathon is accelerated R&D + talent pipeline. They want:
1. A working demo they can adopt (Code Adoption or Strategic Adoption tier prizes exist)
2. Developers they can potentially hire/partner with
3. Validation of their strategic direction

**What they cannot build internally at speed:** modern consumer UX, sophisticated AI features, streaming architecture, clean TypeScript. Career OS has all of these.

**What they have that Career OS lacks:** existing candidate/employer data, Malaysian institutional relationships, domain knowledge of their median user (TVET graduates, B40/M40 workforce).

**The pitch:** "Career OS is what Talentbank's platform looks like when AI is the core, not a feature added on top."

---

*This document supersedes the June 1 council transcript for planning purposes.*
*Reference: `.council/council-transcript-2026-06-01.md`, `.council/council-report-2026-06-01.html`*
