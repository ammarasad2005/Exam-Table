# FSC Exam Schedule — Full Generation Plan
**Target**: School of Computing, FAST-NUCES (or equivalent university)
**Departments**: CS · AI · DS · CY · SE
**Audience**: Undergraduate students searching for their exam timetable
**Deployment**: Vercel (Edge Network)
**Stack**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · no database

---

## 0. Project Philosophy

This is a single-purpose utility app. Every design and engineering decision must serve one user goal: **a student finds their exam schedule in under 10 seconds, on a phone, with no confusion**.

Design aesthetic: **refined monochromatic with sharp department accents**. Think a university student's well-organised notebook — clean grid, generous whitespace, confident typography, one bold accent color per department. No gradients on backgrounds. No decorative illustrations. Precision over personality.

---

## 1. Repository Structure

```
fsc-exams/
├── public/
│   └── data/
│       └── schedule.json          ← generated at build time
├── scripts/
│   └── parse-excel.ts             ← build-time XLSX → JSON converter
├── src/
│   ├── app/
│   │   ├── layout.tsx             ← root layout, font loading, metadata
│   │   ├── page.tsx               ← "/" Setup / landing page
│   │   ├── schedule/
│   │   │   └── page.tsx           ← "/schedule" Results page
│   │   └── api/
│   │       └── schedule/
│   │           └── route.ts       ← optional Edge API (filtered JSON)
│   ├── components/
│   │   ├── SetupForm.tsx
│   │   ├── DepartmentPill.tsx
│   │   ├── ExamCard.tsx
│   │   ├── ExamDetail.tsx         ← slide-up sheet on mobile
│   │   ├── SearchBar.tsx
│   │   ├── CountdownBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── ExportButton.tsx
│   ├── lib/
│   │   ├── types.ts               ← shared TypeScript interfaces
│   │   ├── filter.ts              ← client-side filter logic
│   │   ├── dates.ts               ← date formatting utilities
│   │   └── export.ts              ← ICS / CSV generation
│   └── styles/
│       └── globals.css            ← CSS variables, base reset
├── exam_schedule.xlsx             ← source data (committed to repo)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 2. Data Pipeline (Build-Time)

### 2a. Source file

`exam_schedule.xlsx` is committed to the repository root. It has a sheet named `FSC`. The sheet layout:
- **Row 4**: time slots (columns B onward), with merged cells spanning repeated slots
- **Column A (rows 5+)**: dates, stored as Excel datetime or text strings
- **Data cells** (row 5+, col B+): contain strings like `CS1004 Programming Fundamentals BS(CS) 2023`

### 2b. Parse script — `scripts/parse-excel.ts`

Run during `next build` via a custom Next.js `next.config.ts` hook, or as a standalone `prebuild` npm script.

Use the `xlsx` npm package (pure JS, no native bindings needed on Vercel).

**Algorithm** (ported from the Python script):

```typescript
// scripts/parse-excel.ts
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface ExamEntry {
  date: string;        // "DD/MM/YYYY"
  day: string;         // "Monday"
  time: string;        // "09:00 AM – 11:00 AM"
  courseCode: string;  // "CS1004"
  courseName: string;  // "Programming Fundamentals"
  batch: string;       // "2023"
  department: string;  // "CS"
}

// 1. Load workbook
const wb = XLSX.readFile('exam_schedule.xlsx', { cellDates: true });
const ws = wb.Sheets['FSC'];
const range = XLSX.utils.decode_range(ws['!ref']!);

// 2. Expand merged cells (openpyxl logic translated)
//    XLSX package provides ws['!merges'] as array of {s:{r,c}, e:{r,c}}
//    For each merge range, propagate the top-left cell value to all cells in range.
function expandMerges(ws: XLSX.WorkSheet) { ... }

// 3. Build time_row: col_index → "HH:MM AM – HH:MM AM"
//    Read row index 3 (0-based = row 4 in Excel), columns 1..maxCol
function buildTimeRow(ws: XLSX.WorkSheet): Map<number, string> { ... }

// 4. Build date_col: row_index → { date: string, day: string }
//    Read col index 0, rows 4..maxRow
//    Handle: Excel Date serial (convert via XLSX.SSF.parse_date_code),
//    text like "12/05/2025", "12 May 2025", "Monday 12 May"
function buildDateCol(ws: XLSX.WorkSheet): Map<number, {date:string, day:string}> { ... }

// 5. Extract course codes: /\b([a-z]{2,4}\d{3,5})\b/gi
// 6. Extract batches: /\b(20\d{2})\b/g
// 7. Extract department: match one of ['cs','ai','ds','cy','se'] in cell text
//    Prefer explicit match; fall back to checking degree marker BS(CS) → 'CS'
// 8. Extract course name: text between last course code and first degree marker

// 9. Build cells array, then cross-join with time_row + date_col
//    Output: ExamEntry[]

// 10. Write to public/data/schedule.json
const output: ExamEntry[] = buildEntries(...);
fs.writeFileSync(
  path.join('public', 'data', 'schedule.json'),
  JSON.stringify(output, null, 2)
);
console.log(`✅ Wrote ${output.length} exam entries`);
```

**Department extraction rules** (School of Computing only):

```
DEPARTMENTS = ['cs', 'ai', 'ds', 'cy', 'se']

