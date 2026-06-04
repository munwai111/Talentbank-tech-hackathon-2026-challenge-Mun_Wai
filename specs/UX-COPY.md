# UX Copy — Career OS Sprint Features
**Date:** June 2, 2026  
**Voice:** Direct, warm, APAC-aware. Talks like a smart friend in tech — not HR software. No hollow encouragement. No jargon. Specific over vague.

---

## 1. C-05 — Life Chapter Designer (Step 5, Career Identity Form)

**Context:** New optional step added to the 4-step Career Identity form. User has just told us their goals and dream role. Now we're asking about life context. This is personal — approach it with care.

**Step heading:**
> **Life comes first.**

**Step subheading:**
> Your career plan should fit your actual life — not the other way around. Is there anything we should know?

**Pill options (user picks one or more, or writes their own):**
| Pill label | Notes |
|---|---|
| I have caregiving responsibilities | Elderly parents, children, dependants |
| I'm planning a career break | Parental leave, sabbatical, study |
| I'm returning after a gap | Re-entering workforce |
| I need to stay in a specific location | Can't relocate |
| I'm managing a health condition | Chronic illness, recovery |
| I want to reduce hours or go part-time | Flexibility over salary |
| None of the above | |

**Free text field placeholder:**
> Something else? Tell us in your own words.

**Skip link:**
> Skip this step →

**Rationale:** "Life comes first" is confident and slightly surprising — it signals that Career OS isn't just another career machine. The phrasing "fit your actual life" echoes Talentbank's C-05 intent exactly. Pill labels are plain and non-stigmatising ("managing a health condition" not "disabled").

---

### How this context surfaces in Path Navigator

**When life context is present, add a note under each path card:**

| Context | Navigator note |
|---|---|
| Caregiving responsibilities | "These paths are selected for roles with predictable hours and remote flexibility — common in this track in Malaysia." |
| Planning a career break | "This path accounts for a 12–18 month gap. Professionals in Malaysia who re-enter in this track typically land at the Emerging match level." |
| Returning after a gap | "Your gap is noted. Paths here account for it — we focus on your skills and where you're headed, not the break itself." |
| Need to stay in location | "Paths filtered for roles available in your area. Remote options noted where common." |
| Reduce hours / part-time | "This path includes roles commonly offered part-time or with flexible arrangements in Malaysia." |

---

## 2. E-01 — Goal-Based Matching Chips (Job Cards)

**Context:** Job match cards on `/jobs` page. Currently show matched/missing skills. Now adding goal alignment signal.

### New chip labels

| Scenario | Chip | Colour | Meaning |
|---|---|---|---|
| Candidate goals align with job function | `Goal match` | Green | Your stated goals point here |
| Goals align but skills are partial | `Career pivot` | Amber | Where you're heading, gap to close |
| Goals and skills both align | `Strong fit` | Green (existing) | Keep as-is |

### Chip tooltip copy

**Goal match:**
> Your career goals align with this role's direction — not just your current skills.

**Career pivot:**
> This is where you're aiming. Your skills are a partial match now — this is a realistic next move.

### Match score explanation line (below % score)

| Situation | Copy |
|---|---|
| High skills + goal match | `X of Y required skills · Career direction aligned` |
| High skills, goal mismatch | `X of Y required skills · Different from your stated goals` |
| Low skills, goal match | `X of Y required skills · Matches where you're heading` |
| Goal pivot | `X of Y required skills · Career pivot — skills to close: [list]` |

**Rationale:** "Career pivot" is more empowering than "skills gap." Malaysian candidates often feel penalised for wanting to change tracks — framing it as a deliberate direction rather than a deficit changes the emotional register.

---

## 3. C-04 — Fair Pay Engine Copy

**Context:** Salary signal displayed on job cards and Path Navigator cards.

### Job card salary display

**Employer-posted salary:**
> RM X,XXX – RM X,XXX / month

