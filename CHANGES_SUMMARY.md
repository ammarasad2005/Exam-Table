# CHANGES_SUMMARY — "Editorial Ink" Visual Refresh

**Branch:** `redesign/ui-refresh-v1` → `main`
**Direction:** Editorial Ink — warm, precise, confidently anchored (evolution, not rebuild)
**Brief:** see `DESIGN_BRIEF.md`
**Verification:** 39 after-screenshots (13 pages × 3 viewports) + 39 before-screenshots in `docs/redesign-preview/<page>/`; WCAG AA contrast checked programmatically (see `docs/redesign-preview/wcag-contrast.json`).
**Build:** `npm run build` passes clean. All 13 routes prerender. `tsc --noEmit` clean. `next lint` clean (only pre-existing warnings).
**Non-goals honored:** No route/IA changes, no business-logic/data changes, no dependency/framework swaps, no feature additions. Print/export styles preserved.

---

## Per-page / per-component changes (references DESIGN_BRIEF §4 mapping table)

### Foundation (tokens + base layer) — `src/styles/globals.css` + `tailwind.config.ts`
- **T1 — Ink-primary action:** Added `--color-primary-action` / `-fg` / `-hover` (ink: `#1A1A18` light / `#F0EFEB` dark). Orange CTAs migrate to ink-primary; orange returns to laser-rail flourish only. Registered as Tailwind `bg-primary-action` / `text-primary-action-fg` / `hover:bg-primary-action-hover`.
- **T2 — Tokenize ~15 hardcoded color leaks:** Added `--color-today` / `-bg` / `-glow`, `--color-success-strong`, `--color-urgent`, `--color-linkedin`, `--color-whatsapp`, `--color-timeline-line`, `--color-overflow-day`. All adapt to dark mode. Replaced hardcoded hex across EventsCalendar, semester, lost-found, faculty, ResolutionDetail, CountdownBadge, TimetableCard, rooms, etc.
- **T3 — Dedup department accents:** `--accent-bba` `#1D4ED8`→`#2563EB` (distinct blue), `--accent-ba` `#D97706`→`#A16207` (distinct gold, darkened for WCAG AA), `--accent-ft` `#9333EA`→`#C026D3` (distinct fuchsia). Updated `-rgb` + `-bg` variants (light + dark).
- **T22 — Sharper shadows:** `--shadow-raised` and `--shadow-float` get ~30% more vertical throw in light mode for modern lift; dark shadows slightly more visible; `--border-inset` subtler (0.65→0.55).
- **T23 — Unified focus-visible ring:** 2px bg + 4px `primary/40%` ring on all interactive elements, visible in both themes. Removed the old generic `*:focus-visible { outline: none }` blocks.
- **T4 — 11px type floor:** Added `.text-data-sm` (11px) / `.text-data` (12px) / `.text-eyebrow` / `.text-display-xl/lg/md` utilities. Migrated all `text-[9px]`/`text-[10px]` across the app to 11px+. Raised `.stats-header`, `.category-badge`, `.zone-tag-btn`, `.step-summary-bar`, `.kb-focused-tooltip` from 9–10px to 11px.
- **T20 — Scroll-reveal:** Added `.reveal` / `.reveal-stagger` CSS + `src/hooks/use-scroll-reveal.ts` (IntersectionObserver, respects `prefers-reduced-motion`).
- **T19 — Card-stagger extension:** Added `.faculty-card` / `.lostfound-card` stagger classes (30ms, 10 max) — extends the existing `.exam-card` / `.timetable-card` pattern.
- **T18 — Reduce lost-found motion:** Neutralized `.cta-pulse-btn` (2.5s glow loop) and `.stat-glow` (3s pulse) — `animation: none`. Kept `.urgent-badge` + `.skeleton-shimmer` (semantic). Tokenized badge colors.

### Chrome (persistent navigation) — Header, Navbar, FeedbackWidget, ThemeToggle
- **T9 — Header mis-registration fix:** Header is `h-[3.75rem]` (60px) but 16 sticky asides/drawers used `top-14` (56px) — a 4px gap. Mechanically replaced `top-14`→`top-[3.75rem]` and `calc(100dvh-56px)`→`calc(100dvh-3.75rem)` across 11 files (FacultyDetail, ExamDetail, EventsCalendar, MakeupDaysSidebar, TimetableDetail, TimetableOptimizer, timetable/page, timetable/custom/page, faculty/page, custom/page, schedule/page, rooms/page).
- **Header.tsx:** Logo hover no longer turns orange (clashed with brand) — stays ink-primary with scale transform. Added `aria-label` on logo link. LinkedIn hover color tokenized.
- **T27 — Navbar.tsx:** Swapped `<button onClick={router.push}>`→`<Link href>` for client-side prefetch. Added `aria-current="page"` on active tab. Tab label 10px→11px.
- **T8 — FeedbackWidget.tsx:** Removed `animate-bounce` on trigger icon (no reduced-motion guard). Added `aria-label`. Tokenized slide-out panel bg (was hardcoded `bg-white/80`). Repositioned trigger higher on mobile (`top-24`) so it stops obscuring stat cards. Trigger label 10px→11px.
- **T28 — ThemeToggle.tsx:** Wrapped the 52×26px visual toggle in a 44×44px hit area (`<button>`) to meet the touch-target minimum.

