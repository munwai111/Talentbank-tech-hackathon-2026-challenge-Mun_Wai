@AGENTS.md

---

## Code Review Standards

After completing any implementation, review code against these standards before presenting it.
Run `/simplify` as the final gate — fix all findings before showing code to the user.

### Rules

| Rule | Threshold | Action |
|------|-----------|--------|
| Function length | > 30 lines | Split into smaller single-purpose functions |
| Logic duplication | > 2 occurrences | Extract to named utility in `src/lib/` |
| TypeScript `any` | Any usage | Replace with real type, `unknown` + guard, or Supabase generated type |
| Component props | > 3 related props | Group into a typed object prop |
| Async error handling | Unwrapped `await` | Wrap in `try/catch`, return typed error response |

### TypeScript `any` — preferred alternatives (in order)
1. Import the correct type from `@/types/database` or the library's own types
2. Define a `type` or `interface` inline in the file
3. Use `unknown` with a runtime type guard if the shape is genuinely unknown
4. Cast with `as SpecificType` only when you are certain of the shape

### Error handling pattern for API routes
```ts
try {
  const result = await someAsyncOperation()
  return NextResponse.json({ data: result })
} catch (err) {
  console.error('[route-name] operation failed:', err)
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Something went wrong' },
    { status: 500 }
  )
}
```

### Utility extraction threshold
If the same logic appears in 3+ places → extract immediately.
If it appears in 2 places → extract if the logic is non-trivial (> 5 lines or has branching).
If it appears once but is > 15 lines → consider extracting for readability.

---

## Query Standards (applies to all Supabase/SQL queries)

Every query I write must follow these rules. State the reasoning when the pattern isn't obvious.

### Never SELECT *
Always name the columns you need. Fetching unused columns wastes bandwidth and makes joins ambiguous.
```ts
// ❌ bad
supabase.from('candidate_profiles').select('*')

// ✅ good — only what the component renders
supabase.from('candidate_profiles').select('id, name, headline, location, embedding')
```

### Index every query pattern
Before writing a query that filters or sorts, ask: is there an index on these columns?
If not, flag it with a migration comment.
```sql
-- query: WHERE status = 'open' AND company_id = ?
-- needs: CREATE INDEX IF NOT EXISTS idx_jobs_company_status ON jobs (company_id, status);
```
Composite index column order: **most selective filter first**, then sort column.

### Estimate performance at scale
For any query against tables that will grow large (jobs, skills, users), state the expected
row count and estimated query time. Flag if a full table scan is likely.

| Table | Expected rows at launch | Expected rows at scale |
|-------|------------------------|------------------------|
| users | ~100 | ~100,000 |
| candidate_profiles | ~100 | ~100,000 |
| jobs | ~15 (seeded) | ~50,000 |
| skills | ~500 | ~5,000,000 |

### Fetch only what the caller needs — example
```ts
// Dashboard only needs counts, not full profiles
const { data } = await supabase
  .from('jobs')
  .select('id, title, status, created_at')  // not skills, description, etc.
  .eq('company_id', companyId)
  .order('created_at', { ascending: false })
  .limit(5)
```

---

## Project Context

This is Career OS — a skills-first hiring platform for APAC built for the Talentbank Tech Hackathon 2026.

**Stack:** Next.js 16.2.6 (App Router, Turbopack) · Clerk v7 auth · Supabase v2 · shadcn/ui · TypeScript

**Key architectural rules:**
- Server Components for data fetching; Client Components only when interactivity is required
- `createServerClient()` (service_role) for server-side Supabase; `createBrowserClient()` (anon key) for client-side
- All AI calls go through `src/lib/ai/` — never call Anthropic SDK directly from route handlers
- Route groups: `(candidate)/` for candidate pages, `(employer)/employer/` for employer pages
- JSONB blobs (`career_data`, `culture_data`) are read whole — do not add individual columns for fields inside them
