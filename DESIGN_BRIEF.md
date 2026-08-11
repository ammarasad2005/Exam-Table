# DESIGN BRIEF — FAST NUCES Utilities ("exam-table") Visual Refresh

**Direction name:** **Editorial Ink — warm, precise, confidently anchored.**
**Status:** PROPOSED — awaiting explicit approval before implementation (Phase 2 hard pause).
**Source evidence:** `structural_blueprint_fastnuces/` (13 page blueprints + DOM manifests + VLM analyses + before-screenshots) cross-referenced against cloned source `exam-table/` (Next.js 14 + React 18 + Tailwind 3.4 + shadcn/ui + framer-motion + next-themes).
**Author:** redesign session, Phase 1 ingest complete.

---

## 0. TL;DR — the direction in one paragraph

The current site is already a *good*, opinionated editorial design (warm off-white surfaces, Instrument Serif / DM Sans / DM Mono pairing, a purple→orange "laser rail" brand motif, full dark mode, staggered card entrances). It is **not** generic shadcn. The redesign is therefore an **evolution, not a rebuild**: we keep the warm-neutral foundation and the serif/sans/mono discipline, but we (a) fix the single biggest defect — the floating nav dock and feedback tab that **overlap content on nearly every page** (14 of 16 VLM anomalies); (b) replace the scattered "orange overload" (orange is simultaneously brand, feedback, admin, laser-rail, summer-mode, and primary CTA) with **one confident primary action color: near-black ink** (`#1A1A18` light / `#F0EFEB` dark) — the same move premium editorial/SaaS surfaces (Vercel, Linear, Stripe docs) use; (c) tokenize the ~15 hardcoded colors that currently break in dark mode; (d) sharpen surface layering, unify the "today" highlight, and add tasteful scroll-reveal motion that respects `prefers-reduced-motion`. Data-dense views (timetable grid, exam cards, rooms calendar, optimizer results) get **clarity-first** treatment: minimum 12px type, denser-but-clearer grids, no decorative motion on data cells.

---

## 1. Region-by-region critique of the CURRENT design

Critiques reference actual blueprint regions and measurements, not generic statements. Anomaly IDs are verbatim from each blueprint's `## Notes / Anomalies`.

### 1.1 Landing (`/`) — `src/app/page.tsx`

| Region (blueprint) | Observation |
|---|---|
| **LEFT hero panel** (576px desktop / full-width mobile) | Eyebrow + Instrument Serif headline + typing animation + DesktopTicker clock + social links over a dot-grid texture. **Problem:** the DesktopTicker ghost-bleeds behind the hero headline when no `userConfig` is set — VLM anomaly #1 ("faint timestamp behind hero"). The dot-grid texture + translucent clock + serif headline compete for the eye; hierarchy is muddy. |
| **RIGHT feature grid** (864px, 3-col desktop → 2-col mobile) | 8 feature cards in `content-start` → **varying heights** (250/203/226px desktop). Visually ragged. **No primary CTA** — all 8 cards are equal-weight, so a first-time user has no "start here" affordance. Mobile gap drops 16→12px but cards stay dense. |
| **Floating Navbar dock** | VLM anomaly #2: "floating dock overlaps bottom card row." The 570×89px pill dock sits `fixed bottom-center` and eats the last row of feature cards on desktop. |
| **FeedbackWidget tab** (right edge) | Additional anomaly surfaced from `landing_mobile.json`: tab overlaps the TIMETABLE OPTIMIZER card border on mobile. |
| **FloatingMenu FAB** (mobile) | Overlaps the SEMESTER SCHEDULE card on mobile (from `landing_mobile.json`). |

**Verdict:** Strong editorial hero, but no conversion path, ragged grid, and three separate overlapping floating elements.

### 1.2 Home (`/home`) — `src/app/home/page.tsx`

| Region | Observation |
|---|---|
| **Configuration form card** (280×368px centered) | Uses the same `laser-rail` gradient border as the Header and Navbar dock — the strongest "premium" depth moment in the app. CTA is strong (52px full-width primary button, per-feature label). **Good.** |
| **LEFT hero panel** | Nearly **identical** to the landing page's LEFT panel (same eyebrow, headline pattern, typing animation, DesktopTicker, social links, dot-grid). Repetitive when navigating `/` → `/home`. |
| **Post-submit dashboard** | Blueprint labels this region "Dashboard" but it's actually a conditional tabbed view; blueprint under-documents it. |
| **Mobile anomalies** | FeedbackWidget tab overlaps the form; FAB overlaps the "View my timetable" CTA dock. |

**Verdict:** Best-executed card on the site, but duplicated hero is wasteful and mobile floating elements collide with the primary CTA.

### 1.3 Timetable (`/timetable`) — `src/app/timetable/page.tsx`

| Region | Observation |
|---|---|
| **List view** | 3-col grid, comfortable density. **Good scannability.** |
| **Grid view** | `text-[9px]`–`text-[10px]` mono labels, `min-w-980px` forces **horizontal scroll on tablet**. Below the 12px readability floor. |
| **Electives accordion** | 4-col layout — excellent. |
| **Filters bar** | Blueprint describes selects + Apply that actually live on `/` (landing) — blueprint/source mismatch. |
| **Bottom padding** | `pb-[150px]` — overkill on desktop where navbar is 89px; workaround for the floating dock. |

