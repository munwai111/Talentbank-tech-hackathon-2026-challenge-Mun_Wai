# Bug Fix Spec — Critical Issues Before Submission
**Priority:** All must be resolved before any feature work  
**Source:** June 1 LLM Council + HACKATHON-ANALYSIS.md

---

## BUG-01 — New User 404 on Dashboard/Profile 🔴 CRITICAL

### Problem
New users who sign up hit a 404 error when navigating to `/dashboard` or `/profile`. A judge who creates a new account will encounter this immediately and stop evaluating.

### Root Cause (hypothesis)
`candidate_profiles` row is not created at signup. Pages query this row and return 404 when it doesn't exist, rather than redirecting to onboarding or showing an empty state.

### Fix
**Option A (Clerk webhook — recommended):** Ensure `POST /api/webhooks` handles `user.created` event and creates a `candidate_profiles` row with the user's Clerk ID. Verify `CLERK_WEBHOOK_SECRET` is set in Vercel env vars.

**Option B (middleware null-check):** In Server Components that fetch `candidate_profiles`, if the result is `null`, redirect to `/onboarding` instead of 404.

Use both: webhook for new users going forward, null-check as safety net.

### Acceptance Criteria
- [ ] New signup on Vercel staging → navigates to `/onboarding` or `/dashboard` — no 404
- [ ] Repeat test with a fresh email address
- [ ] Check Clerk webhook logs confirm `user.created` is being received

---

## BUG-02 — Wrong Badge on AI-Imported Skills 🔴 CRITICAL

### Problem
Skills imported via AI (GitHub import or PDF/resume import) show the wrong source badge. This is a credibility disaster for a skills-first platform — the core thesis is that skills are verified and sourced.

### Root Cause (hypothesis)
The `source` field on inserted skills is not being set correctly during AI import. Likely set to `'self_reported'` or `null` instead of `'github_import'` or `'ai_extracted'`.

### Fix
Audit `POST /api/candidate/skills/route.ts` and `POST /api/candidate/github-import/route.ts`:
- Ensure `source` field is explicitly set: `'github_import'` for GitHub, `'ai_extracted'` for PDF/resume
- Check badge rendering component maps these source values to the correct label and colour

### Acceptance Criteria
- [ ] GitHub-imported skills show "GitHub" badge
- [ ] PDF/resume-imported skills show "AI Extracted" or "Imported" badge
- [ ] Manually added skills show "Self Reported" badge
- [ ] No skill shows wrong or missing badge after either import method

---

## BUG-03 — Duplicate Skills on Import 🔴 CRITICAL

### Problem
Re-running an import (GitHub or PDF) creates duplicate skill entries instead of updating existing ones.

### Root Cause (hypothesis)
Insert without checking for existing skill by name for that user. Same code path as BUG-02.

### Fix
Use upsert pattern: `INSERT INTO skills ... ON CONFLICT (candidate_id, name) DO UPDATE SET level = EXCLUDED.level, source = EXCLUDED.source`

Or: before batch insert, fetch existing skill names for the candidate and filter out duplicates.

### Acceptance Criteria
- [ ] Running GitHub import twice → skills list shows no duplicates
- [ ] Running PDF import twice → no duplicates
- [ ] Existing skills updated (not duplicated) if import contains a skill already in vault

---

## BUG-04 — Work History Not Displaying 🟡 HIGH

### Problem
Work history imported from PDF/resume is saved to `candidate_profiles.work_experience` (JSONB) but not rendered on the profile page. Data is in the DB — this is a frontend render issue.

### Fix
On `/profile` page, fetch and render `work_experience` array. Each entry should show: title, company, period (start_date → end_date), key_technologies.

### Acceptance Criteria
- [ ] Profile page shows work history section when `work_experience` is non-empty
- [ ] Each entry shows: role title, company, date range, tech stack
- [ ] Empty state shown gracefully when no work history yet

---

## BUG-05 — Bio Save Has No Feedback 🟡 HIGH

### Problem
When a candidate saves their bio, there's no visual confirmation. User doesn't know if save succeeded.

### Fix
Add a toast notification or inline "Saved ✓" confirmation after successful bio PATCH.

### Acceptance Criteria
- [ ] Saving bio shows success feedback within 1 second
- [ ] Error state shown if save fails (network error)

---

## Verification Checklist (Run After All Fixes)

```
□ Create new account (fresh email)
□ Complete onboarding
□ Arrive at dashboard — no 404
□ Import PDF resume
□ Check Skills Vault — correct badges, no duplicates
□ Check Profile — work history visible
□ Edit and save bio — see confirmation
□ Run GitHub import
□ Check Skills Vault — GitHub badge, no duplicates
□ All above repeat on Vercel production URL
```
