# Submission Campaign Plan — Talentbank Tech Hackathon 2026
**Campaign:** Career OS — Hackathon Submission & Adoption Strategy  
**Date:** June 2, 2026  
**Budget:** RM 0 (solo submission; all channels owned/earned)

---

## 1. Campaign Overview

**Campaign name:** "Career OS — The Co-Pilot Asia's Talent Market Actually Needs"

**One-sentence summary:** A 6-week campaign to win the Talentbank Tech Hackathon 2026 through a polished demo, a compelling intent form submission, and a narrative that speaks directly to Talentbank's institutional objectives.

**Primary objective:** Advance to Top 10 shortlist and win the Champion position (or strategic adoption tier) at the Grand Finale on August 29, 2026.

**Secondary objectives:**
- Get shortlisted by June 15 (Intent Form deadline)
- Demonstrate enough technical depth to unlock the Reference Build (Talentbank's internal prototype, unlocked for shortlisted teams)
- Signal adoption-readiness to trigger a Code Adoption or Strategic Adoption prize
- Build a submission portfolio strong enough to attract interest from Talentbank's talent pipeline (post-hackathon opportunity)

---

## 2. Target Audience

**Primary: Talentbank's judging panel**
- Role: Senior leadership, product, and tech at Talentbank; possibly MDEC/TalentCorp representatives
- Pain: Building Asia's Career OS — have a vision, have data, lack the AI and UX execution speed
- Motivation: Find a submission they can actually adopt; find a developer worth hiring/partnering with
- What they'll look for: Does it work for *our* users? Can we adopt this? Does this person understand our market?
- Where they evaluate: Intent Form → Live demo URL → Demo video → Panel presentation (Top 10)

**Secondary: Peer hackers and online communities (GitHub, LinkedIn)**
- Purpose: Social proof and visibility. A well-documented repo and LinkedIn post creates signal that reinforces the submission quality when Talentbank researches the submitter.

---

## 3. Key Messages

**Core message:**
> "Career OS is what Talentbank's platform looks like when AI is the core, not a feature added on top — built for Malaysia's actual talent pool, demo-ready today."

**Supporting messages:**

| Message | Proof point |
|---|---|
| Built for Talentbank's users, not developer personas | Demo uses Haziq — 25-year-old IT diploma, Shah Alam, career pivot scenario |
| Covers the compulsory module + 4 optional modules | C-01, C-02, C-03, C-05 directly built; E-01 and C-04 in sprint |
| Technically adoptable, not just impressive | Next.js + Supabase architecture maps directly to production deployment on Talentbank's stack; pgvector is the scale path |
| AI is purposeful, not decorative | 6 distinct AI use cases with prompt caching, streaming, navigation framing — documented and reviewable |
| Malaysian market-specific | MYR salaries, KL/Klang Valley context, MYSkills alignment, HRDC framework awareness |

---

## 4. Channel Strategy

### Channel 1 — Intent Form (primary conversion channel)
**Why:** This is the literal submission mechanism. The judge reads this first.  
**Goal:** Be one of the ~30–60 teams that advances to Build Phase from First Cohort.  
**Asset:** `specs/INTENT-FORM-DRAFT.md` — rewritten with correct module framing, Malaysian context, integration story.  
**Deadline:** June 15, 2026, 23:59 MYT  
**Status:** Draft ready. Final review needed before submission.

### Channel 2 — Live Demo URL (proof of build)
**Why:** The form says "prototype URL." A broken or empty URL kills the submission.  
**Goal:** Judges can create a new account, complete the Haziq walkthrough, and see working AI features without a 404.  
**URL:** https://career-os-dusky.vercel.app  
**Prerequisite:** All 3 critical bugs resolved (BUG-01, BUG-02, BUG-03).

### Channel 3 — Demo Video (highest-leverage asset)
**Why:** A 3-minute video bridges the gap between what judges will explore and what the product does at its best.  
**Goal:** Judges who don't explore the demo themselves still see the full Haziq walkthrough.  
**Persona:** Haziq from Shah Alam — IT diploma, career pivot (see USER-RESEARCH-AND-DEMO-PERSONA.md)  
**Deadline:** June 13 (to allow review before June 15 submission)  
**Format:** Screen recording with voice-over, 2.5–3 minutes. No production budget needed — QuickTime or Loom.

### Channel 4 — GitHub README (secondary credibility signal)
**Why:** Talentbank's panel may look at the repo. A clean README signals professional quality.  
**Goal:** README tells the story of what was built, which modules it addresses, and how to run it — in 5 minutes of reading.  
**Current status:** Strong. Needs: module selections updated, Malaysian context paragraph, integration story.

### Channel 5 — LinkedIn post (earned, post-submission)
**Why:** After submitting, a single LinkedIn post documents the build. This creates social proof and gives Talentbank's team something to reference when they research the submitter.  
**Goal:** 200–500 impressions; signals serious submission to Talentbank's network.  
**Timing:** Post after intent form submission (June 15 or shortly before)  
**Format:** "I spent 28 days building..." + screenshot of Career OS + module list + demo link

---

## 5. Content Calendar

| Date | Deliverable | Channel | Priority | Status |
|---|---|---|---|---|
| June 2 (today) | Verify critical bugs on Vercel | Demo URL | 🔴 Critical | TODO |
| June 2 | Save HACKATHON-ANALYSIS.md | Internal | ✅ Done | |
| June 2–4 | Build C-05 Life Chapter Designer | Product | 🔴 Critical | In spec |
| June 5 | Fix work history display + bio save feedback | Product | 🟡 High | In spec |
| June 5–8 | Upgrade E-01 goal-based matching | Product | 🟡 High | In spec |
| June 6–8 | C-04 Fair Pay Engine — standalone signal | Product | 🟡 High | In spec |
| June 8 | Add proactive coach prompt on dashboard | Product | 🟡 High | In spec |
| June 9–10 | Update README with module list + Malaysian context | GitHub | 🟡 High | TODO |
| June 11 | Finalise intent form (from INTENT-FORM-DRAFT.md) | Intent Form | 🔴 Critical | Draft ready |
| June 12–13 | Record demo video — Haziq persona | Demo video | 🔴 Critical | Script ready |
| June 14 | Final walkthrough as judge — break it | QA | 🔴 Critical | TODO |
| June 15 (deadline) | Submit intent form + URLs | techhackathon.com | 🔴 Critical | TODO |
| June 15 | Post on LinkedIn | LinkedIn | 🟢 Nice to have | TODO |
| June 29 – July 26 | Build phase — implement remaining modules | Product | Per rubric | After kickoff |

---

## 6. Content Assets Required

| Asset | Description | Priority | Owner | Deadline |
|---|---|---|---|---|
| Intent Form | Revised submission brief with correct modules, Malaysian context | 🔴 Must-have | `INTENT-FORM-DRAFT.md` | June 15 |
| Demo video (3 min) | Haziq walkthrough — screen recording + voice-over | 🔴 Must-have | Mun Wai | June 13 |
| Updated README | Module list, Malaysian context, integration story | 🔴 Must-have | README.md | June 10 |
| C-05 Life Chapter Designer feature | New step in Career Identity form | 🔴 Must-have | `C-05-life-chapter-designer.md` | June 5 |
| E-01 goal matching upgrade | Goal-alignment scoring in matches | 🟡 Should-have | `E-01-goal-based-matching.md` | June 9 |
| C-04 Fair Pay standalone | Salary range on job cards + prominent in paths | 🟡 Should-have | `C-04-fair-pay-engine.md` | June 9 |
| Bug fixes (BUG-01–05) | 404, wrong badges, duplicates, work history, bio save | 🔴 Must-have | `BUG-FIX-SPEC.md` | June 4 |
| LinkedIn post | "Building Career OS for 28 days" post-submission post | 🟢 Nice-to-have | Mun Wai | June 15 |

---

## 7. Success Metrics

| Metric | Target | How measured |
|---|---|---|
| Intent form submitted | ✅ by June 15 | Confirmation email from Talentbank |
| Critical bugs resolved | 0 on Vercel at submission | Manual new-account test |
| Modules claimed in form | ≥ 4 optional + compulsory | Intent form content review |
| Demo video published | ✅ by June 13 | Loom/YouTube link in intent form |
| Advance to Top 10 | ✅ by August 16 | Panel review notification |
| Win Champion or Adoption tier | Primary goal | Grand Finale, August 29 |

---

## 8. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Critical bugs not fixed before June 15 | Medium | 🔴 Fatal | Fix BUG-01 today. Demo URL is live now — verify manually before any other work. |
| C-05 not shipped before intent form submission | Low | 🟡 Medium | Spec is complete; effort is 4–6 hours. Can claim "in sprint" if not live. |
| Demo video quality is poor | Low | 🟡 Medium | Script is fully written. Loom with good mic is sufficient — don't over-produce. |
| Judges don't read the full intent form | High | 🟡 Medium | First paragraph names the compulsory module + all optional modules tackled. Judges scan-read — structure the brief for scanners. |
| Talentbank has non-technical judges who don't assess code | Medium | 🟡 Medium | Demo video + plain-language intent form ensures the product speaks to non-technical panel members. |

---

## 9. Next Steps (immediate)

1. **Today (June 2):** Test new account creation on https://career-os-dusky.vercel.app — confirm no 404. This is the single highest-risk item.
2. **June 2–3:** Fix BUG-01 (webhook → candidate_profiles row) and BUG-02 (wrong badge).
3. **June 3–5:** Build C-05 Life Chapter Designer per spec.
4. **June 11:** Copy `specs/INTENT-FORM-DRAFT.md` content into the actual Talentbank form at techhackathon.com.
5. **June 12–13:** Record demo video. Use the Haziq script in USER-RESEARCH-AND-DEMO-PERSONA.md. Keep it to 3 minutes.
6. **June 14:** Walk the entire demo as a judge. Attempt to break it. Fix whatever breaks.
7. **June 15 23:59 MYT:** Submit.
