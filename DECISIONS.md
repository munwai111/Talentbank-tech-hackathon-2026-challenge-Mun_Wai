# Architecture Decision Records — Career OS

> This document records key technical decisions made during development,
> including the trade-offs accepted and the rationale behind them.
> Written for reference by the developer, team, and hackathon assessors.

---

## ADR-001 — AI Model: Claude Haiku over Claude Sonnet for Profile Extraction

**Date:** 2026-06-01  
**Status:** Active (deferred upgrade path — see below)

### Decision
The profile import pipeline (`/api/candidate/import`) uses **`claude-haiku-4-5`** instead of `claude-sonnet-4-5`.

### Context
Career OS is deployed on Vercel's Hobby (free) plan during the hackathon prototype phase.  
Vercel Hobby caps Node.js serverless functions at **10 seconds**. Vercel Edge functions allow **25 seconds**.

Claude Sonnet generates ~30–50 tokens/second. With a target output of 2,500 tokens (full profile extraction with work history and education), Sonnet would take **50–80 seconds** — far beyond either limit, making the feature functionally broken on the Hobby plan.

Claude Haiku generates ~150–200 tokens/second. At 2,500 tokens, Haiku completes in **12–18 seconds** — within the 25-second Edge runtime window.

### Trade-offs accepted
| | Haiku | Sonnet |
|---|---|---|
| Extraction speed | ✅ 12–18s | ❌ 50–80s |
| Skill inference nuance | Adequate for most resumes | Noticeably stronger for ambiguous or sparse CVs |
| Implicit skill detection | Good | Excellent |
| Monthly API cost at scale | ~5× cheaper | Standard cost |
| Vercel Hobby compatible | ✅ Yes | ❌ No |

### Upgrade path (when budget allows)
1. Upgrade to **Vercel Pro** ($20/month) — raises Node.js function limit to 60 seconds
2. Switch extractor back to `claude-sonnet-4-5` in `src/lib/ai/profile-extractor.ts` (one line change)
3. Increase `max_tokens` from 2,500 → 4,000 for more thorough extraction

This upgrade is deliberately deferred. The quality difference is acceptable for a hackathon prototype where the priority is demonstrating a working end-to-end system.

---

## ADR-002 — LinkedIn Import: Copy-Paste Guide over Scraping API

**Date:** 2026-06-01  
**Status:** Active (scraping API option documented for future — see below)

### Decision
LinkedIn profile import is handled via a **guided copy-paste flow** (user copies their LinkedIn page text and pastes it into the platform), not an automated scraping API.

### Context
LinkedIn actively blocks server-side automated access. Any `fetch()` call to a LinkedIn URL from our server returns either a login-redirect page or an HTTP 999/403 block. This is by design — LinkedIn enforces this via legal and technical means.

The guided paste-text approach:
- Is **free** (no third-party API cost)
- Has **100% reliability** (LinkedIn can't block a user copying their own page)
- Requires ~10 extra seconds from the user (Ctrl+A → Ctrl+C → paste)
- The platform shows clear step-by-step instructions inline

### Future option: Professional scraping API

When the platform reaches a healthy budget and user volume, integrating a compliant scraping service would significantly improve the onboarding experience.

**Recommended service:** [Proxycurl](https://nubela.co/proxycurl)  
- Official LinkedIn data API (compliant with LinkedIn ToS via their partner program)
- Returns structured JSON: experience, education, skills, certifications
- Pricing: ~$0.01–$0.03 per profile lookup
- Enables **zero-friction LinkedIn import**: user pastes their LinkedIn URL → platform fetches structured data automatically

**Why this matters for the product:**
- Eliminates the manual copy-paste step entirely
- Profile import becomes part of the **onboarding wizard** (step 1 of sign-up)
- Education, work history, and skills are pre-populated before the user sees the dashboard
- Reduces onboarding drop-off significantly (every extra step loses ~15–25% of users)
- Positions Career OS as a "sign up and you're instantly profiled" product vs "fill in your details manually"

**Implementation when ready:**
Replace `extractTextFromUrl()` in `src/lib/ai/profile-extractor.ts`:
```typescript
// Current: manual HTML fetch (blocked by LinkedIn)
// Future: Proxycurl API call
const response = await fetch(`https://nubela.co/proxycurl/api/v2/linkedin?url=${linkedinUrl}`, {
  headers: { Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}` }
})
const profileData = await response.json()
// Map Proxycurl's structured JSON → ExtractedProfile (no AI needed for LinkedIn)
```

---

## ADR-003 — Profile Data Schema: Rich JSONB over Flat Columns

**Date:** 2026-06-01  
**Status:** Active

### Decision
Work history and education are stored as **JSONB arrays** (`work_experience`, `education`) on `candidate_profiles`, not in separate relational tables.

### Rationale
- The schema of work experience entries (number of fields, optional vs required) evolves as we learn what the AI needs for analysis
- JSONB allows schema evolution without database migrations — critical during a hackathon prototype phase
- Work history is always read and written as a complete set (a resume import replaces the whole history)
- PostgreSQL's JSONB has GIN indexes that make the data queryable if needed
- The approach mirrors `career_data` (Career Identity form data) which also uses JSONB successfully

### What is stored vs displayed
| Data | Stored | Fed to AI |
|---|---|---|
| Skills | ✅ `skills` table | ✅ Path Navigator, Coach |
| Work experience | ✅ `candidate_profiles.work_experience` | ✅ Path Navigator, Coach |
| Education | ✅ `candidate_profiles.education` | ✅ Path Navigator, Coach |
| Career goals/identity | ✅ `candidate_profiles.career_data` | ✅ Path Navigator, Coach |
| Experience description (bio) | ✅ `candidate_profiles.bio` | ✅ Coach |

### Upgrade path
If work history needs to be individually editable or queryable by employers, create a `work_experience` table with foreign keys to `candidate_profiles`. Migration is straightforward since the JSONB data maps 1:1 to relational columns.
