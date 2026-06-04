# User Research & Demo Persona — Career OS
**Purpose:** (1) Define the primary demo persona for the submission video. (2) Document the research framing that validates Career OS against Talentbank's actual user base. (3) Provide a usability test script for the judge walkthrough.

---

## Why This Matters

The previous council identified the single biggest risk: Career OS was built with a developer/LinkedIn-fluent user in mind. Talentbank's actual median user is a Malaysian graduate or mid-career professional who may not be English-dominant, has a diploma or TVET qualification (not a degree), and is making a career decision with very little data or mentorship support.

The demo video must show Career OS working for *that* person — not for a developer persona. This document defines that person and scripts the demo accordingly.

---

## Primary Persona — "Haziq"

> The 25-year-old IT diploma holder from Shah Alam trying to choose between two career paths.

| Attribute | Detail |
|---|---|
| Name | Haziq bin Rashidi (fictional) |
| Age | 25 |
| Location | Shah Alam, Selangor |
| Education | Diploma in Information Technology, UiTM Shah Alam, 2023 |
| Current role | Junior IT Support at an SME in PJ (RM 2,800/month) |
| Work history | 1.5 years IT support; 6-month internship at the same company |
| Skills | Windows/Linux administration, basic Python scripting, SQL queries, network troubleshooting |
| Career dilemma | Wants to move into either Data Engineering or Cybersecurity — doesn't know which path is more realistic given his background, or which pays better in KL |
| Life context | Lives with parents; no plans to relocate; would prefer to stay Klang Valley |
| Pain points | Has no senior mentor to ask. Googled "data engineer salary Malaysia" and got contradictory answers. Applied to 8 jobs, got 1 callback. Doesn't know if his skills are competitive. |
| What Career OS gives him | A realistic map of both paths from where he is now, with salary ranges, skill gaps, and a coach he can actually ask |

---

## Secondary Persona — "Puan Siti"

> The 38-year-old returning professional after a career break.

| Attribute | Detail |
|---|---|
| Name | Siti Norzahira binti Ahmad (fictional) |
| Age | 38 |
| Location | Petaling Jaya |
| Education | Degree in Business Administration, UM, 2010 |
| Current status | Returning after a 4-year career break (caregiving for elderly parent) |
| Last role | Senior Executive, Procurement, at a GLC |
| Life context | Career break context entered in C-05 Life Chapter Designer |
| What Career OS gives her | Paths that account for the gap; coach advice framed for re-entry, not entry-level; salary ranges for someone re-entering at her experience level |

---

## Demo Script — Haziq Walkthrough (3 minutes for video)

### Segment 1: Sign up and import (0:00–0:45)

> "Meet Haziq. IT support, Shah Alam, 25. Wants to pivot but doesn't know which direction."

1. Visit career-os-dusky.vercel.app → Sign Up → Choose **Candidate**
2. Navigate to **Profile** → Import CV (paste Haziq's CV text — pre-prepared in demo notes)
3. Review extracted profile — work history appears, skills populated

**Voice-over:** "Career OS reads your CV and pulls out what actually matters — your skills, your history, where you've been."

---

### Segment 2: Career Identity — including Life Chapter (0:45–1:20)

1. Navigate to **Discover** (Career Identity)
2. Complete 5 steps quickly:
   - Step 1: "Currently employed, 1.5 years experience, IT Support"
   - Step 2: "Data Engineering or Cybersecurity — can't decide"
   - Step 3: "Stable salary, learning opportunities"
   - Step 4: "Senior Data Engineer in 3 years"
   - Step 5: "I need to stay in a specific location" (Life Chapter — Shah Alam / KV)
3. Generate identity narrative

**Voice-over:** "Not just your goals — your actual life. Career OS accounts for where you need to stay, not just where you want to go."

---

### Segment 3: Career Path Navigator (1:20–2:00)

1. Navigate to **Paths** → Generate paths
2. Show the 3 paths:
   - Strong match: Junior Data Analyst (RM 4,500–7,000, 1–3 months)
   - Emerging: Data Engineer (RM 7,000–11,000, 9–15 months, skills to develop: dbt, Spark)
   - Stretch: Senior Security Engineer (18–30 months)
3. Scroll to show salary ranges and skills to develop

**Voice-over:** "Three directions. Real salary ranges in MYR. Specific skills to close. Not 'improve your soft skills' — actual things you can learn."

---

### Segment 4: Job Matches (2:00–2:30)

1. Navigate to **Jobs**
2. Show ranked matches — top role is a Data Analyst role at 80%
3. Show matched skills (green) and missing skills (red) on the card
4. Show "Goal match" chip — his stated goal aligns with this direction
5. Show salary range on card

**Voice-over:** "Every open role ranked by how well it fits him — not just keywords. Green means he has it. Red means the gap. No guessing."

---

### Segment 5: AI Coach (2:30–3:00)

1. Navigate to **Coach**
2. Ask: "Am I underpaid for my role in Shah Alam?"
3. Show streaming response — specific MYR figures, honest assessment, recommendation

**Voice-over:** "The coach knows his profile. Specific advice. Real numbers. Like a senior who actually knows the Malaysian market."

---

## Employer Side Demo (optional 60-second extension)

1. Sign up as Employer → Post a Data Analyst role with required skills
2. Navigate to **Candidates** → Show Haziq ranked by skill match + goal alignment
3. Gap analysis visible at a glance

---

## Usability Test Script (for manual testing before recording)

Run this before recording the demo video. Have a friend or colleague attempt each step cold.

### Tasks
1. "Create an account and import this CV text. Tell me when you're on the dashboard."
2. "Complete the Career Identity. Tell me when you've generated your identity."
3. "Find out what career paths are available to you."
4. "Look at your job matches. Which role are you most qualified for, and what skills are you missing?"
5. "Ask the coach whether your current salary is market rate."

### Pass criteria
- Each task completed without prompting
- No 404 errors
- Match score makes intuitive sense ("I can see why that role ranked first")
- Coach response references their specific skills or location

### Failure signals to fix before recording
- Any 404 during task 1 → BUG-01 not fixed yet
- Wrong badges on imported skills → BUG-02 not fixed yet
- User confused by match score with no explanation → add score explanation copy
- Coach gives generic advice not referencing profile → coach context bug

---

## Research Questions Career OS Answers (for judges)

These are the questions Career OS was designed to answer for Haziq. Framing them explicitly strengthens the submission narrative.

1. **"What's the most realistic next career move for someone with my exact skills and background in Malaysia?"** → Career Path Navigator
2. **"Am I being paid what the market pays for my role?"** → Fair Pay Engine (C-04)
3. **"Which jobs should I apply to, and why won't I get the others?"** → Job Matches with gap visibility
4. **"What specific skills should I learn next to make a particular career move?"** → Path Navigator skill gap list
5. **"I'm returning after a gap — will Career OS penalise me for it?"** → Life Chapter Designer (C-05)
6. **"How do I negotiate a raise without risking my job?"** → AI Coach

---

## What Talentbank's Panel Will Look For in the Demo

Based on the council's analysis of Talentbank's user base and internal objectives:

- **Does it work for Haziq, not just a developer?** The demo must show a non-developer persona succeeding with the product.
- **Is the advice specific to Malaysia?** MYR salary ranges, KL/Selangor market context, realistic Malaysian career timelines.
- **Does the candidate feel seen as a person, not just a data point?** The Life Chapter Designer and coaching voice are the proof points.
- **Can Talentbank actually adopt this?** The integration note in the intent form and the architecture's use of Supabase/pgvector (same tech stack they would use) signals adoptability.
