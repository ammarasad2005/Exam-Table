# Class Timetable Finder — Extension Design Document

## 1. System Design & Architecture

### High-Level Integration Map

The timetable feature slots in as a parallel vertical alongside the exam finder, sharing the same data pipeline pattern: a static JSON file generated at build time from an Excel source, served via a Next.js API route, and consumed by React components that reuse the existing design system.

```
exam_schedule.xlsx          class_timetable.xlsx
       │                            │
scripts/parse-excel.ts     scripts/parse-timetable.ts  ← NEW
       │                            │
public/data/schedule.json  public/data/timetable.json  ← NEW
       │                            │
src/app/api/schedule/      src/app/api/timetable/       ← NEW
       │                            │
src/app/schedule/          src/app/timetable/           ← NEW
src/app/custom/            src/app/timetable/custom/    ← NEW
```

The key architectural principle is that nothing in the existing exam flow changes. The timetable feature is additive.

### Backend Changes

**New API route** at `src/app/api/timetable/route.ts`:

```typescript
// src/app/api/timetable/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { TimetableEntry } from '@/lib/types';

const timetable = require('../../../../public/data/timetable.json');

export const runtime = 'edge';

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const batch  = searchParams.get('batch');
  const dept   = searchParams.get('dept')?.toUpperCase();
  const section = searchParams.get('section')?.toUpperCase();

  if (!batch || !dept || !section) {
    return NextResponse.json(
      { error: 'batch, dept, and section required' },
      { status: 400 }
    );
  }

  const filtered = (timetable as TimetableEntry[]).filter(
    e => e.batch === batch &&
         e.department === dept &&
         e.section === section
  );

  return NextResponse.json(filtered, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

The school filter (`FSC` only) is enforced at the UI layer — the API does not need to filter by school since the timetable JSON will only contain FSC data to begin with.

### New Type Definitions

Add to `src/lib/types.ts`:

```typescript
export interface TimetableEntry {
  courseCode: string;    // "CS1004"
  courseName: string;    // "Programming Fundamentals"
  batch: string;         // "2023"
  department: string;    // "CS"
  section: string;       // "A", "B", "BX" etc.
  day: string;           // "Monday"
  startTime: string;     // "08:00 AM"
  endTime: string;       // "09:30 AM"
  room: string;          // "CR-01", "LT-2"
  instructor: string;    // "Dr. Ahmed"
  type: 'lecture' | 'lab';
  school: string;        // "FSC"
}

export const SECTIONS = ['A', 'B', 'C', 'BX'];

export const DAYS_ORDER = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

export const TIME_SLOTS = [
  '08:00 AM', '09:30 AM', '11:00 AM',
  '12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM'
];
```

### Data Flow

```
User selects batch + dept + section
        │
        ▼
TimetableSetupPage validates input
        │
        ▼
router.push('/timetable?batch=2023&dept=CS&section=A')
        │
        ▼
TimetablePageInner reads searchParams
        │
        ▼
useMemo filters timetable.json (client-side, same pattern as exam finder)
        │
        ▼
filterTimetable() returns TimetableEntry[]
        │
        ▼
groupByDay() organises into day buckets
        │
        ▼
<TimetableGrid /> or <TimetableList /> renders result
```

---

## 2. Feature Breakdown — Step-by-Step Implementation Plan

### Phase 1: Data Layer (Days 1–2)

**Task 1.1** — Create `scripts/parse-timetable.ts`. This mirrors `parse-excel.ts` but targets the timetable Excel file. The timetable sheet structure will likely have days as row groups and time slots as column headers, or a flat row-per-class format. The parser must output `timetable.json` into `public/data/`.

**Task 1.2** — Add the `prebuild` hook to also run the timetable parser:

```json
"prebuild": "ts-node scripts/parse-excel.ts && ts-node scripts/parse-timetable.ts"
```

**Task 1.3** — Add `TimetableEntry` to `src/lib/types.ts` as shown above.

**Task 1.4** — Create `src/lib/timetable-filter.ts`:

```typescript
import type { TimetableEntry } from './types';
import { DAYS_ORDER } from './types';

export interface TimetableFilter {
  batch: string;
  department: string;
  section: string;
  query: string;
}