**Verdict:** List view is fine; grid view is too dense and breaks on tablet. Inconsistent bottom padding is a dock-overlap workaround.

### 1.4 Timetable / Custom (`/timetable/custom`) — `src/app/timetable/custom/page.tsx`

| Region | Observation |
|---|---|
| **Sidebar row-editor** | Labels at `text-[9px]` — borderline illegible. |
| **Bundle-card hover actions** | 7px-tall buttons, 9px text — **below tap-target minimum** (44px). |
| **Course picker / save-export bar** | Blueprint marks "not in DOM" but they exist inside `hidden md:flex` sidebar (manifest limitation, not a real absence). |

**Verdict:** Functionally rich but sub-tap-target controls and sub-readable type.

### 1.5 Timetable / Optimizer (`/timetable/optimizer`) — `src/app/timetable/optimizer/page.tsx` + `TimetableOptimizer.tsx`

| Region | Observation |
|---|---|
| **Result cards** | Information-dense: rank + 2 scores + 2–3 badges + 3-col course grid. Emoji badges (⚠️ 🧠 🔒) misalign and render inconsistently across platforms. |
| **"Conflict Map / heatmap"** | Blueprint overview describes a conflict heatmap that **does not exist in source** (0 grep matches). Either a documentation error or a planned feature. |
| **Bottom padding** | `pb-[150px]` — same dock workaround. |

**Verdict:** Dense but legible if emoji→lucide migration happens. The missing heatmap is out of scope (non-goal: no feature additions).

### 1.6 Schedule (`/schedule`) — `src/app/schedule/page.tsx`

| Region | Observation |
|---|---|
| **Day-grouped 3-col grid + CountdownBadge** | Strongest scanning pattern in the group. Department color-coding is effective **but weakened by 3 accent collisions** (cs=bba, cy=ba, ai=ft). |
| **CountdownBadge** | Hardcoded red — does not adapt to dark mode. |
| **Bottom padding** | `pb-24 md:pb-8` — inconsistent with timetable's `pb-[150px]`. |

**Verdict:** Best data view; just needs token-ization and consistent spacing.

### 1.7 Custom Exams (`/custom`) — `src/app/custom/page.tsx`

Structurally near-identical to `/timetable/custom` — same strengths (form clarity) and weaknesses (sub-tap targets, tiny labels). No VLM anomalies. Duplicate `ListView`/`GridView` components shared with `/timetable/custom`.

### 1.8 Rooms (`/rooms`) — `src/app/rooms/page.tsx`

| Region | Observation |
|---|---|
| **CalendarGrid** | Sticky 130px left col + 150px day headers — densest view, but green/amber binary vacancy coding makes patterns immediately readable. **Good.** |
| **RoomPill** | Hardcoded amber — no dark-mode adaptation. |
| **SpecificResults** | Per-block grouping — excellent wayfinding. |

**Verdict:** Excellent information design; needs token-ization only.

### 1.9 Semester (`/semester`) — `src/app/semester/page.tsx`