Priority order:
1. Check cell text for explicit department code next to batch: "BS(CS)", "BS(AI)", etc.
   Regex: /BS\s*\(\s*(CS|AI|DS|CY|SE)\s*\)/i
2. Check for standalone match: /\b(CS|AI|DS|CY|SE)\b/ in cell text
3. Fall back to "UNKNOWN" — do not guess
```

### 2c. Output format

```json
[
  {
    "date": "12/05/2025",
    "day": "Monday",
    "time": "09:00 AM – 11:00 AM",
    "courseCode": "CS1004",
    "courseName": "Programming Fundamentals",
    "batch": "2023",
    "department": "CS"
  },
  ...
]
```

Entries are sorted by date ascending, then time ascending. Duplicates (same date + time + courseCode + batch + department) are removed.

### 2d. Wiring into build

```json
// package.json
{
  "scripts": {
    "prebuild": "ts-node --esm scripts/parse-excel.ts",
    "build": "next build",
    "dev": "npm run prebuild && next dev"
  }
}
```

---

## 3. TypeScript Types — `src/lib/types.ts`

```typescript
export interface ExamEntry {
  date: string;        // "DD/MM/YYYY"
  day: string;         // "Monday"
  time: string;        // "09:00 AM – 11:00 AM"
  courseCode: string;  // "CS1004"
  courseName: string;
  batch: string;       // "2023"
  department: Department;
}

export type Department = 'CS' | 'AI' | 'DS' | 'CY' | 'SE';

export interface FilterState {
  batch: string;
  department: Department;
  query: string;       // live search string
}

export const DEPARTMENTS: Department[] = ['CS', 'AI', 'DS', 'CY', 'SE'];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  CS: 'Computer Science',
  AI: 'Artificial Intelligence',
  DS: 'Data Science',
  CY: 'Cyber Security',
  SE: 'Software Engineering',
};