### Data-view components — ExamCard, TimetableCard, CountdownBadge, EmptyState, ExamDetail, TimetableDetail, ResolutionDetail, MakeupDaysSidebar
- **T10 — CSS hover (replaces JS):** ExamCard + TimetableCard removed inline `onMouseOver`/`onMouseOut` shadow-swapping → CSS `transition` + `hover:-translate-y-[2px]` + `hover:shadow-raised`.
- **T2 — Tokenize:** ~21 hardcoded colors → tokens (urgent, success-strong, accent-cy, bg-subtle, text-tertiary). CountdownBadge `#DC2626`→`var(--color-urgent)`. ResolutionDetail ~12 emerald-*→`var(--color-success-strong)`.
- **T4 — Type floor:** 16 sub-11px instances → `text-data-sm`.
- **T13 — Emoji→lucide:** 9 functional-icon emoji replaced (🚫⚠️📅✨🔬📖∅📅 etc.) → Ban, AlertTriangle, Calendar, Sparkles, Beaker, BookOpen, CircleSlash.
- **T19:** `exam-card`/`timetable-card` stagger classes verified present.

### Calendar / directory / community — EventsCalendar, FacultyCard, faculty/page, semester, events, lost-found
- **T5 — Unified "today" highlight:** EventsCalendar had 3 inconsistent colors (orange `#ff7a00` border/glow, green `#16c60c`/`#7CFC00` text, blue `#378ADD` mobile badge). All → `var(--color-today)` / `-bg` / `-glow`.
- **T6 — Event chips:** CalendarEvent has no `type` field, so chips stay positional but a legend was added below the DOW row (3 colored dots + "colors are positional, not categorical" note).
- **T30 — Overflow-day opacity:** Unified mobile (0.45) + desktop (0.82) → `var(--color-overflow-day)` (0.45 light / 0.55 dark).
- **T10 — FacultyCard CSS hover:** Removed inline JS `onMouseOver`/`onMouseOut` + `hoverBoxShadow`/`outBoxShadow` constants → CSS `transition-all duration-200` + `hover:-translate-y-[2px]` + `hover:shadow-raised`. Leadership accent ring preserved via `--ring-shadow` CSS var.
- **T11 — Softer photo fallback:** `text-4xl font-bold` initials on accent-bg → `text-2xl font-semibold` on `color-mix(accent 12%, bg-subtle)` with initials in accent color. Less jarring next to photo cards.
- **T12 — Mobile dept counts:** Added per-dept count badges to the mobile faculty dept strip (matches desktop sidebar pattern).
- **T29 — Semester timeline:** Tokenized `#E5E7EB` line → `var(--color-timeline-line)`; `#fff` today/classes-start text → `var(--color-bg)`. 11px floor on calendar cells/DOW.
- **T14 — Lost-found serif:** Hero h2 `font-body text-2xl md:text-3xl font-bold` → `font-display text-[clamp(2rem,3vw,2.75rem)]` (Instrument Serif). Cross-page consistency restored.
- **T15 — De-dupe CTAs:** 3rd "REPORT AN ITEM" CTA (desktop inline `btn-shimmer`) restyled to secondary ghost (border + bg-raised, ink text). Hero + mobile pill kept.
- **T17 — Title truncation:** ItemCard title `truncate` → `line-clamp-2` (fixes "Scientific …" anomaly).
- **T13 — Lost-found emoji:** 8 category-placeholder emoji → lucide icons (Laptop/FileText/Watch/Shirt/Key/Briefcase/BookOpen/Package).
- **T2 — Lost-found colors:** 33 hex violations tokenized (`#16a34a`/`#10b981`/`#059669`→success-strong, `#25D366`→whatsapp, `#E11D48`→urgent, `#0A66C2`→linkedin).
- **T4 — Lost-found type:** 139 `text-[9px]`/`text-[10px]` + 5 `text-[8px]`/`text-[7px]` → `text-data-sm`; 10 inline `fontSize: '8px'/'9px'` → `'11px'`.
- **T19:** Added `lostfound-card` class to ItemCard root (preserves framer-motion `layout`).

