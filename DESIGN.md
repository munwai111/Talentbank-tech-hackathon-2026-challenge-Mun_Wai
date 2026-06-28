# Design

Visual system for Y.O.U — "Orbital Brutalism". Precision-instrument meets
cosmic cartography on a deep-space canvas. The landing page is fully themed;
the app interior is a separate indigo/teal system being migrated.

## Theme

Dark, always — a deep-space "void" canvas. Chosen by scene: a skeptical
graduate, late, on a phone or laptop, wanting to feel they've found something
sharp and built-for-them. Light would read safe; cream would read AI-default.
Strategy: **committed** — chartreuse is a restrained signal (≤10% of surface),
not a flood; violet carries the second voice; the void dominates.

## Color

Scoped under `.cos-landing` (see `src/app/globals.css`). Hex today; OKLCH is the
migration target.

| Token | Value | Role |
|---|---|---|
| `--cos-black` | `#0A0A0F` | Body / void canvas |
| `--cos-navy` | `#0F0F1A` | Alternate section band |
| `--cos-card` | `#131320` | Surface / panel |
| `--cos-card-border` | `#1E1E35` | Hairline dividers, borders |
| `--cos-chartreuse` | `#E8FF47` | Primary signal — CTAs, accents, the payoff word |
| `--cos-violet` | `#7B61FF` | Secondary voice — employer side, mid-horizon |
| `--cos-green` | `#2EFF9A` | "Now" / strong-match horizon |
| `--cos-white` | `#F0F0F0` | Primary text |
| `--cos-muted` | `#6B6B8A` | Secondary text (verify ≥4.5:1 where used as body) |

Contrast notes: chartreuse vanishes on light, so themeable surfaces use violet
(`adaptive` logo variant). Data-viz label tints lightened for AA (`#B7A6FF`
violet, `#6EE7B7` mint).

## Typography

Contrast-axis pairing — geometric display + monospace data, never two similar sans.

- **Display:** Space Grotesk (`--font-grotesk`), weights 400–700. Headlines,
  logotype, section titles. Letter-spacing floor ≥ -0.04em; hero clamp max ≤ 96px.
- **Mono:** JetBrains Mono (`--font-jetbrains`). Eyebrows, axis labels, salary
  figures, system readouts — the "instrument" voice. Tabular figures on all numbers.
- **Body:** Plus Jakarta Sans (`--font-jakarta`). Running text, 65–75ch measure.

## Motion

framer-motion (`motion` v12). Intentional, not decorative.

- Ease-out exponential curves (`[0.23, 1, 0.32, 1]`); no bounce, no elastic.
- Signature interactions: orbiting satellite + pulsing hub on the logomark
  (hover extends the vector, press ripples); the trajectory path draws in;
  waypoints arrive on staggered spring; stat counters count up; section reveals
  on `whileInView` (staggered, once).
- Every animation has a `prefers-reduced-motion` fallback: final state, no motion.

## Components / Motifs

- **Y.O.U logomark** (`src/components/brand/YouLogo.tsx`): hand-built geometric
  SVG. O = hub, satellite = odyssey, U→vector = trajectory. Variants: void,
  chartreuse, light, adaptive.
- **Career trajectory** (`src/components/landing/CareerTrajectory.tsx`): hero
  data-viz, area/line chart with waypoints + tabular detail table (a11y alt).
- **Noise overlay**, radial glows, hairline dividers, infinite skills ticker.
- No cards-in-cards, no side-stripe borders, no gradient text, no glassmorphism.
