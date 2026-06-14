# Build Journal — Career OS

> What was built, when, and **why** — reconstructed from the project's git history.
> Solo build for the Talentbank Tech Hackathon 2026. **May 28 → June 14, 2026 (~18 days).**

This is the honest story of the build: the order decisions were made, the problems that forced changes, and the reasoning behind each phase. It exists so a reviewer (or a future maintainer) can understand not just *what* the code does, but *why it is shaped the way it is*.

---

## Phase 0 — Foundation (May 28–31)

**Built:** Next.js 16 App Router scaffold, Clerk auth, Supabase schema, and the first end-to-end candidate + employer flows. Landing page showcasing all six modules.

**Why:** The hackathon rewards a coherent dual-sided platform over a pile of features. The first goal was a *spine* — a candidate can sign up, build a profile, and see jobs; an employer can post a job and see candidates — before any AI was layered on.

**Hard calls already showing up:**
- Killed `SELECT *` everywhere and simplified `vercel.json` (a stray `outputDirectory` broke Next.js serving). Establishing query discipline early kept the schema honest as it grew.

---

## Phase 1 — Make the AI real, make it deploy (June 1)

**Built:** Path Navigator, AI resume/PDF/URL import, rich profile schema (work history + education), and a long fight to get streaming AI working on Vercel.

**Why it was hard — and what we learned:**
- **Edge vs. Node.js:** `unpdf` isn't Edge-compatible, so the import route had to be split — PDF parsing on Node.js, URL/text on Edge. Eventually *all* AI routes moved to Node.js streaming to stop Vercel deploy failures.
- **The 25-second wall:** Vercel Hobby caps streaming at 25s. This single constraint shaped every AI feature afterward — `max_tokens` ceilings, truncation-resilient JSON parsing (`repair-json.ts`), and a preference for streaming over big blocking calls.
- **Security:** added an SSRF guard on the URL-import endpoint (OWASP A10) and hardened internal API auth. Skills-first hiring handles real personal data; security couldn't be an afterthought.
- **Native document blocks:** switched resume import to Claude's native document blocks for multi-format support, then *reverted the PDF path to text extraction* when document blocks blew the 25s budget. A reminder that the platform constraint wins.

---

## Phase 2 — Matching that means something (June 2–5)

**Built:** Skill normalisation + business-oriented demo jobs; **C-05 Life Chapter Designer**; **E-01 goal-based matching**; **C-04 fair-pay engine**; a proactive coach nudge; a guided 5-phase registration wizard; PDPA-aligned account deletion (6-month soft delete + feedback capture).

**Why:**
- **Goal-aligned matching (E-01):** keyword matching surfaces the wrong people. Weighting skill overlap (70%) with career-goal alignment (30%) surfaces candidates *heading toward* a role, not just those who used the right words. This is the product's core differentiation, so it got a dedicated, deterministic `matching.ts`.
- **Life Chapter Designer (C-05):** career advice that ignores caregiving, breaks, health, or location constraints is advice for a person who doesn't exist. Capturing life context makes the Path Navigator and Coach honest.
- **Fair pay (C-04):** most Malaysian candidates have no salary data. Embedding MYR bands in every path and giving the Coach a real salary reference table turns "am I underpaid?" into a specific answer.
- **Registration wizard:** an account isn't a profile. A guided 5-phase flow means a new user lands with something matchable, not an empty shell.

---

## Phase 3 — Make it feel like a product (June 6–8)

**Built:** Full dark "Aurora-Navy" visual redesign across the entire app; GSAP animation system; font upgrade; dark/light mode with system detection; every emoji icon replaced with Lucide SVGs; structured AI work-experience cards auto-generated on CV upload; an overhaul of the coach to structured markdown.

**Why:** Product & UX is the single heaviest judging dimension (30%). A correct app that looks like a prototype loses to a slightly smaller app that feels finished. The "de-slop" pass (emoji → Lucide, consistent tokens, real motion) was a deliberate move from "demo" to "product."

---

## Phase 4 — The Skills Vault becomes the centrepiece (June 9–10)

**Built:** Skills Vault visual redesign (bubble bank, pie chart, stats, AI top-5), coach calibration panel, glassmorphic bubbles with a clip-path explosion transition, canvas particle bursts, a top hotbar nav, and the complete job-application loop (apply, track, employer review, close/reopen).

**Why:** A "Living Portfolio" (C-02) has to feel *alive*, not like a form. The Vault became the signature interaction — skills you can explore and drill into. In parallel, the application loop closed the marketplace circle: candidate applies → employer reviews → status moves. Without that loop, it's two dashboards; with it, it's a marketplace.

---

## Phase 5 — Cartography & navigation identity (June 11–12)