| Region | Observation |
|---|---|
| **DesktopHero** | Eyebrow mono + Instrument Serif h1 `clamp(2.2rem,3.5vw,3.6rem)` "Semester Schedule — *Summer 2026.*" — editorial, **good**. |
| **KeyDatesSection** (timeline, col 1) | 2px vertical line **hardcoded `#E5E7EB`** (breaks in dark mode). Today/classes-start text hardcoded `#fff`. Staggered reveal (700ms line + 60ms/item) — tasteful. |
| **HolidaysSection** (col 2) | Cards use `bg-subtle` (recessed) — good depth differentiation. |
| **CalendarsSection** (col 3, sticky) | 5-swatch legend + 2-col month cards. Cells `aspect-square` `font-mono text-[10px]` `gap-[2px]` — **extremely tight**, DOW headers `text-[9px]`. No text labels inside cells (just date numbers); user must consult legend. No hover/click. |
| **CTAs** | **Zero** — no ICS export, no print, no "add to calendar" despite key dates being ICS-able. Missed opportunity (but adding features is a non-goal; we'll only style existing affordances). |
| **Mobile padding** | `pb-28` — over-padded (dock hidden on mobile). |
| **Anomalies** | Dock overlaps "Course withdrawal deadline" card; GIVE FEEDBACK tab outside content flow. |

**Verdict:** Beautiful editorial feel undermined by hardcoded colors, sub-readable calendar cells, and dock overlap.

### 1.10 Events (`/events`) — `src/app/events/page.tsx` + `EventsCalendar.tsx`

| Region | Observation |
|---|---|
| **Hero** | Instrument Serif h1 + 17px body — good. `events-hero-enter` 560ms entrance — tasteful. |
| **EventsCalendar wrapper** | Gradient pane + `shadow-float` + `border-inset` — elevated, **good depth**. |
| **Desktop cells** (132–142px) | Date `font-mono text-sm`; today = **three inconsistent colors**: orange `#ff7a00` border/glow, green `#16c60c`/`#7CFC00` date text, (mobile) blue `#378ADD` badge. **Must unify.** |
| **Event chips** | `chipPalette` is **positional** (blue/teal/indigo by eventIndex), not semantic — can't tell seminar vs workshop vs deadline by color. No legend. |
| **Mobile cells** (46×54px) | Dots only — no event info without tap. |
| **Right aside** | Ongoing (emerald pulse dot) + Upcoming snapshot — good. Every card has ICS export — **strong CTA discipline**. |
| **Hardcoded colors** | `#ff7a00`, `#16c60c`, `#7CFC00`, `#378ADD`, `#1D9E75`, `#534AB7` — none adapt to dark mode. |
| **Anomalies** | 4 in blueprint (INDEX.md claims 1 — discrepancy): dock overlaps calendar grid (desktop + tablet); feedback tab outside flow (desktop + tablet). |

**Verdict:** Best motion + depth, worst color-tokenization and today-highlight inconsistency.

### 1.11 Faculty (`/faculty`) — `src/app/faculty/page.tsx` + `FacultyCard.tsx`

| Region | Observation |
|---|---|
| **Sidebar** (desktop) | Sticky vertical dept list w/ per-dept counts + active ring — efficient, good feedback. |
| **Mobile dept strip** | Horizontal pills — **loses count badges** that desktop shows. |
| **FacultyCard (grid)** | `font-display text-lg` name (Instrument Serif) — editorial portrait feel. Photo `aspect-[4/3]` + `group-hover:scale-105`. **Hover swaps shadow via inline `onMouseOver/onMouseOut`** — janky, not CSS transition. |
| **Photo fallback** | `text-4xl font-bold` initials on accent-bg — VLM anomaly: "jarring next to photo cards." |
| **LinkedIn badge** | Hardcoded `#0A66C2`. |
| **Pagination** | Numbered, 24/page → 11 pages. Visually quiet (mono text-xs). |
| **View toggle** | Mobile-only — desktop locked to grid. |
| **Header mis-registration** | Header is `h-[3.75rem]` (60px) but sticky elements use `top-14` (56px) — 4px gap. |
| **Anomalies** | Dock overlaps 2nd card row; initials fallback; feedback tab cut off. |

**Verdict:** Strong editorial cards; needs CSS-transition hover, subtler fallback, count badges on mobile, and the 4px header fix.

### 1.12 Lost & Found (`/lost-found`) — `src/app/lost-found/page.tsx` (6554 lines!)

| Region | Observation |
|---|---|
| **Hero** | `font-body text-2xl font-bold` — **NOT Instrument Serif**. Only page in group C without the display font. Breaks cross-page consistency. |
| **StatsDashboard** | 3 cards w/ `AnimatedCounter` `text-4xl font-black` + `stat-glow` 3s pulse. Translucent `color-mix` surfaces — pretty but heavy. |
| **ItemCard** | `motion.div layout` + image-forward + overlay badges (Lost=rose / Found=green). Expandable desc popover. **3 duplicate "REPORT AN ITEM" CTAs** (hero + desktop `btn-shimmer` + mobile fixed pill) — overkill. |
| **ReportForm** | 5-step wizard — comprehensive but possibly excessive for a lost-item report. |
| **Mobile** | Fixed bottom pill + floating `+` button **overlap** (anomaly). Heading truncation ("Scientific …"). 3rd stat card obscured by feedback tab. |
| **Motion density** | `motion.div layout` on every card + AnimatePresence on subviews + AnimatedCounter + `cta-pulse-btn` (2.5s) + `urgent-badge` (1.5s) + `skeleton-shimmer` (1.8s) — **perf concern on low-end mobile**. |
| **Hardcoded colors** | `#16a34a`, `#10b981`, `#0A66C2`, `#25D366`, `#E11D48`, `#059669`. |
| **Anomalies** | 5: dock overlaps welcome banner; feedback tab outside flow; 3rd stat obscured on mobile; heading truncated; FAB overlaps bottom pill. |

**Verdict:** Most feature-rich page, most anomalies, most animation density, only page breaking the serif discipline. Needs the most restraint.

### 1.13 Admin (`/admin`) — `src/app/admin/page.tsx`

| Region | Observation |
|---|---|
| **Login card** | `backdrop-blur-md` + `rgba(255,255,255,0.03)` bg — **extremely translucent, low contrast in light mode**. Orange used as primary brand color here (unique among pages). No Instrument Serif (deliberate). |
| **Post-auth dashboard** | 3-tab console (Belongings / Suggestions / Settings) — not documented in blueprint. |
| **Anomalies** | 0 — cleanest page. |

**Verdict:** Needs opacity/contrast fix in light mode; otherwise fine.

### 1.14 Persistent navigation (cross-cutting)

| Element | Issue |
|---|---|
| **Header** (sticky 60px, `glass-header-laser`) | Logo hover turns orange (clashes with brand). Missing ARIA. Mobile social icons cramped. 4px mis-registration with `top-14` sticky offsets. |
| **Navbar dock** (desktop/tablet pill, 5 tabs) | COURSES tab misleadingly routes to `/timetable/custom`. Uses `<button>` not `<Link>` (no prefetch). Missing `aria-current`. **Overlaps content on every full-height page.** |
| **FloatingMenu** (mobile radial FAB, 7 items) | 634 lines — over-engineered. Different item set from Navbar (IA inconsistency, but fixing is a non-goal). Drag interaction non-discoverable. |
| **FeedbackWidget** (right-edge tab, all breakpoints) | `animate-bounce` icon — **no `prefers-reduced-motion` guard**. No `aria-label`. Hardcoded `bg-white/80` bypasses tokens. **Overlaps content on every mobile page.** |
| **DesktopTicker** (landing + home LEFT only) | Source of the ghost-timestamp anomaly. |
| **GlobalShortcuts** | `Ctrl+Shift+A`/`Ctrl+Shift+Z` — undiscoverable, conflicts with browser redo on Mac. |
| **ThemeToggle** | 52×26px — **below 44px touch minimum**. Time-of-day default is unusual. |

**The #1 cross-cutting defect:** 14 of 16 VLM anomalies across the site are the floating dock + feedback tab overlapping content. This is the highest-impact fix in the brief.

---

## 2. The ONE cohesive redesign direction — "Editorial Ink"

### 2.1 Principles

1. **Warm, not white.** Keep the `#FAFAF8` warm off-white foundation. It signals "academic paper," not "generic SaaS dashboard." Dark mode keeps the `#111110` warm near-black.
2. **Ink as the single primary action.** Primary CTAs become near-black ink (`#1A1A18` / dark: `#F0EFEB`) with inverted text — the move premium editorial surfaces use. This **resolves orange overload** (orange stops being a CTA color and returns to being only the laser-rail brand flourish + feedback accent). Department accent colors stay **exclusively for data-coding** (exam cards, faculty depts, event types).
3. **Clarity beats decoration on data.** Data-dense views (timetable grid, exam schedule, rooms calendar, optimizer results) get **no decorative motion on data cells**, minimum 12px type, and denser-but-clearer grids. Decoration (serif headlines, gradient rails, scroll-reveal) lives only on heroes, section headers, and chrome.
4. **One depth language.** Three surface tiers (bg / raised / subtle) with a hairline border + 1px top-highlight (`border-inset`) + a single soft shadow family. No more ad-hoc `color-mix` translucency per page.
5. **Motion is a whisper, not a shout.** Keep staggered card entrances (they're good). Add a unified, IntersectionObserver-based scroll-reveal for sections. Remove the `animate-bounce` on FeedbackWidget. Reduce lost-found's simultaneous animation count. Everything respects `prefers-reduced-motion`.
6. **Serif discipline everywhere.** Instrument Serif returns to every page hero h1 (including lost-found, the current outlier). DM Sans for body, DM Mono for data/eyebrows/timestamps, JetBrains Mono for the clock.

### 2.2 Why this direction is "modern + catchy + credible for an academic tool"

- **Modern:** ink-primary CTAs, refined surface layering, and restrained scroll-reveal are the visual language of 2024–2026 premium product surfaces (Linear, Vercel, Stripe, Notion's marketing).
- **Catchy:** the purple→orange laser rail stays as a *signature* (header bottom border + hero accent), giving the site a recognizable brand mark that most university tools lack.
- **Credible:** warm neutrals + serif headlines + mono data read as "editorial / academic publication," not "consumer app." The restraint signals seriousness appropriate for exam schedules and academic calendars.

### 2.3 Dark mode — kept and refined (explicit argument)

The current dark mode is **already good** (warm `#111110`/`#1C1C1A`/`#242422`, proper text inversions, the laser rail shifts to gold→yellow). Dropping it would regress an existing, working feature. We **keep** dark mode and refine it: ensure all currently-hardcoded colors adapt (the ~15 leaks), tune dark shadows to be slightly more visible, and verify the ink-primary CTA inverts cleanly (dark button → light button). The `[data-theme]` selector + `prefers-color-scheme` fallback stays as-is.

---

## 3. Concrete design tokens

### 3.1 Color palette

**Surfaces (unchanged values, formalized usage):**
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-bg` | `#FAFAF8` | `#111110` | Page background |
| `--color-bg-raised` | `#FFFFFF` | `#1C1C1A` | Cards, inputs, dropdowns |
| `--color-bg-subtle` | `#F2F1EE` | `#242422` | Recessed panels, hover tracks, code blocks |
| `--color-border` | `rgba(0,0,0,.08)` | `rgba(255,255,255,.08)` | Default hairline |
| `--color-border-strong` | `rgba(0,0,0,.14)` | `rgba(255,255,255,.14)` | Focus / emphasis hairline |

**Text (unchanged):**
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-text-primary` | `#1A1A18` | `#F0EFEB` | Body, headings, **primary CTA bg (light)** |
| `--color-text-secondary` | `#6B6B66` | `#8C8C86` | Captions, meta |
| `--color-text-tertiary` | `#A0A09A` | `#5C5C58` | Placeholders, faint labels |

**NEW — primary action (ink):**
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-primary-action` | `#1A1A18` | `#F0EFEB` | Primary button bg / active nav |
| `--color-primary-action-fg` | `#FAFAF8` | `#111110` | Primary button text |
| `--color-primary-action-hover` | `#33332F` | `#FBFAF7` | Primary button hover (≈6% lighten) |

> Rationale: ink-primary replaces the scattered orange CTAs. Department accents (`--accent-cs`…`--accent-ce`) are **unchanged in value** and reserved strictly for data-coding. The laser-rail purple→orange (`--laser-rail-*`) stays as the header bottom-border brand flourish only.

**Department accents — dedup (minor):** 3 collisions weaken the data color key. We resolve by giving the colliding departments **distinct** hues (staying within their family):
- `--accent-bba`: shift from `#1D4ED8` (== cs) → `#2563EB` (a perceptibly distinct blue).
- `--accent-ba`: shift from `#D97706` (== cy `#B45309` family) → `#CA8A04` (yellow-gold, distinct from amber).
- `--accent-ft`: shift from `#9333EA` (== ai `#7C3AED` family) → `#C026D3` (fuchsia, distinct from purple).
- Each `-bg` soft variant recomputed to match.

**Tokenize the leaks (new vars, dark-mode-aware):**
| New token | Replaces hardcoded | Light | Dark |
|---|---|---|---|
| `--color-today` | events `#ff7a00`, mobile `#378ADD`, semester blue | `#1D4ED8` (accent-cs, unified) | `#60A5FA` |
| `--color-today-bg` | events today glow bg | `rgba(29,78,216,.08)` | `rgba(96,165,250,.16)` |
| `--color-success-strong` | lost-found `#16a34a`, `#10b981` | `#059669` (== accent-af, unified) | `#34D399` |
| `--color-urgent` | lost-found `bg-red-500` | `#E11D48` (== accent-ee) | `#FB7185` |
| `--color-linkedin` | `#0A66C2` | `#0A66C2` | `#7BB3F5` |
| `--color-whatsapp` | `#25D366` | `#25D366` | `#5FD98A` |
| `--color-timeline-line` | semester `#E5E7EB` | `rgba(0,0,0,.10)` | `rgba(255,255,255,.12)` |

### 3.2 Typography scale + pairing

**Pairing (unchanged, formalized):**
- **Display:** Instrument Serif — hero h1, month names, card names (faculty, lost-found item titles).
- **Body:** DM Sans — body copy, button labels, form labels, card body text.
- **Mono:** DM Mono — eyebrows, data, timestamps, counts, badges, DOW headers.
- **Clock:** JetBrains Mono — DesktopTicker only.

**Type scale (formalized; replaces ad-hoc `clamp()`/`text-[Npx]`):**
| Token | Size / line-height | Weight | Usage |
|---|---|---|---|
| `text-display-xl` | `clamp(2.4rem, 3.5vw, 3.6rem)` / 1.1 | 400 (serif) | Landing/Home/Events/Semester hero h1 |
| `text-display-lg` | `clamp(1.8rem, 2.6vw, 2.5rem)` / 1.15 | 400 (serif) | Calendar month names, detail drawer h2 |
| `text-display-md` | `text-xl` (20px) / 1.25 | 400 (serif) | Faculty card name, event day-detail h2 |
| `text-h1` | `text-2xl` (24px) / 1.3 | 700 (sans) | Lost-found hero h2 ( adopts serif→sans for board tone, OR serif — see mapping) |
| `text-h2` | `text-lg` (18px) / 1.35 | 600 (sans) | Section headers |
| `text-body` | `text-base` (16px) / 1.5 | 400 (sans) | Body |
| `text-body-sm` | `text-sm` (14px) / 1.45 | 400 (sans) | Secondary body, card descriptions |
| `text-caption` | `text-xs` (12px) / 1.4 | 500 (sans) | Captions, form hints |
| `text-eyebrow` | `text-xs` (12px) / 1.4 | 500 (mono) uppercase tracking-widest | Section eyebrows |
| `text-data` | `text-xs` (12px) / 1.4 | 500 (mono) | Data cells, timestamps, counts |
| `text-data-sm` | `text-[11px]` (11px) / 1.35 | 500 (mono) | Compact data (chips) — **new floor, replaces all 9–10px** |

**Hard rule:** No text below 11px anywhere. All existing `text-[9px]` / `text-[10px]` migrate to `text-data-sm` (11px) or `text-data` (12px).

### 3.3 Spacing scale (unchanged, formalized rhythm)

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40` (Tailwind `1`–`10`).

**Section rhythm (new convention):**
- Page outer padding: `px-5 md:px-8 lg:px-10` (mobile 20 / tablet 32 / desktop 40).
- Section vertical gap: `py-10 md:py-14` between top-level sections.
- Card padding: `p-4 md:p-5` (content cards) / `p-5 md:p-6` (form/detail cards).
- Card grid gap: `gap-4 md:gap-5` (data) / `gap-5 md:gap-6` (feature cards).
- **Bottom clearance for floating dock (desktop/tablet only):** `pb-28 md:pb-32` on pages with the dock; `pb-20` on mobile (dock hidden, but clears the FAB). Replaces inconsistent `pb-[150px]` / `pb-28` / `pb-24` / `h-[150px]`.

### 3.4 Border-radius system (unchanged values, formalized usage)

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Badges, small chips, inline pills |
| `--radius-md` | 10px | Buttons, inputs, select triggers |
| `--radius-lg` | 16px | Content cards, calendar cells, list items |
| `--radius-xl` | 24px | Hero containers, feature cards, detail drawers, stat cards |
| `--radius-full` | 9999px | Nav dock, FAB, avatar, toggle |

### 3.5 Shadow / elevation system (refined — slightly more pronounced for "catchy" depth)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(0,0,0,.06), 0 1px 4px rgba(0,0,0,.04)` | `0 1px 2px rgba(0,0,0,.30), 0 1px 4px rgba(0,0,0,.20)` | Default cards |
| `--shadow-raised` | `0 2px 6px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05)` → **`0 4px 12px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.05)`** | `0 4px 14px rgba(0,0,0,.40), 0 1px 3px rgba(0,0,0,.28)` | Hover state (replaces JS shadow-swap on FacultyCard) |
| `--shadow-float` | `0 8px 24px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.06)` → **`0 12px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)`** | `0 12px 40px rgba(0,0,0,.55), 0 2px 10px rgba(0,0,0,.35)` | Drawers, popovers, calendar panes |
| `--shadow-header` | (unchanged) | (unchanged) | Sticky header |
| `--shadow-pane-r` | (unchanged) | (unchanged) | Right-side drawers |
| `--border-inset` | `inset 0 1px 0 rgba(255,255,255,.65)` → **`.55`** (slightly subtler) | `inset 0 1px 0 rgba(255,255,255,.06)` | Top highlight on raised cards |

> Change: `--shadow-raised` and `--shadow-float` get ~30% more vertical throw in light mode for a more tactile, modern lift. Dark shadows gain slightly more opacity so elevation is perceptible.

### 3.6 Motion principles

1. **Card entrance stagger** (keep): `page-enter` 160–200ms fade+translateY(8px), 30ms stagger up to 10 items. Already in `globals.css` — keep, extend to faculty + lost-found grids (currently missing).
2. **Section scroll-reveal** (new): IntersectionObserver adds `.in-view` → `opacity 0→1, translateY(12px→0)` over 400ms with 60ms stagger for child groups. **Only on heroes, section headers, and non-data sections** — never on data cells/cards in timetable/schedule/rooms grids (clarity > decoration). Respects `prefers-reduced-motion` (reveals instantly).
3. **Hover** (refine): all interactive cards get `transition: box-shadow 200ms, border-color 200ms, transform 200ms` + `hover:-translate-y-[2px]` + `hover:shadow-raised`. **Replaces** FacultyCard's inline JS `onMouseOver/onMouseOut` shadow swap.
4. **Remove `animate-bounce`** on FeedbackWidget icon (no reduced-motion guard + distracting).
5. **Reduce lost-found animation density:** keep `motion.div layout` on ItemCards (useful for reordering) but **remove `cta-pulse-btn`** (2.5s glow loop) and **`stat-glow`** (3s pulse) — they're ambient noise. Keep `urgent-badge` pulse (it's semantically meaningful). Keep `skeleton-shimmer` (loading state).
6. **`prefers-reduced-motion: reduce`** → disable all entrance/scroll-reveal/hover-transform; keep only opacity transitions. (The existing guard at `globals.css:337` already partially does this — extend it to cover the new scroll-reveal.)
7. **Theme transition** (keep): `html { transition: background-color 200ms, color 200ms }` already present.

### 3.7 Component pattern conventions (formalized)

- **Primary button:** `bg-[var(--color-primary-action)] text-[var(--color-primary-action-fg)] hover:bg-[var(--color-primary-action-hover)] rounded-md px-5 h-11 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-text-primary)]/40`.
- **Secondary button:** `bg-bg-raised border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-bg-subtle rounded-md`.
- **Card:** `bg-bg-raised border border-[var(--color-border)] rounded-lg p-4 md:p-5 shadow-card [border-inset] transition hover:shadow-raised hover:-translate-y-[2px]`.
- **Input:** `bg-bg-raised border border-[var(--color-border-strong)] rounded-md h-11 px-3 text-base focus-visible:ring-2`.
- **Eyebrow:** `font-mono text-eyebrow text-[var(--color-text-tertiary)] uppercase tracking-widest`.
- **Focus ring:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]` (consistent, visible in both themes).

---

## 4. Mapping table — every proposed change → page + blueprint region

> "Non-goals" (§5) means: no route/IA changes, no business-logic/data changes. The table below is purely visual/CSS/token/structural-styling work.

| # | Proposed change | Page(s) | Blueprint region(s) affected | Files |
|---|---|---|---|---|
| T1 | Introduce `--color-primary-action` (+fg/+hover) ink tokens; retire orange as CTA color | ALL | All primary CTA regions | `globals.css`, `tailwind.config.ts` |
| T2 | Tokenize ~15 hardcoded colors (`--color-today`, `--color-success-strong`, `--color-urgent`, `--color-linkedin`, `--color-whatsapp`, `--color-timeline-line`) | events, semester, lost-found, faculty, schedule, rooms | EventsCalendar today cells; semester timeline line + today text; lost-found success/urgent/linkedin/whatsapp; FacultyCard linkedin; CountdownBadge; RoomPill | `globals.css` + each component |
| T3 | Dedup 3 department accents (bba→#2563EB, ba→#CA8A04, ft→#C026D3) + recompute `-bg` | ALL data views | Department-coded cards/pills | `globals.css` |
| T4 | Enforce 11px type floor; migrate all `text-[9px]`/`text-[10px]` → `text-data-sm`(11px) or `text-data`(12px) | timetable, timetable/custom, optimizer, semester, events, faculty, lost-found | Grid-view labels; sidebar row-editor; bundle-card actions; calendar cells/DOW; faculty HOD badge/office; lost-found badges/time-ago | each component |
| T5 | Unify "today" highlight to single `--color-today` (+bg) across events + semester | events, semester | EventsCalendar desktop+mobile cells; semester calendar today cell | `EventsCalendar.tsx`, `semester/page.tsx` |
| T6 | Make event chips **semantic** (by event type) not positional; add a legend | events | EventsCalendar chip palette | `EventsCalendar.tsx` |
| T7 | Fix floating-dock content overlap: responsive bottom clearance `pb-28 md:pb-32` (desktop/tablet) / `pb-20` (mobile); remove inconsistent `pb-[150px]`/`pb-24`/`h-[150px]` | timetable, timetable/custom, optimizer, schedule, custom, rooms, semester, events, faculty, lost-found | Bottom padding / dock-overlap regions | each `page.tsx` |
| T8 | Reposition FeedbackWidget tab so it stops obscuring content on mobile (raise above FAB zone, add `aria-label`, tokenize `bg-white/80`, remove `animate-bounce`) | ALL | FeedbackWidget region (right edge) | `FeedbackWidget.tsx` |
| T9 | Fix Header 4px mis-registration (`top-14`→`top-15` or header `h-15` 60px) | ALL | Header + sticky offsets | `Header.tsx`, sticky asides in semester/events/faculty/lost-found |
| T10 | Replace FacultyCard inline JS hover-shadow with CSS `transition` + `hover:shadow-raised` + `hover:-translate-y-[2px]` | faculty | FacultyCard grid/list | `FacultyCard.tsx` |
| T11 | Soften faculty photo-initials fallback (smaller, `text-2xl` on a subtler accent-tint, not `text-4xl font-bold`) | faculty | FacultyCard fallback | `FacultyCard.tsx` |
| T12 | Add per-dept count badges to mobile faculty dept strip | faculty | Mobile dept strip | `faculty/page.tsx` |
| T13 | Migrate emoji-as-icon (⚠️🧠🔒🚫✨📅📋∅🕌) → lucide-react icons | optimizer, timetable/custom, rooms, lost-found | Result badges; bundle actions; room pills; item fallbacks | each component |
| T14 | Adopt Instrument Serif for lost-found hero h2 (cross-page consistency) | lost-found | Hero region | `lost-found/page.tsx` |
| T15 | De-duplicate lost-found "REPORT AN ITEM" CTAs: keep hero + mobile fixed pill; restyle desktop inline `btn-shimmer` as a secondary "Quick report" link (not a 3rd primary) | lost-found | Hero CTA + desktop inline CTA | `lost-found/page.tsx` |
| T16 | Fix lost-found mobile FAB↔bottom-pill overlap (raise FAB above pill or hide FAB on lost-found list view) | lost-found | FloatingMenu + mobile sticky pill | `lost-found/page.tsx`, `FloatingMenu.tsx` (scoped) |
| T17 | Fix lost-found card title truncation → `line-clamp-2` (not `truncate`) | lost-found | ItemCard title | `lost-found/page.tsx` |
| T18 | Reduce lost-found motion density: remove `cta-pulse-btn` + `stat-glow`; keep `urgent-badge` + `skeleton-shimmer` | lost-found | Stats + CTAs | `globals.css`, `lost-found/page.tsx` |
| T19 | Add framer-motion/ CSS stagger entrance to faculty + lost-found card grids (currently missing) | faculty, lost-found | Card grids | `globals.css` (extend `.exam-card`-style stagger) |
| T20 | Add unified IntersectionObserver scroll-reveal for section headers/heroes (non-data) | ALL | Hero + section header regions | new `useScrollReveal` hook + `globals.css` `.in-view` |
| T21 | Fix admin login card contrast in light mode (raise opacity / add solid backing) | admin | Login card | `admin/page.tsx` |
| T22 | Sharpen `--shadow-raised` + `--shadow-float` ~30% (light) for modern lift; subtler `--border-inset` | ALL | All elevated surfaces | `globals.css` |
| T23 | Enforce consistent focus-visible ring across all interactive elements | ALL | All buttons/links/inputs | `globals.css` (base layer) |
| T24 | Landing: fix ragged feature-grid heights (`content-start`→`auto-rows-fr` or `items-stretch`) + add a single primary "Start here" affordance (ink-primary CTA on the largest/most-used card) | landing | RIGHT feature grid | `page.tsx` (landing) |
| T25 | Landing: fix DesktopTicker ghost-bleed (raise headline z-index / dim ticker when no userConfig) | landing, home | LEFT hero panel / DesktopTicker | `DesktopTicker.tsx`, `page.tsx` |
| T26 | Differentiate `/` hero from `/home` hero (vary the headline/eyebrow; avoid identical LEFT panel) | landing, home | LEFT hero panel | both `page.tsx` |
| T27 | Navbar: swap `<button>`→`<Link>` for prefetch; add `aria-current`; keep item set (IA non-goal) | ALL | Navbar dock | `Navbar.tsx` |
| T28 | ThemeToggle: enlarge touch target to ≥44px (wrap in a 44×44 hit area) | ALL | Header theme toggle | `ThemeToggle.tsx` |
| T29 | Semester: tokenize timeline line (`--color-timeline-line`) + today text (`--color-today`); fix hardcoded `#fff` | semester | KeyDatesSection timeline | `semester/page.tsx` |
| T30 | Events: unify mobile/desktop overflow-day opacity (0.6 both) | events | EventsCalendar cells | `EventsCalendar.tsx` |
| T31 | Timetable grid view: raise min type to 11px, relax `min-w-980px` to allow tablet reflow | timetable | Grid view | `timetable/page.tsx` |
| T32 | Preserve all print/export styles (`.print-area`, `@media print`) — verify nothing breaks | schedule, timetable, custom | Print regions | `globals.css` (no change, just verify) |

---

## 5. Non-goals (explicit)

1. **No route or IA changes.** The 13 routes stay. The 3-different-nav-item-sets (Navbar=5 / FloatingMenu=7 / Landing=8) is a known IA inconsistency but **out of scope** — we only fix the *visual* overlap and affordance, not which items appear where. COURSES→`/timetable/custom` label mismatch stays (IA decision for the owner).
2. **No business-logic or data changes.** No new API routes, no schema changes, no data fetching changes, no new features. The "missing conflict heatmap" in the optimizer is a feature gap — we will **not** build it (would be a feature addition). We will not add ICS export to semester (would be a feature). We only restyle existing affordances.
3. **No dependency or framework swaps.** Stays Next.js 14 + React 18 + Tailwind 3.4 + shadcn/ui + framer-motion + next-themes. No upgrade to Tailwind 4 or Next 16. No new UI library. (lucide-react is already a dependency — T13 uses existing deps.)
4. **No content/copy rewrites** beyond minimal label adjustments needed for accessibility (aria-labels).
5. **No removal of existing features** (FeedbackWidget, FloatingMenu, DesktopTicker, GlobalShortcuts all stay — only visually refined).
6. **No dark-mode removal** (argued to keep in §2.3).
7. **No changes to the `prebuild` exam-parser script** or build pipeline.

---

## 6. Optional generated assets (via image generation)

Lightweight, optimized, local. None are required; all are enhancements:

1. **Subtle paper-grain texture** (optional, hero backgrounds only) — a very faint noise/grain PNG at ~4% opacity, tiled, to reinforce the "editorial paper" feel on landing + home + semester + events heroes. ~2KB optimized. Would be generated via image-generation skill, stored in `public/textures/paper-grain.png`, applied as `background-image` on hero sections only. Respects `prefers-reduced-motion` (static, no motion).
2. **OG/social preview image** (optional) — a 1200×630 branded share image using the Instrument Serif wordmark + laser-rail motif, for `metadata.openGraph.images`. Currently the site has no OG image. Would be generated via image-generation skill.
3. **Favicon refinement** (optional) — current is `/public/logo/icon.png`. Could generate a refined monogram. Low priority.

> Decision deferred to implementation: I'll generate (1) and (2) only if they fit the "catchy but credible" bar and don't add weight. (3) is likely out of scope (existing favicon is fine).

---

## 7. What "done" looks like for Phase 3

- All 32 mapping-table items implemented on branch `redesign/ui-refresh-v1`.
- `npm run build` passes cleanly.
- Before/after Playwright screenshots at 1440/834/390 for every changed page, saved to `docs/redesign-preview/<page>/`.
- WCAG AA contrast verified programmatically for all new text/bg pairs (ink-on-cream, ink-on-white, white-on-ink, accent-on-cream, etc.).
- `CHANGES_SUMMARY.md` produced.
- No routes/logic/data behavior changed (verifiable in diff).
- `prefers-reduced-motion` respected everywhere.

---

**Awaiting your explicit approval (or requested changes) before proceeding to Phase 3 implementation.**