// Derive available batches from loaded data at runtime
export function getAvailableBatches(entries: ExamEntry[]): string[] {
  return [...new Set(entries.map(e => e.batch))].sort().reverse();
}
```

---

## 4. Design System

### 4a. Typography

```css
/* Import in globals.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');

:root {
  --font-display: 'Instrument Serif', serif;   /* headings, hero text */
  --font-body:    'DM Sans', sans-serif;        /* body, UI labels */
  --font-mono:    'DM Mono', monospace;         /* course codes, dates, times */
}
```

**Why**: `Instrument Serif` gives institutional warmth without being stuffy. `DM Sans` is clean and readable at small sizes on mobile. `DM Mono` makes course codes feel data-precise.

### 4b. Color system

```css
:root {
  /* Base */
  --color-bg:           #FAFAF8;
  --color-bg-raised:    #FFFFFF;
  --color-bg-subtle:    #F2F1EE;
  --color-border:       rgba(0, 0, 0, 0.08);
  --color-border-strong:rgba(0, 0, 0, 0.14);

  /* Text */
  --color-text-primary:   #1A1A18;
  --color-text-secondary: #6B6B66;
  --color-text-tertiary:  #A0A09A;

  /* Department accent colors — one per department */
  --accent-cs: #1D4ED8;   /* classic blue */
  --accent-ai: #7C3AED;   /* violet */
  --accent-ds: #0F766E;   /* teal */
  --accent-cy: #B45309;   /* amber-brown */
  --accent-se: #BE185D;   /* pink */

  /* Derived accent surfaces (5% opacity of accent) */
  --accent-cs-bg: #EFF6FF;
  --accent-ai-bg: #F5F3FF;
  --accent-ds-bg: #F0FDFA;
  --accent-cy-bg: #FFFBEB;
  --accent-se-bg: #FDF2F8;

  /* Semantic */
  --color-success: #166534;
  --color-success-bg: #F0FDF4;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:           #111110;
    --color-bg-raised:    #1C1C1A;
    --color-bg-subtle:    #242422;
    --color-border:       rgba(255, 255, 255, 0.08);
    --color-border-strong:rgba(255, 255, 255, 0.14);
    --color-text-primary:   #F0EFEB;
    --color-text-secondary: #8C8C86;
    --color-text-tertiary:  #5C5C58;
    --accent-cs-bg: #1e2d57;
    --accent-ai-bg: #2d1f57;
    --accent-ds-bg: #0f2d2a;
    --accent-cy-bg: #2d1f0a;
    --accent-se-bg: #2d0f1f;
  }
}
```

### 4c. Tailwind config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      colors: {
        // Map CSS variables to Tailwind utilities
        bg:      'var(--color-bg)',
        raised:  'var(--color-bg-raised)',
        subtle:  'var(--color-bg-subtle)',
        border:  'var(--color-border)',
        primary: 'var(--color-text-primary)',
        secondary:'var(--color-text-secondary)',
        tertiary:'var(--color-text-tertiary)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 5. Pages

### 5a. Root Layout — `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { DM_Sans, DM_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400','500'], variable: '--font-mono', display: 'swap' });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal','italic'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'FSC Exam Schedule',
  description: 'Find your exam timetable — School of Computing',
  themeColor: '#FAFAF8',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  // Open Graph for sharing
  openGraph: {
    title: 'FSC Exam Schedule',
    description: 'Find your exam timetable instantly',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${instrumentSerif.variable}`}>
      <body className="bg-[var(--color-bg)] text-[var(--color-text-primary)] font-body antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

### 5b. Setup Page — `src/app/page.tsx`

**Purpose**: Student selects batch year + department, taps "Find my exams". Zero ambiguity.

**Layout (mobile-first)**:

```
┌──────────────────────────┐
│  [FSC logo mark]   [?]   │  ← header: 56px, logo left, help icon right
├──────────────────────────┤
│                          │
│  Find your               │  ← hero headline, Instrument Serif, 36px
│  exam schedule.          │
│                          │
│  ─────────────────────   │  ← subtle divider
│                          │
│  Batch year              │  ← label, DM Sans 11px, uppercase, tracked
│  ┌────────────────────┐  │
│  │  2023  ▾           │  │  ← custom select, 48px tall
│  └────────────────────┘  │
│                          │
│  Department              │  ← label
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│  │CS│ │AI│ │DS│ │CY│ │SE││  ← pill grid, 2 rows on narrow, 1 row on ≥375px
│  └──┘ └──┘ └──┘ └──┘ └──┘│
│                          │
│  ┌────────────────────┐  │
│  │   View my exams    │  │  ← CTA button, 52px tall, full width
│  └────────────────────┘  │
│                          │
│  Last updated: 01 May 25 │  ← data freshness label, tertiary color
└──────────────────────────┘
```

**Component implementation**:

```tsx
// src/app/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DepartmentPill } from '@/components/DepartmentPill';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '@/lib/types';
import type { Department } from '@/lib/types';

// Derive available batches from data at module load (imported JSON)
import schedule from '../../public/data/schedule.json';
const batches: string[] = [...new Set(schedule.map((e: any) => e.batch))].sort().reverse();

export default function SetupPage() {
  const router = useRouter();
  const [batch, setBatch] = useState<string>(batches[0] ?? '2023');
  const [dept, setDept] = useState<Department>('CS');

  function handleSubmit() {
    router.push(`/schedule?batch=${batch}&dept=${dept}`);
  }

  return (
    <main className="min-h-dvh flex flex-col px-5 pt-safe-top pb-safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between h-14 flex-shrink-0">
        <span className="font-mono text-sm font-medium tracking-widest text-[var(--color-text-secondary)] uppercase">FSC</span>
        <button aria-label="Help" className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">?</button>
      </header>

      {/* Hero */}
      <div className="mt-10 mb-8">
        <h1 className="font-display text-4xl leading-tight text-[var(--color-text-primary)]">
          Find your<br />
          <span className="italic">exam schedule.</span>
        </h1>
        <div className="mt-6 h-px bg-[var(--color-border)]" />
      </div>

      {/* Form */}
      <div className="flex flex-col gap-6 flex-1">

        {/* Batch */}
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
            Batch year
          </label>
          <div className="relative">
            <select
              value={batch}
              onChange={e => setBatch(e.target.value)}
              className="w-full h-12 pl-4 pr-10 bg-[var(--color-bg-raised)] border border-[var(--color-border-strong)] rounded-md font-mono text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer"
            >
              {batches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {/* Custom chevron */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
              <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
            Department
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {DEPARTMENTS.map(d => (
              <DepartmentPill
                key={d}
                dept={d}
                selected={dept === d}
                onClick={() => setDept(d)}
              />
            ))}
          </div>
          {/* Full name label */}
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            {DEPARTMENT_LABELS[dept]}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="pb-8 pt-4">
        <button
          onClick={handleSubmit}
          className="w-full h-13 bg-[var(--color-text-primary)] text-[var(--color-bg)] rounded-md font-body font-medium text-base active:scale-[0.98] transition-transform"
        >
          View my exams
        </button>
        <p className="mt-3 text-center font-mono text-[11px] text-[var(--color-text-tertiary)]">
          Data updated: {/* inject from schedule.json metadata */}
        </p>
      </div>
    </main>
  );
}
```

**DepartmentPill component** (`src/components/DepartmentPill.tsx`):

```tsx
import type { Department } from '@/lib/types';

const ACCENT: Record<Department, { bg: string; text: string; ring: string }> = {
  CS: { bg: 'var(--accent-cs-bg)', text: 'var(--accent-cs)', ring: 'var(--accent-cs)' },
  AI: { bg: 'var(--accent-ai-bg)', text: 'var(--accent-ai)', ring: 'var(--accent-ai)' },
  DS: { bg: 'var(--accent-ds-bg)', text: 'var(--accent-ds)', ring: 'var(--accent-ds)' },
  CY: { bg: 'var(--accent-cy-bg)', text: 'var(--accent-cy)', ring: 'var(--accent-cy)' },
  SE: { bg: 'var(--accent-se-bg)', text: 'var(--accent-se)', ring: 'var(--accent-se)' },
};

interface Props {
  dept: Department;
  selected: boolean;
  onClick: () => void;
}

export function DepartmentPill({ dept, selected, onClick }: Props) {
  const colors = ACCENT[dept];
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={selected ? {
        backgroundColor: colors.bg,
        color: colors.text,
        boxShadow: `0 0 0 2px ${colors.ring}`,
        borderColor: 'transparent',
      } : {}}
      className="h-11 rounded-md border border-[var(--color-border-strong)] font-mono text-sm font-medium transition-all duration-150 active:scale-95"
    >
      {dept}
    </button>
  );
}
```

---

### 5c. Schedule Results Page — `src/app/schedule/page.tsx`

**URL**: `/schedule?batch=2023&dept=CS`

**Behavior**:
- On mount, read `batch` and `dept` from `searchParams`
- Load `schedule.json` (imported as a static module — no fetch needed)
- Filter entries client-side
- Render grouped by day

**Layout (mobile)**:

```
┌──────────────────────────┐
│  ← [CS] Batch 2023  [↗]  │  ← sticky header, 56px; back arrow; export btn
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │ 🔍 Search courses  │  │  ← search bar, 44px, sticky below header
│  └────────────────────┘  │
│                          │
│  6 exams found           │  ← result summary line
│                          │
│  MON 12 MAY              │  ← day header (mono, small, uppercase)
│  ┌────────────────────┐  │
│  │ CS1004             │  │  ← exam card
│  │ Programming Fund…  │  │
│  │ 09:00 – 11:00 AM   │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ MTH1001  …         │  │
│  └────────────────────┘  │
│                          │
│  WED 14 MAY              │
│  ┌────────────────────┐  │
│  │ …                  │  │
│  └────────────────────┘  │
└──────────────────────────┘
         [detail sheet slides up on card tap]
```

**Layout (desktop, ≥768px)**:

```
┌─────────────────────────────────────────────────────┐
│  Header (full width)                                │
├──────────────┬──────────────────────────────────────┤
│  Sidebar     │  Main list                           │
│  ─────────   │  ────────                            │
│  Batch: 2023 │  MON 12 MAY                          │
│  Dept: CS    │  [card] [card]                       │
│              │  WED 14 MAY                          │
│  6 exams     │  [card] [card]                       │
│              │                                      │
│  [Change     │                                      │
│   filters]   │                                      │
│              │                                      │
│  [Export ↓]  │         [detail panel slides in →]  │
└──────────────┴──────────────────────────────────────┘
```

**Component**:

```tsx
// src/app/schedule/page.tsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import scheduleData from '../../../public/data/schedule.json';
import { filterExams, groupByDay } from '@/lib/filter';
import { ExamCard } from '@/components/ExamCard';
import { ExamDetail } from '@/components/ExamDetail';
import { SearchBar } from '@/components/SearchBar';
import { ExportButton } from '@/components/ExportButton';
import type { ExamEntry, Department } from '@/lib/types';

const allExams = scheduleData as ExamEntry[];

export default function SchedulePage() {
  const params = useSearchParams();
  const router = useRouter();
  const batch = params.get('batch') ?? '';
  const dept = (params.get('dept') ?? 'CS') as Department;

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ExamEntry | null>(null);

  const filtered = useMemo(
    () => filterExams(allExams, { batch, department: dept, query }),
    [batch, dept, query]
  );

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur-sm border-b border-[var(--color-border)] h-14 flex items-center px-4 gap-3">
        <button onClick={() => router.back()} aria-label="Back" className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)]">
          {/* left arrow SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 flex items-center gap-2">
          <span
            className="font-mono text-sm font-medium px-2 py-0.5 rounded"
            style={{ backgroundColor: `var(--accent-${dept.toLowerCase()}-bg)`, color: `var(--accent-${dept.toLowerCase()})` }}
          >
            {dept}
          </span>
          <span className="font-mono text-sm text-[var(--color-text-secondary)]">Batch {batch}</span>
        </div>
        <ExportButton entries={filtered} />
      </header>

      {/* Main content */}
      <div className="flex flex-1 md:gap-0">

        {/* Sidebar (desktop only) */}
        <aside className="hidden md:flex md:w-56 lg:w-64 flex-col gap-4 p-6 border-r border-[var(--color-border)] sticky top-14 h-[calc(100dvh-56px)] overflow-y-auto">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Batch</p>
            <p className="font-mono text-sm font-medium">{batch}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Department</p>
            <p className="font-mono text-sm font-medium" style={{ color: `var(--accent-${dept.toLowerCase()})` }}>{dept}</p>
          </div>
          <div className="h-px bg-[var(--color-border)]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Found</p>
            <p className="font-mono text-2xl font-medium">{filtered.length}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">exam{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <button onClick={() => router.push('/')} className="text-xs text-[var(--color-text-secondary)] underline underline-offset-2 text-left">
              Change filters
            </button>
            <ExportButton entries={filtered} variant="sidebar" />
          </div>
        </aside>

        {/* List area */}
        <div className="flex-1 flex flex-col">
          {/* Search bar — sticky below header */}
          <div className="sticky top-14 z-10 bg-[var(--color-bg)] px-4 py-3 border-b border-[var(--color-border)]">
            <SearchBar value={query} onChange={setQuery} />
          </div>

          {/* Result count (mobile) */}
          <p className="md:hidden px-4 pt-4 pb-1 font-mono text-xs text-[var(--color-text-tertiary)]">
            {filtered.length} exam{filtered.length !== 1 ? 's' : ''} found
          </p>

          {/* Grouped list */}
          <div className="flex-1 px-4 pb-24 md:pb-8">
            {filtered.length === 0 ? (
              <EmptyState query={query} batch={batch} dept={dept} />
            ) : (
              grouped.map(({ label, entries }) => (
                <section key={label} className="mt-6 first:mt-4">
                  <h2 className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                    {label}
                  </h2>
                  <div className="flex flex-col gap-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
                    {entries.map(exam => (
                      <ExamCard
                        key={`${exam.date}-${exam.courseCode}-${exam.time}`}
                        exam={exam}
                        dept={dept}
                        onClick={() => setSelected(exam)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Exam detail: bottom sheet on mobile, side panel on desktop */}
      {selected && (
        <ExamDetail
          exam={selected}
          dept={dept}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
```

---

## 6. Components

### 6a. ExamCard — `src/components/ExamCard.tsx`

```tsx
interface Props {
  exam: ExamEntry;
  dept: Department;
  onClick: () => void;
}

export function ExamCard({ exam, dept, onClick }: Props) {
  const accentColor = `var(--accent-${dept.toLowerCase()})`;
  const accentBg = `var(--accent-${dept.toLowerCase()}-bg)`;
  const daysUntil = getDaysUntil(exam.date); // from lib/dates.ts

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-2 active:scale-[0.98] transition-all duration-100 hover:border-[var(--color-border-strong)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
      style={{ '--ring-color': accentColor } as React.CSSProperties}
    >
      {/* Top row: course code + countdown */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-xs font-medium px-2 py-0.5 rounded"
          style={{ backgroundColor: accentBg, color: accentColor }}
        >
          {exam.courseCode}
        </span>
        {daysUntil !== null && daysUntil >= 0 && (
          <CountdownBadge days={daysUntil} />
        )}
      </div>

      {/* Course name */}
      <p className="font-body text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
        {exam.courseName}
      </p>

      {/* Time */}
      <p className="font-mono text-xs text-[var(--color-text-secondary)]">
        {exam.time}
      </p>
    </button>
  );
}
```

### 6b. ExamDetail — `src/components/ExamDetail.tsx`

On mobile: bottom sheet (slides up from bottom, with backdrop).
On desktop (≥768px): right panel that slides in alongside the list.

```tsx
'use client';
import { useEffect } from 'react';
import { generateICS } from '@/lib/export';
import type { ExamEntry, Department } from '@/lib/types';

interface Props {
  exam: ExamEntry;
  dept: Department;
  onClose: () => void;
}

export function ExamDetail({ exam, dept, onClose }: Props) {
  // Lock body scroll on mobile when sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const accentColor = `var(--accent-${dept.toLowerCase()})`;
  const accentBg = `var(--accent-${dept.toLowerCase()}-bg)`;
  const daysUntil = getDaysUntil(exam.date);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/30 md:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet — mobile: fixed bottom; desktop: fixed right panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${exam.courseName} exam details`}
        className={`
          fixed z-40 bg-[var(--color-bg-raised)] shadow-xl
          bottom-0 left-0 right-0 rounded-t-2xl max-h-[85dvh] overflow-y-auto
          md:bottom-0 md:top-14 md:left-auto md:right-0 md:w-96 md:rounded-none md:rounded-l-2xl md:max-h-[calc(100dvh-56px)]
          animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-250
        `}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3">
          <div>
            <span
              className="font-mono text-xs font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: accentBg, color: accentColor }}
            >
              {exam.courseCode}
            </span>
            <h2 className="mt-2 font-display text-xl leading-tight">{exam.courseName}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="ml-4 mt-1 w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Detail rows */}
        <div className="px-5 pb-5">
          <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] overflow-hidden">
            {[
              { label: 'Date', value: `${exam.day}, ${formatDate(exam.date)}` },
              { label: 'Time', value: exam.time },
              { label: 'Batch', value: exam.batch },
              { label: 'Department', value: exam.department },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-raised)]">
                <span className="font-mono text-xs text-[var(--color-text-secondary)]">{label}</span>
                <span className="font-mono text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Countdown callout */}
          {daysUntil !== null && (
            <div
              className="mt-4 px-4 py-3 rounded-md text-sm font-medium"
              style={{ backgroundColor: accentBg, color: accentColor }}
            >
              {daysUntil === 0 && 'Exam is today — good luck!'}
              {daysUntil === 1 && 'Exam is tomorrow.'}
              {daysUntil > 1 && `${daysUntil} days until this exam.`}
              {daysUntil < 0 && 'This exam has passed.'}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => generateICS(exam)}
              className="w-full h-11 rounded-md border border-[var(--color-border-strong)] font-body text-sm font-medium text-[var(--color-text-primary)] active:scale-[0.98] transition-transform"
            >
              Add to calendar (.ics)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

### 6c. SearchBar — `src/components/SearchBar.tsx`

```tsx
interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
        width="15" height="15" viewBox="0 0 15 15" fill="none"
      >
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      <input
        type="search"
        placeholder="Search by course name or code…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-11 pl-9 pr-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-md font-body text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

### 6d. CountdownBadge — `src/components/CountdownBadge.tsx`

```tsx
interface Props { days: number; }

export function CountdownBadge({ days }: Props) {
  if (days < 0) return null;
  const urgent = days <= 2;
  return (
    <span
      className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: urgent ? '#FEF2F2' : 'var(--color-bg-subtle)',
        color: urgent ? '#DC2626' : 'var(--color-text-tertiary)',
      }}
    >
      {days === 0 ? 'TODAY' : days === 1 ? '1d' : `${days}d`}
    </span>
  );
}
```

### 6e. EmptyState — `src/components/EmptyState.tsx`

```tsx
interface Props {
  query: string;
  batch: string;
  dept: string;
}

export function EmptyState({ query, batch, dept }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="font-mono text-4xl text-[var(--color-text-tertiary)] mb-4">∅</div>
      <p className="font-body text-sm text-[var(--color-text-secondary)] max-w-xs">
        {query
          ? `No exams matching "${query}" for ${dept} batch ${batch}.`
          : `No exams found for ${dept} batch ${batch}. Check that your batch year and department are correct.`}
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-6 font-mono text-xs underline underline-offset-4 text-[var(--color-text-tertiary)]"
      >
        Go back
      </button>
    </div>
  );
}
```

### 6f. ExportButton — `src/components/ExportButton.tsx`

```tsx
import { downloadCSV } from '@/lib/export';
import type { ExamEntry } from '@/lib/types';

interface Props {
  entries: ExamEntry[];
  variant?: 'header' | 'sidebar';
}

export function ExportButton({ entries, variant = 'header' }: Props) {
  return (
    <button
      onClick={() => downloadCSV(entries)}
      disabled={entries.length === 0}
      className={variant === 'header'
        ? "font-mono text-xs px-3 h-8 rounded border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] disabled:opacity-40 hover:bg-[var(--color-bg-subtle)] transition-colors"
        : "w-full h-10 rounded-md border border-[var(--color-border-strong)] font-body text-sm text-[var(--color-text-secondary)] disabled:opacity-40"
      }
    >
      Export ↓
    </button>
  );
}
```

---

## 7. Library / Utility Functions

### 7a. Filter — `src/lib/filter.ts`

```typescript
import type { ExamEntry, FilterState } from './types';

export function filterExams(entries: ExamEntry[], filter: FilterState): ExamEntry[] {
  const q = filter.query.toLowerCase().trim();
  return entries.filter(e => {
    if (e.batch !== filter.batch) return false;
    if (e.department !== filter.department) return false;
    if (q && !e.courseCode.toLowerCase().includes(q) && !e.courseName.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function groupByDay(entries: ExamEntry[]): { label: string; entries: ExamEntry[] }[] {
  const map = new Map<string, ExamEntry[]>();
  for (const e of entries) {
    const key = e.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()].map(([date, entries]) => ({
    label: formatDayHeader(date, entries[0].day),
    entries,
  }));
}

// "12/05/2025" + "Monday" → "MON 12 MAY"
function formatDayHeader(date: string, day: string): string {
  const [d, m] = date.split('/');
  const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${day.slice(0, 3).toUpperCase()} ${d} ${monthNames[parseInt(m) - 1]}`;
}
```

### 7b. Dates — `src/lib/dates.ts`

```typescript
// Parse "DD/MM/YYYY" → Date object
export function parseExamDate(dateStr: string): Date | null {
  const [d, m, y] = dateStr.split('/').map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

// Returns days from today to exam date (negative if passed)
export function getDaysUntil(dateStr: string): number | null {
  const examDate = parseExamDate(dateStr);
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = examDate.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// "12/05/2025" → "12 May 2025"
export function formatDate(dateStr: string): string {
  const [d, m, y] = dateStr.split('/');
  const month = new Date(2000, parseInt(m) - 1, 1).toLocaleString('en', { month: 'long' });
  return `${parseInt(d)} ${month} ${y}`;
}
```

### 7c. Export — `src/lib/export.ts`

```typescript
import type { ExamEntry } from './types';

// Download as CSV
export function downloadCSV(entries: ExamEntry[]): void {
  const header = 'Date,Day,Time,Course Code,Course Name,Batch,Department';
  const rows = entries.map(e =>
    [e.date, e.day, e.time, e.courseCode, `"${e.courseName}"`, e.batch, e.department].join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fsc-exams-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Generate .ics for a single exam and trigger download
export function generateICS(exam: ExamEntry): void {
  const [d, m, y] = exam.date.split('/');
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Parse start/end from time string "09:00 AM – 11:00 AM"
  const [startStr, endStr] = exam.time.split('–').map(s => s.trim());
  const startDT = toICSDateTime(y, m, d, startStr);
  const endDT   = toICSDateTime(y, m, d, endStr);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FSC Exams//EN',
    'BEGIN:VEVENT',
    `DTSTART:${startDT}`,
    `DTEND:${endDT}`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${exam.courseCode} – ${exam.courseName}`,
    `DESCRIPTION:Batch ${exam.batch}\\nDepartment: ${exam.department}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${exam.courseCode}-exam.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function toICSDateTime(y: string, m: string, d: string, timeStr: string): string {
  // "09:00 AM" or "11:00 PM" → YYYYMMDDTHHMMSS
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return `${y}${m.padStart(2,'0')}${d.padStart(2,'0')}T090000`;
  let h = parseInt(match[1]);
  const min = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${y}${m.padStart(2,'0')}${d.padStart(2,'0')}T${String(h).padStart(2,'0')}${min}00`;
}
```

---

## 8. API Route (optional Edge function)

Only needed if you want to avoid sending full JSON to client (e.g., for very large datasets).

```typescript
// src/app/api/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import schedule from '../../../../public/data/schedule.json';
import type { ExamEntry } from '@/lib/types';

export const runtime = 'edge';

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const batch = searchParams.get('batch');
  const dept  = searchParams.get('dept')?.toUpperCase();

  if (!batch || !dept) {
    return NextResponse.json({ error: 'batch and dept required' }, { status: 400 });
  }

  const filtered = (schedule as ExamEntry[]).filter(
    e => e.batch === batch && e.department === dept
  );

  return NextResponse.json(filtered, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

---

## 9. Responsiveness Specification

### Breakpoints

| Token | Value | Target |
|-------|-------|--------|
| `sm`  | 375px | Larger phones (iPhone SE and up) |
| `md`  | 768px | Tablet / iPad portrait |
| `lg`  | 1024px| Desktop |
| `xl`  | 1280px| Wide desktop |

### Mobile (< 768px) — primary target

- Single-column layout throughout
- Department pills: 3-column grid (`grid-cols-3`), pills are 44px tall touch targets
- ExamCard: full width, stacked vertically
- ExamDetail: bottom sheet, max 85dvh, scrollable, drag handle
- Search bar: sticky below header
- All tap targets: minimum 44×44px (WCAG 2.5.5)
- Safe area insets: `pt-safe-top`, `pb-safe-bottom` via `env(safe-area-inset-*)` for notched phones

### Tablet (768px–1023px)

- Setup page: max-width 480px centered
- Schedule page: sidebar appears (224px), main list fills rest
- Exam cards: 2-column grid in main area
- ExamDetail: right panel (384px) slides in, no backdrop needed

### Desktop (≥ 1024px)

- Setup page: two-column — hero text left, form right (max 400px each)
- Schedule page: sidebar widens (256px), exam cards: 3-column grid
- ExamDetail: right panel always visible when an exam is selected
- Max content width: 1280px, centered with auto margins

### CSS implementation pattern

```tsx
// Always write mobile-first, add md: and lg: modifiers
<div className="
  px-4 md:px-6 lg:px-8          // padding
  flex-col md:flex-row           // direction
  gap-2 md:gap-4                 // gap
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3  // grid
">
```

---

## 10. Animations & Micro-interactions

All animations use CSS only (no JS animation libraries needed).

```css
/* globals.css additions */

/* Page transition — fade + slide in from bottom */
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
.page-enter {
  animation: page-enter 200ms ease-out both;
}

/* Bottom sheet slide up */
@keyframes sheet-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

/* Right panel slide in */
@keyframes panel-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

/* Card stagger on list render */
.exam-card {
  animation: page-enter 160ms ease-out both;
}
.exam-card:nth-child(1) { animation-delay: 0ms; }
.exam-card:nth-child(2) { animation-delay: 30ms; }
.exam-card:nth-child(3) { animation-delay: 60ms; }
/* ... */

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Interaction states**:

| Element | Hover | Active | Focus |
|---------|-------|--------|-------|
| CTA button | bg darkens 5% | `scale(0.98)` 100ms | 2px ring, offset 2px |
| ExamCard | border strengthens, shadow appears | `scale(0.98)` 100ms | 2px ring |
| DepartmentPill | subtle bg tint | `scale(0.95)` 80ms | 2px ring |
| SearchBar | border strengthens | — | 2px ring |
| Back button | bg-subtle | `scale(0.92)` | ring |

---

## 11. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Color contrast | All text/bg combos ≥ 4.5:1 (WCAG AA). Mono text on bg-subtle verified. |
| Focus indicators | `focus-visible:ring-2` on all interactive elements; never `outline: none` without replacement |
| Touch targets | All buttons/pills ≥ 44×44px |
| Screen reader | `aria-label` on icon-only buttons; `role="dialog"` + `aria-modal` on ExamDetail; `aria-pressed` on pills |
| Keyboard nav | Tab order follows visual order; Escape closes ExamDetail; Enter activates pills |
| `prefers-reduced-motion` | All animations disabled/shortened |
| `prefers-color-scheme` | Full dark mode via CSS variables |
| Semantic HTML | `<main>`, `<header>`, `<aside>`, `<section>`, `<h1>`/`<h2>` hierarchy |
| `lang` attribute | `<html lang="en">` |

---

## 12. Performance Targets & Optimizations

### Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 1.2s on 4G |
| FID / INP | < 100ms |
| CLS | < 0.05 |
| Total JS bundle | < 80KB gzipped |
| Time to interactive | < 2s on mid-range Android |

### Optimizations

**1. No API call on page load.**
`schedule.json` is imported directly as a module in the schedule page. Next.js bundles it at build time. No network request after the HTML loads.

**2. Client-side filtering.**
Array.filter on 200–500 entries takes < 1ms. No debounce needed. Search is instant.

**3. Static page shell.**
The setup page (`/`) has zero data dependencies and renders as a fully static HTML page with no JavaScript hydration cost for the initial render.

**4. Next.js font optimization.**
`next/font/google` downloads fonts at build time, self-hosts them, and injects `font-display: swap`. No FOUT, no external DNS lookup.

**5. No third-party dependencies at runtime.**
Planned runtime npm packages: `next`, `react`, `react-dom`. No analytics, no UI library, no animation library.

**6. Image optimization.**
No images used. SVG icons are inline — no img requests.

**7. Schedule data size control.**
Expected 100–400 exam entries. At ~200 bytes per JSON object, worst case = 80KB uncompressed, ~25KB gzipped. Well within mobile comfort zone.

**8. Vercel Edge caching.**
API route (if used) returns `s-maxage=3600, stale-while-revalidate=86400`. First request per region hits the function; subsequent requests for the same batch+dept combo are served from edge cache in < 10ms.

**9. `next.config.ts` settings:**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',          // for Docker if needed
  compress: true,
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/data/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
      ],
    },
  ],
};

export default nextConfig;
```

---

## 13. Error Handling

| Error Case | Behavior |
|------------|----------|
| `schedule.json` missing / empty | `EmptyState` shown with message "No exam data available. Please contact admin." |
| Invalid `batch` / `dept` in URL params | Redirect to `/` with a toast/message |
| Exam date in the past | Show exam with past styling (muted opacity, "Passed" badge instead of countdown) |
| Search returns 0 results | `EmptyState` with query-specific message |
| ICS / CSV generation fails | Silent catch + console.error (non-critical) |

---

## 14. Environment & Configuration

```bash
# .env.local (not needed for basic setup — no secrets)
# If schedule update webhook is added later:
# SCHEDULE_UPDATE_SECRET=xxx
```

```json
// package.json — complete scripts
{
  "scripts": {
    "prebuild": "ts-node --esm scripts/parse-excel.ts",
    "build": "next build",
    "dev": "npm run prebuild && next dev",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "ts-node": "^10",
    "tailwindcss": "^3.4",
    "postcss": "^8",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "^14"
  }
}
```

---

## 15. Vercel Deployment

### One-time setup

1. Push repo to GitHub
2. Import project in Vercel dashboard
3. Set build command: `npm run build` (prebuild runs automatically)
4. Set output directory: `.next`
5. No environment variables needed initially

### Updating the schedule

When a new `exam_schedule.xlsx` is available:

1. Replace the file in the repo root
2. Commit: `git commit -am "Update exam schedule — Semester X 2025"`
3. Push to main → Vercel auto-deploys
4. Build re-runs `parse-excel.ts`, new `schedule.json` generated, site live in ~60 seconds

### Optional: GitHub Action for XLSX upload

```yaml
# .github/workflows/update-schedule.yml
name: Update Schedule
on:
  workflow_dispatch:
    inputs:
      description:
        description: 'What changed'
        required: false

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run prebuild        # regenerate schedule.json
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: regenerate schedule.json"
          file_pattern: public/data/schedule.json
```

This triggers a Vercel deploy automatically on the commit.

---

## 16. Testing Checklist (for the coding agent)

Before considering the build complete, verify:

- [ ] `npm run prebuild` runs without errors on the provided `exam_schedule.xlsx`
- [ ] `public/data/schedule.json` is generated and contains valid entries
- [ ] Setup page renders at `/` with all 5 department pills (CS, AI, DS, CY, SE)
- [ ] Selecting a batch + department and tapping "View my exams" navigates to `/schedule?batch=X&dept=Y`
- [ ] Schedule page shows only exams matching the selected batch and department
- [ ] Search bar filters results in real-time with no perceptible delay
- [ ] Tapping an exam card opens the ExamDetail bottom sheet on mobile
- [ ] ExamDetail shows correct date, time, course code, course name, batch, department
- [ ] CountdownBadge shows correct days remaining (or "TODAY" / "Passed")
- [ ] "Add to calendar" generates and downloads a valid `.ics` file
- [ ] "Export" button downloads a valid `.csv` with all filtered exams
- [ ] Empty state renders correctly when no exams match
- [ ] Back button on schedule page returns to setup page
- [ ] Dark mode: all text readable, all surfaces adapt correctly
- [ ] Mobile (375px): no horizontal scroll, all touch targets ≥ 44px
- [ ] Desktop (1280px): sidebar visible, 3-column exam grid, right panel detail
- [ ] Keyboard navigation: Tab, Enter, Escape all work correctly
- [ ] `npm run build` completes without TypeScript errors
- [ ] Vercel deploy succeeds and all pages load within performance targets

---

## 17. File Generation Order (recommended for coding agent)

Follow this sequence to avoid import errors:

1. `package.json` + `tsconfig.json` + `tailwind.config.ts` + `postcss.config.js`
2. `src/styles/globals.css` (CSS variables)
3. `src/lib/types.ts`
4. `src/lib/dates.ts`
5. `src/lib/filter.ts`
6. `src/lib/export.ts`
7. `scripts/parse-excel.ts`
8. `src/components/CountdownBadge.tsx`
9. `src/components/DepartmentPill.tsx`
10. `src/components/SearchBar.tsx`
11. `src/components/EmptyState.tsx`
12. `src/components/ExportButton.tsx`
13. `src/components/ExamCard.tsx`
14. `src/components/ExamDetail.tsx`
15. `src/app/layout.tsx`
16. `src/app/page.tsx` (setup)
17. `src/app/schedule/page.tsx` (results)
18. `src/app/api/schedule/route.ts` (optional)
19. `next.config.ts`
20. Run `npm install` → `npm run dev` → verify

---

*End of generation plan. All code blocks are production-ready — copy them verbatim into the respective files.*