export function filterTimetable(
  entries: TimetableEntry[],
  filter: TimetableFilter
): TimetableEntry[] {
  const q = filter.query.toLowerCase().trim();
  return entries.filter(e => {
    if (e.batch !== filter.batch) return false;
    if (e.department !== filter.department) return false;
    if (e.section !== filter.section) return false;
    if (q && !e.courseCode.toLowerCase().includes(q) &&
             !e.courseName.toLowerCase().includes(q) &&
             !e.room.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function groupByDayTimetable(
  entries: TimetableEntry[]
): { day: string; entries: TimetableEntry[] }[] {
  const map = new Map<string, TimetableEntry[]>();
  for (const day of DAYS_ORDER) map.set(day, []);
  for (const e of entries) {
    if (map.has(e.day)) map.get(e.day)!.push(e);
  }
  // Sort each day's entries by start time
  for (const [, dayEntries] of map) {
    dayEntries.sort((a, b) =>
      parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
    );
  }
  return [...map.entries()]
    .filter(([, entries]) => entries.length > 0)
    .map(([day, entries]) => ({ day, entries }));
}

export function detectConflicts(entries: TimetableEntry[]): Set<string> {
  const conflicting = new Set<string>();
  const byDay = new Map<string, TimetableEntry[]>();
  for (const e of entries) {
    if (!byDay.has(e.day)) byDay.set(e.day, []);
    byDay.get(e.day)!.push(e);
  }
  for (const [, dayEntries] of byDay) {
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        if (overlaps(dayEntries[i], dayEntries[j])) {
          conflicting.add(makeKey(dayEntries[i]));
          conflicting.add(makeKey(dayEntries[j]));
        }
      }
    }
  }
  return conflicting;
}

function overlaps(a: TimetableEntry, b: TimetableEntry): boolean {
  const aStart = parseTimeToMinutes(a.startTime);
  const aEnd   = parseTimeToMinutes(a.endTime);
  const bStart = parseTimeToMinutes(b.startTime);
  const bEnd   = parseTimeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

function makeKey(e: TimetableEntry): string {
  return `${e.day}|${e.startTime}|${e.courseCode}|${e.section}`;
}

export function parseTimeToMinutes(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p = m[3].toUpperCase();
  if (p === 'PM' && h < 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}
```

### Phase 2: API Route (Day 2)

**Task 2.1** — Create `src/app/api/timetable/route.ts` (shown above).

### Phase 3: Pages & Components (Days 3–6)

**Task 3.1** — Extend `src/app/page.tsx` to add a timetable entry point on the home page (described fully in Section 4).

**Task 3.2** — Create `src/app/timetable/page.tsx` — results page.

**Task 3.3** — Create `src/app/timetable/custom/page.tsx` — custom course timetable builder.

**Task 3.4** — Create `src/components/TimetableCard.tsx`.

**Task 3.5** — Create `src/components/TimetableGrid.tsx`.

**Task 3.6** — Create `src/components/TimetableDetail.tsx`.

**Task 3.7** — Extend `src/lib/export.ts` with timetable export functions.

### Phase 4: Testing & Polish (Days 7–8)

**Task 4.1** — Verify parser handles all real timetable Excel formats.

**Task 4.2** — Test conflict detection with synthetic overlapping data.

**Task 4.3** — Cross-device visual QA (mobile bottom-sheet, desktop sidebar).

**Task 4.4** — Accessibility audit (keyboard navigation, aria labels, focus management).

---

## 3. Data Handling Strategy

### Timetable JSON Structure

Each row in `timetable.json` represents a single class slot:

```json
[
  {
    "courseCode": "CS1004",
    "courseName": "Programming Fundamentals",
    "batch": "2023",
    "department": "CS",
    "section": "A",
    "day": "Monday",
    "startTime": "08:00 AM",
    "endTime": "09:30 AM",
    "room": "CR-01",
    "instructor": "Dr. Ahmed",
    "type": "lecture",
    "school": "FSC"
  }
]
```

### Excel Parser Strategy

Timetable sheets at FAST typically use one of two layouts. The parser handles both:

**Layout A — Flat rows** (one row per class slot):

```
| Course | Section | Day | Start | End | Room | Instructor |
```

The parser reads row by row, extracts the course code from the first token using the same regex already in `parse-excel.ts`, and builds entries directly.

**Layout B — Grid layout** (days as columns, time slots as rows):

```
Time     | Monday        | Tuesday  | Wednesday
08:00 AM | CS1004 A CR01 | ...      | ...
09:30 AM | ...           | ...      | ...
```

The parser iterates the time-slot rows and day columns, applying the same merged-cell expansion already built in `parse-excel.ts`. The cell content (course code, section, room) is parsed with a positional regex.

### Conflict Handling

Conflicts arise only in the custom course builder, where a student manually combines courses from different sections. The `detectConflicts()` function returns a `Set<string>` of entry keys. Components check this set and apply a visual warning badge rather than blocking the selection — the student may legitimately have a schedule variance approved by the department.

### Missing Data

When a field is absent the parser falls back to safe defaults: `room: 'TBA'`, `instructor: 'TBA'`, `type: 'lecture'`. These entries are still displayed but carry a subtle `TBA` badge so students know to verify with the department portal.

---

## 4. UI/UX Design

### 4.1 Home Page Extension

The existing home page (`src/app/page.tsx`) already has a Mode selector (`Default Courses` / `Custom Courses`) and a CTA button. The extension adds a **Feature Selector** above the Mode selector, using the same two-button toggle pattern already established.

**New element — Feature Selector (added to both mobile and desktop form):**

```
┌─────────────────────────────────────┐
│  FEATURE                            │
│  ┌──────────────┐ ┌──────────────┐  │
│  │  Exam Finder │ │  Timetable   │  │
│  └──────────────┘ └──────────────┘  │
└─────────────────────────────────────┘
```

Same styling as the existing Mode selector — one pill filled with `var(--color-text-primary)` for the selected state, bordered for the unselected state. State is held in a new `feature: 'exams' | 'timetable'` useState.

When `feature === 'timetable'`, an additional **Section** selector appears between Department and the CTA:

```
┌─────────────────────────────────────┐
│  SECTION                            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  │ A  │ │ B  │ │ C  │ │ BX │        │  ← DepartmentPill reused
│  └────┘ └────┘ └────┘ └────┘        │
└─────────────────────────────────────┘
```

The CTA button changes its label to `View my timetable →` and routes to `/timetable?batch=…&dept=…&section=…`.

No existing markup is removed. The feature selector is prepended to the shared form, and the section field renders conditionally when `feature === 'timetable'`.

### 4.2 Timetable Results Page (`/timetable`)

**Header** — identical structure to `/schedule` header:

```
┌────────────────────────────────────────────────────┐
│ ← │ [CS] Batch 2023 · Section A   │ ☀/🌙 │ Export │
└────────────────────────────────────────────────────┘
```

**Desktop sidebar** — mirrors the exam schedule sidebar:

```
┌──────────────┐
│ Batch        │
│ 2023         │
│              │
│ Department   │
│ CS           │
│              │
│ Section      │
│ A            │
│ ─────────    │
│ Found        │
│ 32           │
│ class slots  │
│              │
│ [View]       │  ← toggle between list and grid view
│ ─────────    │
│ Change…      │
│ Export ↓     │
└──────────────┘
```

**View Toggle** — the timetable results page offers two view modes, toggled by a two-button control in the sidebar (desktop) or below the search bar (mobile):

```
┌─────────────────┐
│ [List] [Grid]   │
└─────────────────┘
```

**List View** — identical to the exam schedule's `groupByDay` layout. Each day is a section heading, beneath which `TimetableCard` components render in a responsive grid.

**Grid View** — a weekly time-grid view unique to the timetable feature. Days are columns, time slots are rows:

```
         Mon      Tue      Wed      Thu      Fri
08:00  ┌──────┐         ┌──────┐
       │CS1004│         │CS1004│
       │CR-01 │         │CR-01 │
09:30  └──────┘ ┌──────┐└──────┘
                │CS2003│
                │LT-2  │
11:00           └──────┘
```

Each cell is a mini `TimetableCard`. Empty cells are transparent. Conflicts render in red. On mobile, the grid view is simplified to a horizontal scroll with sticky time labels on the left.

**Search bar** — identical to exam finder's `SearchBar` component, same position, same styling.

### 4.3 TimetableCard Component

Mirrors `ExamCard` in structure:

```
┌───────────────────────────────────┐
│ [CS1004]              [Lecture]   │  ← accent pill + type badge
│ Programming Fundamentals          │  ← course name
│ 08:00 AM – 09:30 AM               │  ← time range
│ Room CR-01 · Dr. Ahmed            │  ← room + instructor
└───────────────────────────────────┘
```

**Props:**
```typescript
interface TimetableCardProps {
  entry: TimetableEntry;
  dept: string;
  conflicting?: boolean;
  onClick: () => void;
}
```

When `conflicting` is true, the card gains a red left border (`border-l-2 border-red-400`) and a small `⚠ Conflict` badge replaces the type badge.

### 4.4 TimetableDetail Component (Bottom Sheet / Side Panel)

Mirrors `ExamDetail` exactly. Shows:

```
┌──────────────────────────────────┐
│ — (drag handle, mobile only)     │
│                                  │
│ [CS1004]                    ✕   │
│ Programming Fundamentals         │
│                                  │
│ ┌────────────────────────────┐   │
│ │ Day         Monday         │   │
│ │ Time        08:00–09:30 AM │   │
│ │ Room        CR-01          │   │
│ │ Instructor  Dr. Ahmed      │   │
│ │ Type        Lecture        │   │
│ │ Section     A              │   │
│ └────────────────────────────┘   │
│                                  │
│ [Add to calendar (.ics)]         │
└──────────────────────────────────┘
```

The existing `ExamDetail` component can be nearly duplicated with a different field set. A refactor to a shared `DetailSheet` with a `fields` prop is recommended (see Section 5).

### 4.5 Custom Timetable Builder (`/timetable/custom`)

This page mirrors `/custom` (the custom exam finder). The `RowEditor` sub-component gains a `section` field between `stream` and `code`:

```
┌────────────────────────────────────────────────┐
│ Course 1                          [2 slots ✓]  │
│                                                │
│ [Batch▼]  [Stream▼]  [Section▼]  [Course▼]    │
└────────────────────────────────────────────────┘
```

The section dropdown is populated from the available sections in the data for the selected batch+stream combination. Logic to detect conflicts across rows is applied via `detectConflicts()` and surfaced as a dismissible banner above the results:

```
┌────────────────────────────────────────────────┐
│ ⚠  2 time conflicts detected. Affected classes │
│    are highlighted below.           [Dismiss]  │
└────────────────────────────────────────────────┘
```

### 4.6 Typography & Color Consistency

No new CSS variables are introduced. The timetable feature uses the same accent colours already defined for each department. The `type` badge (Lecture/Lab) uses existing subtle styles:

- Lecture: `var(--color-bg-subtle)` background, `var(--color-text-secondary)` text
- Lab: `var(--accent-ds-bg)` background, `var(--accent-ds)` text (a teal that reads well as "practical")

---

## 5. Reusability

### Components that can be used as-is

| Component | Reuse in Timetable |
|-----------|-------------------|
| `SearchBar` | Direct import, no changes |
| `ThemeToggle` | Direct import, no changes |
| `ExportButton` | Direct import; timetable entries passed as `entries` prop |
| `DepartmentPill` | Reused for section selection with minor label changes |
| `CountdownBadge` | Not applicable (timetable is recurring, not date-specific) |
| `EmptyState` | Direct import with appropriate prop values |

### Components to refactor into shared base

**`DetailSheet`** — extract the shared bottom-sheet/side-panel shell from `ExamDetail` and `TimetableDetail`:

```typescript
// src/components/DetailSheet.tsx
interface DetailSheetProps {
  title: string;
  subtitle: string;                    // course code pill
  accentColor: string;
  accentBg: string;
  fields: { label: string; value: string }[];
  callout?: React.ReactNode;
  actions?: React.ReactNode;
  onClose: () => void;
}
```

Both `ExamDetail` and `TimetableDetail` become thin wrappers that assemble `fields` and call `<DetailSheet />`.

### Shared Library Functions

| Function | Location | Reuse |
|----------|----------|-------|
| `sortByChronological` | `src/lib/dates.ts` | Reused for timetable day sorting |
| `parseTimeToMinutes` | New in `timetable-filter.ts` | Export and import in `dates.ts` to DRY up |
| `groupByDay` | `src/lib/filter.ts` | Rename to `groupEntriesByDay` and make generic, accept both entry types |
| `downloadCSV` / `downloadXLSX` | `src/lib/export.ts` | Extend with timetable-specific column definitions |
| `generateICS` | `src/lib/export.ts` | Extend to generate recurring weekly events (`RRULE:FREQ=WEEKLY;BYDAY=MO`) |

### Shared Logic: Exam vs Timetable ICS Export

The exam ICS generates a one-time all-day event. The timetable ICS should generate recurring weekly events for the semester. Add to `src/lib/export.ts`:

```typescript
export function downloadTimetableICS(entries: TimetableEntry[]): void {
  const DAY_MAP: Record<string, string> = {
    Monday: 'MO', Tuesday: 'TU', Wednesday: 'WE',
    Thursday: 'TH', Friday: 'FR'
  };
  // Generate VEVENT with RRULE:FREQ=WEEKLY for each entry
  // DTSTART as the first occurrence of that weekday in the semester
  // UNTIL as the last day of semester
}
```

---

## 6. Edge Cases & Validation

### Input Validation

The setup page disables the CTA until batch, department, and section are all selected — identical to how the exam finder disables until batch, school, and department are chosen. No additional validation needed at the API layer since the data is static JSON.

### No Timetable Found

The existing `EmptyState` component handles this with the message customised to context:

```typescript
<EmptyState
  query={query}
  batch={batch}
  dept={dept}
  message={
    query
      ? `No classes matching "${query}" for ${dept} ${section}, Batch ${batch}.`
      : `No timetable found for ${dept} Section ${section}, Batch ${batch}. The timetable may not yet be available — check back after the semester begins.`
  }
/>
```

### Partial Schedules

When only some days have data (common early in a semester), the `groupByDayTimetable` function skips empty days rather than rendering empty day sections. A persistent info banner appears at the top of results:

```
┌────────────────────────────────────────────────┐
│ ℹ  Showing 3 of 5 days. Some classes may not   │
│    yet be scheduled. Last updated: [date].     │
└────────────────────────────────────────────────┘
```

The last-updated date is embedded in the JSON by the parser at build time.

### Custom Course Conflicts

As described in Section 4.5, conflicts are detected and flagged visually but do not block saving. The user must acknowledge the conflict banner before exporting, surfaced as a disabled export button that becomes active only after the user checks a confirmation checkbox:

```
☐ I understand these courses have overlapping times
```

### Invalid Section for Batch/Department Combination

Sections are filtered dynamically from the timetable data based on the selected batch and department. If the data contains no entries for a combination, the section dropdown shows `No sections available` as a disabled placeholder and the CTA remains disabled. This prevents dead-end navigation.

### Room Listed as TBA

Cards with `room: 'TBA'` render a subdued `Room TBA` label in `var(--color-text-tertiary)`. The detail sheet shows a note: "Room not yet confirmed — check the department noticeboard."

---

## 7. Scalability & Future Enhancements

### Supporting Other Departments

The `school` field on `TimetableEntry` is the only gate. To add FSM or FSE timetables:

1. Drop their Excel files into the project.
2. Run the parser (which is school-agnostic once the sheet name is passed as a parameter).
3. Remove the "FSC only" constraint from the UI setup page's school selector.

No architectural changes required. The API route already filters by any combination of fields.

### Performance Considerations

The current exam finder loads the entire `schedule.json` on the client at module evaluation time (`require('../../../public/data/schedule.json')`). This is acceptable for exam data (typically a few hundred entries) but the timetable JSON could be larger across all sections and batches.

Two mitigations to consider when the dataset grows:

**Option A — Segment JSON files by department:** The parser emits `timetable-cs.json`, `timetable-ai.json` etc. The page imports only the relevant file based on the URL param. This keeps initial bundle size flat regardless of how many departments are added.

**Option B — True API fetching:** Replace the static `require()` with a `useEffect` + `fetch('/api/timetable?...')` call. The edge runtime and `Cache-Control` header already in place mean the first request is fast and subsequent ones are served from CDN cache.

Option A requires no infrastructure change and is recommended until the total timetable dataset exceeds approximately 5,000 entries.

### Potential Future Features

The architecture as described today leaves clean extension points for features students would find genuinely useful. A semester-aware filter (the JSON already stores `batch` which proxies semester) would let the parser embed a `semesterStart` and `semesterEnd` date, enabling the ICS export to correctly bound its recurring events. A room-based search (find all classes in CR-01 on Wednesday) requires only a new filter function over the existing JSON, no schema changes. A conflict-free schedule auto-builder for irregular students, which takes a list of desired course codes and returns the combination of sections that avoids overlaps, is a natural next step once `detectConflicts()` is in place — it becomes a constraint-satisfaction search over the already-loaded static data, runnable entirely in the browser with no backend involvement.