**Market estimate (no employer data):**
> Market rate: RM X,XXX – RM X,XXX / month *(estimate)*

**Tooltip on "estimate":**
> Based on similar roles in Malaysia. Actual salary depends on company size, location, and your experience level.

### Path Navigator salary block label

Current text is unlabelled. Add:
> **Typical salary range for this move**  
> RM X,XXX – RM X,XXX / month · Malaysia market, 2026

**Sub-note:**
> Professionals in Malaysia with your profile typically land in this range. Singapore roles run 2.5–3× in SGD.

### Dashboard "Market Value" widget (P1)

**Widget heading:**
> Your estimated market value

**Value display:**
> RM X,XXX – RM X,XXX / month

**Sub-label:**
> Based on your current skills and experience level in Malaysia

**CTA:**
> Ask your coach about negotiating →

### Coach salary prompts (suggested questions, shown on coach screen)

- "Am I underpaid for my role in KL?"
- "What should I earn as a [role] with [X] years experience?"
- "How do I negotiate a raise without losing my job?"

---

## 4. Bug Fix Copy — Bio Save Feedback

**Success toast:**
> Profile saved

**Error toast:**
> Couldn't save — try again

*(Short. No drama. The user knows what they did.)*

---

## 5. Work History — Empty State

**When `work_experience` is empty on profile:**

> **No work history yet.**  
> Import your CV or add roles manually to see your career timeline here.

**CTA:**
> Import CV →  (links to /profile#import)

---

## 6. Dashboard — Proactive Coach Prompt (C-03 depth)

**Context:** Dashboard widget shown when the AI has something relevant to surface. Quiet most of the time — only appears when there's a specific, useful signal.

### When candidate has skill gaps close to a career path threshold:

> **Your coach has something to tell you.**  
> You're 2 skills away from qualifying for Senior roles in your track. Ask your coach what to focus on.

**CTA:** `Open coach →`

### When candidate hasn't updated skills in 30+ days:

> **Your profile may be out of date.**  
> Skills change fast in APAC tech. Add what you've learned recently — it affects your match scores.

**CTA:** `Update skills →`

### When a new job match score crosses 80%:

> **A strong match just opened.**  
> [Company name] posted a role that matches 80% of your skills — and aligns with your goals.

**CTA:** `See match →`

---

## 7. Onboarding — Step Labels (consistency review)

Ensure all 5 Career Identity steps use this labelling pattern:

| Step | Label | Sub-label |
|---|---|---|
| 1 | **Where you are now** | Your current situation and role |
| 2 | **What you're looking for** | Your next move |
| 3 | **What matters to you** | Work style, values, priorities |
| 4 | **Where you want to go** | 1-year and 5-year goals |
| 5 | **Life comes first** | What your career should fit around |

---

## 8. Submission / Intent Form — Key Headline Copy

**Project tagline (for intent form and demo video title card):**
> Career OS — The career co-pilot Asia's talent market actually needs

**One-liner for judges:**
> Skills-first hiring platform tackling C-01 (Career Path Navigator), C-02 (Living Portfolio), C-03 (AI Career Coach), C-05 (Life Chapter Designer), and the compulsory dual-sided Career Marketplace — built for Malaysia, demo-ready today.

**Demo video opening line (voice-over):**
> "Most career platforms tell you to polish your CV. Career OS tells you what to do next — and why."

---

## Localisation Notes

- All copy is in Australian/British English (consistent with project `.md` files)
- Malaysian market references: use "KL" not "Kuala Lumpur" in casual contexts, "Malaysia" for formal
- Salary always in MYR, never USD; Singapore mentioned as context only ("2.5–3× in SGD")
- Avoid idioms that don't translate: "hit the ground running," "ballpark" — use plain language
- "Career break" preferred over "employment gap" — less stigma
- "Caregiving responsibilities" preferred over "family commitments" — more inclusive
