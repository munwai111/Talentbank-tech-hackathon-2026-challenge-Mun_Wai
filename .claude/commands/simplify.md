# /simplify

Run this before presenting any code to the user. It is a self-review gate — catch issues before they ship.

## Checklist (fail any = fix before presenting)

### 1. Function length
- Flag any function longer than **30 lines**
- If found: split into smaller, single-purpose functions with descriptive names

### 2. Logic duplication
- Flag any logic duplicated **more than twice**
- If found: extract to a named utility function in `src/lib/`

### 3. TypeScript `any`
- Flag every use of `any` (explicit or cast)
- If found: replace with a real type. Options in order of preference:
  1. Import the correct type from Supabase's generated types or a library
  2. Define a `type` or `interface` inline
  3. Use `unknown` + a type guard if the shape is truly unknown

### 4. Prop objects
- Flag any React component with **more than 3 props** that are conceptually related
- If found: group into a typed object prop (e.g. `config`, `options`, `data`)

### 5. Async error handling
- Flag any `await` call without a `try/catch` or `.catch()` that could surface to the user
- If found: wrap in try/catch and return a typed error response

## Output format

Report findings as:
```
/simplify results
─────────────────
✓ Function length    — all clear
⚠ TypeScript any     — 2 instances at line 34, 67 → fixed
✓ Duplication        — all clear
✓ Prop objects       — all clear
⚠ Async handling     — fetchProfile() unwrapped at line 89 → fixed
─────────────────
Fixed 2 issues. Code is ready to present.
```

If all clear:
```
/simplify results — all clear ✓
```
