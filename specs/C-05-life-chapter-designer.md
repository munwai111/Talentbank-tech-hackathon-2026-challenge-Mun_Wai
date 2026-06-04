# PRD — C-05 Life Chapter Designer
**Module:** Talentbank Challenge C-05  
**Status:** Not built → Sprint priority  
**Effort estimate:** 4–8 hours (form extension + AI synthesis update)  
**Dependencies:** Career Identity form (`/discover`), `career-synthesizer.ts`, `career_data` JSONB schema

---

## Problem Statement

Talentbank's C-05 module asks: *"What if life had room for more than work?"* Most career platforms treat career planning as purely professional — ignoring that family, health, caregiving, study breaks, and relocations shape career trajectories just as much as skills do. Career OS's Career Identity form captures goals but nothing about life chapters. Candidates whose career plans are constrained by life events (caring for ageing parents, planning a family, recovering from illness, returning after a career break) have no way to signal this — so the Path Navigator and AI Coach give advice disconnected from their reality.

---

## Goals

1. Close the C-05 module gap — Career OS explicitly addresses Life Chapter Designer in submission
2. Path Navigator paths account for life event constraints (e.g. "open to relocation: no due to family")
3. AI Coach references life context when giving advice
4. Candidate feels understood as a whole person, not just a skills list
5. Feature demoed with the 25-year-old Shah Alam persona in the submission video

---

## Non-Goals

- Full life planning tool (financial planning, health tracking) — out of scope
- Complex timeline visualisation of life chapters — v2
- Integration with calendar or health apps — v2
- Employer-visible life chapter data — privacy concern, not for v1

---

## User Stories

**As a candidate with family responsibilities,** I want to tell Career OS that I have caregiving commitments, so that my career paths account for my need to stay near home and avoid roles with unpredictable hours.

**As a candidate planning a career break,** I want to note an upcoming parental leave or study sabbatical, so that the AI Coach gives me advice relevant to re-entering the market in 12–18 months.

**As a candidate who had a career gap,** I want to explain the gap in context, so that my Path Navigator paths don't penalise me for it and the coach knows how to frame it.

**As a returning professional,** I want to note that I'm re-entering after a break, so that the platform treats me as a career re-starter rather than someone with no history.

---

## Requirements

### P0 — Must Have (v1 ships with these)

**Step 5: Life Chapter (new step added to Career Identity form)**
- New step added after existing 4 steps in `/discover`
- Field: "Is there anything about your life right now that should shape your career plan?" (free text, optional)
- Suggested prompts shown as pill options (user can pick one or write their own):
  - "I have caregiving responsibilities"
  - "I'm planning a career break or parental leave"
  - "I'm returning after a career gap"
  - "I need to stay in a specific location"
  - "I'm managing a health condition"
  - "I want to reduce hours or go part-time"
  - "None of the above"
- Field stored as `career_data.life_chapter_context` (string) in existing JSONB blob
- No DB migration required — JSONB absorbs new field

**Path Navigator integration**
- `career_data.life_chapter_context` passed to `buildPathPrompt()` in `path-navigator.ts`
- System prompt updated: when life context is present, paths must account for it explicitly
- Each path's `trade_off` field should reference life constraints where relevant

**AI Coach integration**
- `life_chapter_context` added to `buildProfileContext()` in `coach.ts`
- Coach references life context naturally in advice (e.g. "Given you mentioned caregiving, here's how to frame a part-time arrangement...")

### P1 — Nice to Have

- Dashboard shows a "Life Chapter" chip alongside career goals if filled in
- Path Navigator navigation_note references life context: "Professionals in similar situations in Malaysia typically..."
- Career Identity narrative (career-synthesizer.ts) weaves life chapter into the written summary

### P2 — Future

- Timeline view showing career phases and life events side by side
- "Life chapter" used in employer matching as a filter preference (remote-friendly, part-time roles)

---

## Acceptance Criteria

- [ ] Step 5 appears in Career Identity form after existing 4 steps
- [ ] Step is optional — user can skip and complete Career Identity without it
- [ ] Pill options are visible and clickable; free text field available for custom input
- [ ] Data saved to `career_data.life_chapter_context` correctly
- [ ] Path Navigator reads and reflects life context in generated paths (manual test: enter "caregiving responsibilities" → paths should show flexible/remote options)
- [ ] AI Coach references life context in first response after profile loaded (manual test: ask "what roles should I target?" → response should reference life context if present)
- [ ] Existing Career Identity users without step 5 data are unaffected

---

## Implementation Notes

```ts
// In career_data type (types/database.ts) — add optional field:
life_chapter_context?: string | null

// In path-navigator.ts buildPathPrompt():
const lifeContext = cd?.life_chapter_context
  ? `\nLIFE CONTEXT (account for this in all paths):\n  ${cd.life_chapter_context}`
  : ''
// Append lifeContext to context string

// In coach.ts buildProfileContext():
`Life context: ${ctx.lifeChapterContext ?? 'not specified'}`

// In /discover page — add Step 5 with pill options
// Reuse existing step pattern; no new API routes needed
// career-data PATCH route already handles arbitrary career_data fields
```

---

## Success Metrics

- C-05 module explicitly claimed in hackathon intent form submission
- Demo video shows candidate filling in life chapter context and receiving personalised paths
- Judge can see life context reflected in Path Navigator output during demo

---

## Timeline

**Target:** Shipped by June 5 (Day 3 of sprint)  
**Effort:** ~4–6 hours (form UI + 2 prompt updates + type extension)