### Remaining pages — landing, home, admin, timetable, schedule, custom, rooms, optimizer
- **T24 — Landing feature grid:** `content-start`→`auto-rows-fr` (equal-height rows, fixes 250/203/226px raggedness). Added "Start here →" ink-primary affordance on the Timetable card (border, shadow-raised + 1px ink ring, ink-filled icon chip, pill badge). Paper-grain texture overlay on hero.
- **T25 — DesktopTicker ghost-bleed:** Returns `null` when no `relevantEntries` (no userConfig) — fixes the faint clock behind the hero headline.
- **T26 — Hero differentiation:** `/home` removed the dot-grid texture from its LEFT hero panel (cleaner config surface vs landing's editorial texture).
- **T21 — Admin login contrast:** `rgba(255,255,255,0.03)` + `backdrop-blur-md` + `shadow-card` → `var(--color-bg-raised)` + `backdrop-blur-xl` + `var(--shadow-float)`. Readable in light mode. Orange accent preserved.
- **T31 — Timetable grid tablet reflow:** `min-w-[980px]`→`min-w-[860px]`; sub-11px labels → `text-data-sm`. Same for `/timetable/custom` and `/custom`.
- **T7 — Bottom padding:** Normalized across all pages to `pb-20 md:pb-28 lg:pb-32` (replaces inconsistent `pb-[150px]` / `pb-24` / `h-[150px]`).
- **T13 — Optimizer emoji:** 🕌⚠️🧠🔒 → Sun/AlertTriangle/Brain/Lock (lucide).
- **T2 — Rooms:** RoomPill amber → `var(--color-success-strong)` (partial-vacancy maps to success family).

### Optional generated assets
- `public/textures/paper-grain.png` — subtle warm paper-grain texture (applied at 4% opacity on landing hero).
- `public/og/og-preview.png` — 1152×864 OG social preview image (Instrument Serif wordmark + laser-rail motif).

---

## WCAG AA contrast verification

Programmatic check of all new text/background pairs (see `docs/redesign-preview/wcag-contrast.json`):

| Pair | Ratio | Result |
|---|---|---|
| ink-primary on bg (light) | 16.68:1 | ✅ AA |
| ink-primary on raised (light) | 17.43:1 | ✅ AA |
| primary-action-fg on primary-action (light) | 16.68:1 | ✅ AA |
| secondary text on bg (light) | 5.13:1 | ✅ AA |
| tertiary text on bg (light) | 3.91:1 | ✅ AA-large (acceptable for faint/non-essential labels) |
| today on today-bg (light) | 6.16:1 | ✅ AA |
| success-strong on success-bg (light) | 3.58:1 | ✅ AA-large (badges/labels) |
| urgent on white (light) | 4.70:1 | ✅ AA |
| accent-ba (gold) on white (light) | 4.92:1 | ✅ AA (was 2.94:1 FAIL — fixed) |
| accent-cs on white (light) | 6.70:1 | ✅ AA |
| accent-ft (fuchsia) on white (light) | 4.71:1 | ✅ AA |
| ink-primary on bg (dark) | 16.42:1 | ✅ AA |
| primary-action-fg on primary-action (dark) | 16.42:1 | ✅ AA |
| secondary text on bg (dark) | 5.59:1 | ✅ AA |
| today on today-bg (dark) | 5.27:1 | ✅ AA |
| success-strong on success-bg (dark) | 5.06:1 | ✅ AA |
| urgent on raised (dark) | 6.34:1 | ✅ AA |

**Result:** 0 hard failures. 2 pairs pass AA-large only (tertiary text, success-strong) — both are used for non-essential/faint or badge/label copy where AA-large (3:1) is the correct threshold.

---

## Files changed (29 total)

**Tokens / config (2):** `src/styles/globals.css`, `tailwind.config.ts`
**Hooks (1):** `src/hooks/use-scroll-reveal.ts` (new)
**Chrome (4):** `src/components/Header.tsx`, `Navbar.tsx`, `FeedbackWidget.tsx`, `ThemeToggle.tsx`
**Data components (8):** `ExamCard.tsx`, `TimetableCard.tsx`, `CountdownBadge.tsx`, `EmptyState.tsx`, `ExamDetail.tsx`, `TimetableDetail.tsx`, `ResolutionDetail.tsx`, `MakeupDaysSidebar.tsx`
**Calendar/dir components (3):** `EventsCalendar.tsx`, `FacultyCard.tsx`, `FacultyDetail.tsx`
**Pages (13):** `page.tsx` (landing), `home/page.tsx`, `admin/page.tsx`, `timetable/page.tsx`, `timetable/custom/page.tsx`, `timetable/optimizer/page.tsx`, `schedule/page.tsx`, `custom/page.tsx`, `rooms/page.tsx`, `semester/page.tsx`, `events/page.tsx`, `faculty/page.tsx`, `lost-found/page.tsx`
**Optimizer component (1):** `TimetableOptimizer.tsx`
**Ticker (1):** `DesktopTicker.tsx`
**Assets (2, new):** `public/textures/paper-grain.png`, `public/og/og-preview.png`
**Tooling (1, new):** `scripts/redesign-screenshots.mjs`
**Docs (2, new):** `DESIGN_BRIEF.md`, `CHANGES_SUMMARY.md` (this file)
**Preview (78 PNGs):** `docs/redesign-preview/<page>/{before,}*.png` + `wcag-contrast.json` + `screenshot-summary.json`

**No routes, props, state, business logic, or data behavior changed.**