**Built:** A motion-system revamp (strong easing, press feedback, `prefers-reduced-motion`), a full "cartography" redesign with distinct journey identities (candidate navigator vs. employer scout), a top hotbar + profile rail, and migration of news/events/settings preferences from `localStorage` to Supabase.

**Why:** Two audiences shouldn't feel like the same gray app. Giving candidates and employers their own visual "journey" (indigo navigator vs. teal scout) made the product legible at a glance. Moving preferences to Supabase made them real (cross-device), not browser-local theatre.

---

## Phase 6 — Whole-person profiles (June 13)

**Built:** Floating AI orb (coach chat + human messaging); Hinge-style view/edit profile with linked accounts; the **AI Persona engine** (whole-person, evidence-grounded); a Viboscope-style workplace behavioural read for hiring teams; MBTI/Big Five/spectrum scoring calibration; social links (FB/IG/TikTok); inline URL validation; and the **gamified Skills Vault with AI per-skill insights**.

**Why:** The pitch is "understand the candidate beyond a plain resume." The Persona engine is how — an evidence-grounded read of how someone actually works, written for a hiring manager, with explicit guardrails against inferring protected characteristics. Calibrating the scoring (so it's neither everyone-is-extreme nor everyone-is-average) was the difference between a toy and a credible signal.

---

## Phase 7 — Premium polish, AI badge art, and APAC languages (June 14)

**Built:**
- A premium design overhaul: mouse-tracking **aura background**, a **scroll-journey profile** (editorial, chaptered), and a deep employer scroll-view of candidate profiles.
- Experimented with Higgsfield AI-generated tier-badge art, then **reverted to clean CSS emblems** when the generated art read as "gamey" rather than professional.
- A real **i18n layer** — 12 APAC locales, a `LanguageProvider`, instant UI switching, and AI content generated in the selected language — plus employer demo-setup seeding.

**Why:**
- The scroll-journey profile makes viewing a profile feel like being *walked through a person*, for both the candidate and an employer — directly serving the "beyond a plain resume" thesis.
- The AI-badge-art reversion is a quality decision worth recording: *generated ≠ better.* Clean, restrained CSS beat flashy AI art for a professional product. Knowing when to cut an AI feature is itself craft.
- Language support reflects who the product is for. APAC isn't English-first; assuming it is would quietly exclude the exact talent Talentbank serves.

---

## Phase 8 — Coach Persistence & Evolving Memory (June 14)

**Built:** ChatGPT-style session sidebar for the AI Coach; full conversation persistence to Supabase (`coach_sessions` + `coach_messages` tables); an evolving memory layer (`coach_memory` JSONB in `career_data`) that accumulates across sessions; a `coach-memory.ts` Haiku summariser that compresses recent conversation turns off the streaming hot path; and four new CRUD API routes for session management.

**Why:** A coach that forgets every conversation isn't a coach — it's a fresh chatbot every time. The most valuable thing a real mentor has is *context accumulated over time*: understanding where you started, what you tried, what you're afraid of, and where you're heading. The session sidebar solves the immediate UX gap ("where did that conversation go?"); the evolving memory solves the deeper one — every future coaching session, path generation, and job match benefits from what the coach already knows about this person.

**Hard calls:**
- **Off-path memory update.** Refreshing memory during the streaming response would add latency the user feels. Solution: fire-and-forget fetch *after* the reply is already streaming to the client — no wait, no backpressure, zero UX impact.
- **Progressive enhancement.** The migration (new tables) may not have run on a fresh deploy. All session routes return `{ unavailable: true }` when the tables are absent; the coach UI detects this and stays in localStorage mode silently. No broken state, no error UI.
- **Ownership scoping.** Every session route verifies `user_id` matches the authenticated caller. Cross-user data access is impossible, not just unlikely.
- **Memory cap.** The summariser caps its output at 2000 characters and reads only the 12 most recent messages — enough to be meaningful, not enough to run away with context or cost.

---

## Cross-cutting principles (held throughout)

1. **The platform constraint wins.** The 25s Vercel limit shaped the entire AI architecture. Design to the real runtime, not the ideal one.
2. **Deterministic where it must be trusted; AI where it adds judgement.** Matching is deterministic and explainable. AI is reserved for synthesis, narrative, and advice — and always evidence-grounded.
3. **Navigation, not prediction.** Every AI output uses range/likelihood framing. No false certainty about someone's future.
4. **De-slop relentlessly.** No emoji UI, consistent tokens, real motion, restraint over flash. A product, not a prototype.
5. **Know when to cut.** The Higgsfield badge reversion and the PDF-path revert are features removed *on purpose* because the simpler path was better.

---

*Reconstructed from 80+ commits, May 28 – June 14, 2026. See [ROADMAP.md](ROADMAP.md) for what comes next.*
