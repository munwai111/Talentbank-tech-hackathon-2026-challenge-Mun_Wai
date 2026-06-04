# LLM Council Transcript — Career OS Project Recap
**Date:** June 1 2026  
**Deadline:** June 15 2026 (14 days)

---

## The Question (Framed)

Career OS is a skills-first hiring platform for APAC, built for the Talentbank Tech Hackathon 2026 (deadline: June 15 — 14 days away). Given 3 CRITICAL bugs (new user 404s, wrong skill badges, duplicate skills), 5 HIGH UX issues, and a PDF import that has failed 4 fix attempts — are we on track or derailed? Should we keep debugging PDF import or pivot to fixing bugs and building judge-facing features? What are the top 3 priorities RIGHT NOW?

---

## Advisor Responses

### The Contrarian
You're not "on track with blockers." You're derailed and rationalizing. PDF import is a sinkhole that's consumed 3 failed attempts with a 14-day hard deadline. Attempt #4 has no guaranteed success criteria. The CRITICAL bugs are worse than you're treating them. New users hitting 404s means judges will hit those 404s during the demo. Hackathon judges don't give second chances. The "AI-imported skills" showing wrong badges is a credibility catastrophe for a skills-first platform. Three priorities: 1) Kill the 404s today. 2) Fix the AI skills badge. 3) Drop PDF import until bugs 1-2 are resolved. Timebox attempt #4 to 4 hours. The uncomfortable question: what does the demo path look like right now, step by step? If a judge breaks it in under a minute, your feature list is irrelevant.

### The First Principles Thinker
You're asking a sequencing question when you have a triage question. What does a hackathon judge actually evaluate? They click through your demo. If new users hit 404s, the judge hits a 404 — that's a zero-score event. The PDF import is a nice-to-have. A broken core loop is a disqualifier. Priority stack: 1) Fix the 404s immediately — one fix, three bugs resolved, do this today. 2) Drop PDF import entirely — 4 attempts, marginal demo value near zero. 3) Fix work history display. What wins hackathons: a polished, complete core loop beats a feature-rich demo that crashes.

### The Expansionist
You're not derailed — you're one pivot away from winning. Stop debugging PDF import. Fix the 3 CRITICAL bugs in 48 hours. Then: 1) Fix the 404s — 2-hour fix, tonight. 2) Fix work history display — most damaging demo failure. 3) Build one judge-facing "wow" feature: skills match score between candidate and job as % with breakdown. PDF import? Ship a graceful fallback — paste-your-resume text input. Frame it as "multi-modal import."

### The Outsider
You have 3 bugs that break the app for every new user. Fix those first. Full stop. A judge will create a new account, hit a 404, and stop evaluating. PDF import has had 3 failed fixes — that pattern tells you this problem is harder than you think. Top 3: 1) Fix the 404s — one null-check away, do it today. 2) Make work history display — you already saved the data, rendering is a frontend task. 3) Add bio save feedback — one hour of work. Hard deadline: if attempt 4 on PDF import is not working by day 3, cut it from the demo entirely.

### The Executor ★ (Voted Strongest — 5/5)
Stop debugging PDF import. Ship attempt #4 only if it takes under 2 hours. Top 3: 1) Fix the 3 CRITICAL bugs today — 404s will kill the demo, add profile row creation via Clerk webhook or middleware check. Fix wrong-badge and duplicate-skill in same pass — probably same code path. 2) Fix work history display and bio save feedback by Wednesday — frontend display issues, fast. 3) Build one judge-facing demo feature by Day 10 — visual skills match score, 2 days with Claude Haiku already integrated. PDF drag-and-drop and default tab: Day 12-13, only if everything else is done.

---

## Peer Reviews

**Anonymization map:** A = Contrarian, B = First Principles, C = Expansionist, D = Outsider, E = Executor

### Reviewer 1
1. **Strongest: E** — only one with actionable technical specificity (Clerk webhook/middleware), realistic time-boxing, and insight that badge/duplicate bugs share a code path with the 404s.
2. **Biggest blind spot: C** — recommends building new features while CRITICAL bugs remain open.
3. **All five missed:** The judging rubric. The entire priority stack depends on what Talentbank actually scores.

### Reviewer 2
1. **Strongest: E** — most operationally specific, names the actual fix, assigns milestones, identifies shared code path.
2. **Biggest blind spot: C** — "one pivot away from winning" is motivational noise obscuring triage discipline.
3. **All five missed:** Judging rubric — innovation weight vs. technical execution weight vs. presentation weight changes everything.

### Reviewer 3
1. **Strongest: E** — concrete implementation guidance, realistic timelines, conditional budget for PDF (under 2 hours vs. blanket kill).
2. **Biggest blind spot: B** — says "drop PDF entirely" ignoring it may be a judged feature criterion.
3. **All five missed:** Is PDF import on the scoring rubric? Is skills-matching a required feature? Cutting features without checking the rubric is as dangerous as chasing unresolvable bugs.

### Reviewer 4
1. **Strongest: E** — actionable implementation detail, bundles badge/duplicate fix with CRITICAL pass, sequences work with specific day targets.
2. **Biggest blind spot: C** — building skills-match score with 3 critical bugs open is premature.
3. **All five missed:** Judging rubric alignment.

### Reviewer 5
1. **Strongest: E** — most operationally specific, concrete timeboxes, identifies shared code path.
2. **Biggest blind spot: B** — dismisses PDF without acknowledging it may be a judging criterion.
3. **All five missed:** No one recommended auditing the actual Talentbank rubric.

---

## Chairman's Verdict

### Where the Council Agrees
Fix the 404s today. Every advisor, every reviewer — unanimous. New users hitting 404s is a demo-ending event. Everything else is secondary to this. Also unanimous: PDF import is a sinkhole. Four failed attempts signals a hard problem. Stop pouring time into it without a hard timebox.

### Where the Council Clashes
The Expansionist wants you building a skills-match "wow" feature while CRITICAL bugs are still open — every peer reviewer flagged this as the biggest blind spot. The First Principles Thinker says kill PDF entirely; the Executor says timebox it to 2 hours. The Executor is right — "kill it" ignores the possibility it's on the judging rubric.

### Blind Spots the Council Caught
All five advisors failed to ask the single most important question: **what does Talentbank actually score?** If PDF import is a required feature criterion, cutting it is self-sabotage. If skills-matching has no rubric weight, building it is vanity. Pull up the judging rubric and map every remaining hour against scored criteria before touching another line of code.

### The Recommendation — 14-Day Sprint Plan
- **Today:** Fix all 3 CRITICAL bugs in one session. Fix 404s via Clerk webhook/middleware profile-row creation. Fix wrong badge + duplicate skill in same pass — they share a code path.
- **Day 2–3:** Fix work history display + bio save feedback. Data is already in DB — frontend rendering task.
- **Day 3 gate:** Check the judging rubric. Timebox PDF attempt #4 to 2 hours max. If it fails, ship text-paste fallback. If PDF is not scored, cut it from demo.
- **Day 4–10:** Build one judge-facing feature: skills-match score. Makes platform thesis tangible.
- **Day 11–13:** Walk the demo as a judge. Break it deliberately. Fix what breaks. Polish last.

### The One Thing to Do First
Pull up the Talentbank judging rubric right now. Then fix the 404s. In that order.
