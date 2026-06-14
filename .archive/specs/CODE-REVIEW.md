# Code Review — Career OS Core Routes
**Reviewed:** June 2, 2026  
**Files:** webhooks/route.ts, skills/route.ts, github-import/route.ts, matches/route.ts, import/route.ts, import/apply/route.ts, candidate.ts

---

## Summary
The core architecture is clean — separation of concerns is well-maintained, error handling follows the project pattern, and TypeScript discipline is solid. **Three high-priority issues were found that directly cause the known critical bugs.** Two performance issues will matter at demo scale.

---

## 🔴 Critical Issues (cause the known bugs)

### CR-01 — BUG-01 Root Cause: Webhook doesn't create `candidate_profiles` row
**File:** `src/app/api/webhooks/route.ts`, line 65–76  

The webhook inserts into `users` only. If a Server Component on `/dashboard` or `/profile` queries `candidate_profiles` directly (without using `getOrCreateCandidateProfile`), it gets `null` → 404 or crash.

`getOrCreateCandidateProfile` in `candidate.ts` does upsert correctly — but it's only called from API routes, not Server Components fetching data for page render.

**Fix A (webhook — recommended):** Add `candidate_profiles` row creation inside the `user.created` handler:
```ts
// After users.insert succeeds:
if (role === 'candidate') {
  await supabase.from('candidate_profiles').insert({
    user_id: insertedUser.id,
    name: '',
  }).single()
}
```

**Fix B (Server Components — safety net):** In every Server Component that queries `candidate_profiles`, handle null result with redirect instead of error:
```ts
if (!profile) redirect('/onboarding')
```

Use both. Fix A prevents the issue; Fix B protects against any future code paths that miss it.

---

### CR-02 — BUG-02 Root Cause: Source value `'import'` not matching badge UI mapping
**File:** `src/app/api/candidate/import/apply/route.ts`, line 104  

```ts
source: 'import',   // ← this value
```

`github-import/route.ts` uses `source: 'github'`. Manual skills use `source: source ?? 'manual'`. The UI badge renderer likely maps these values to labels — but `'import'` may map to the wrong badge or fall through to a default.

**Fix:** Standardise source values and verify the badge component maps all of them:
```ts
// Consistent source values across the codebase:
// 'manual'   → "Self Reported" badge
// 'github'   → "GitHub" badge  
// 'imported' → "AI Extracted" badge (rename 'import' → 'imported' for clarity)
```
Check the badge component for the full mapping and ensure all source values are covered.

---

### CR-03 — Webhook uses `req.json()` before signature verification (security risk)
**File:** `src/app/api/webhooks/route.ts`, line 39–41  

```ts
const payload = await req.json()    // ← parses body
const body = JSON.stringify(payload) // ← re-serialises — may differ from original bytes
const wh = new Webhook(WEBHOOK_SECRET)
```

Svix signature verification computes HMAC over the **raw body bytes**. Re-serialising from a parsed JSON object can produce different byte sequences (key ordering, whitespace) → signature mismatch in edge cases.

**Fix:**
```ts
const body = await req.text()         // raw string — preserves exact bytes
const payload = JSON.parse(body)      // parse separately
// ... proceed with verification using body (string)
```

---

## 🟡 Performance Issues

### CR-04 — N+1 query pattern in `import/apply` skill saving
**File:** `src/app/api/candidate/import/apply/route.ts`, lines 89–107  

```ts
for (const skill of extracted.skills) {
  // up to 2 DB calls per skill: update OR insert
  await supabase.from('skills').update(...)
  // or
  await supabase.from('skills').insert(...)
}
```

With 15 skills = up to 15 sequential DB round-trips. On Vercel Hobby with a 25s timeout this is fine, but it's the same pattern the council flagged.

**Fix:** Batch the inserts; do a single update for skills that need level bumping:
```ts
const toInsert = newSkills.map(skill => ({ candidate_id: profileId, name: skill.name, level: skill.clampedLevel, source: 'imported' }))
const toUpdate = upgrades.map(skill => ({ id: skill.existingId, level: skill.clampedLevel }))

if (toInsert.length > 0) {
  await supabase.from('skills').insert(toInsert)
}
// Update individually only where level actually changes (usually 0–2 skills)
```

---

### CR-05 — `matches/route.ts` fetches all open jobs — full table scan risk
**File:** `src/app/api/candidate/matches/route.ts`, line 118–125  

```ts
const { data: jobs } = await supabase
  .from('jobs')
  .select(`id, title, ...`)
  .eq('status', 'open')   // no LIMIT
```

At demo scale (15 seeded jobs) this is fine. But the CLAUDE.md query standards require estimating at scale — 50,000 jobs is the target. Full fetch + in-memory scoring would be catastrophic.

**For hackathon:** Add `.limit(200)` as a safe cap. Document the pgvector path as the proper solution.

```ts
.eq('status', 'open')
.limit(200)  // pgvector semantic matching is the v2 path for scale
```

---

### CR-06 — GitHub import makes N+1 DB calls per skill
**File:** `src/app/api/candidate/github-import/route.ts`, lines 157–183  

Same pattern as CR-04 — up to 30 sequential DB calls for 15 skills (check + insert/update). The deduplication logic is correct, but the batching isn't.

**Fix:** Same batching approach as CR-04.

---

## ✅ What Looks Good

- **`candidate.ts` `getOrCreateCandidateProfile`** — upsert pattern is correct and prevents duplicate profiles. The auto-create on first API call is a solid safety net.
- **`github-import/route.ts` deduplication** — case-insensitive `.ilike()` match is correct and prevents duplicates on re-import.
- **`import/apply/route.ts` skill merge logic** — "higher level always wins" is the right product decision. The `existingByName` Map approach is efficient.
- **`matches/route.ts` synonym normalisation** — the SYNONYMS map handles common variants correctly. The `normalise()` function is clean.
- **Streaming pattern** — consistent across `import/route.ts`, `paths/route.ts`, `coach/route.ts`. The 25s Vercel timeout is correctly managed.
- **Error messages** — LinkedIn-specific and JS-rendered URL error messages are clear and actionable for the user.
- **No `SELECT *`** — all queries name columns explicitly. ✅

---

## Verdict: Request Changes (3 critical, 3 performance)

**Before demo:** Fix CR-01 (404 bug), CR-02 (wrong badge), CR-03 (signature verification).  
**Before submission:** Fix CR-04 + CR-05 + CR-06 (performance/scale).

Priority order: CR-01 → CR-02 → CR-03 → CR-05 (most visible) → CR-04 → CR-06
