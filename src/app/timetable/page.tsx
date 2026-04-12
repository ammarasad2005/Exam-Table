'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, Suspense } from 'react';
import {
  flattenTimetable,
  filterTimetable,
  groupByDayTimetable,
  detectConflicts,
  formatTimeRange,
  parseTimeToMinutes,
} from '@/lib/timetable-filter';
import { TimetableCard } from '@/components/TimetableCard';
import { TimetableDetail } from '@/components/TimetableDetail';
import { TimetableExportButton } from '@/components/TimetableExportButton';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { TimetableEntry, RawTimetableJSON } from '@/lib/types';
import { DAYS_ORDER } from '@/lib/types';

// eslint-disable-next-line
const timetableRaw: RawTimetableJSON = require('../../../public/data/timetable.json');
const allEntries: TimetableEntry[] = flattenTimetable(timetableRaw);

// ─── Time slots for the grid view ─────────────────────────────────────────────
const GRID_SLOTS = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'];

type ViewMode = 'list' | 'grid';

function TimetablePageInner() {
  const params  = useSearchParams();
  const router  = useRouter();
  const batch   = params.get('batch')   ?? '';
  const dept    = params.get('dept')    ?? 'CS';
  const section = params.get('section') ?? '';

  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState<TimetableEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filtered = useMemo(
    () => filterTimetable(allEntries, { batch, department: dept, section, query }),
    [batch, dept, section, query]
  );

  const grouped  = useMemo(() => groupByDayTimetable(filtered), [filtered]);
  const conflicts = useMemo(() => detectConflicts(filtered), [filtered]);

  const accentColor = `var(--accent-${dept.toLowerCase()})`;
  const accentBg    = `var(--accent-${dept.toLowerCase()}-bg)`;

  const hasPartialDays = filtered.length > 0 &&
    grouped.length < DAYS_ORDER.length;

  return (
    <div className="min-h-dvh flex flex-col">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur-sm border-b border-[var(--color-border)] h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span
            className="font-mono text-sm font-medium px-2 py-0.5 rounded shrink-0"
            style={{ backgroundColor: accentBg, color: accentColor }}
          >
            {dept}
          </span>
          <span className="font-mono text-sm text-[var(--color-text-secondary)] truncate">
            Batch {batch} · Section {section}
          </span>
        </div>

        <ThemeToggle />
        <TimetableExportButton entries={filtered} />
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 md:gap-0">

        {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
        <aside className="hidden md:flex md:w-56 lg:w-64 flex-col gap-4 p-6 border-r border-[var(--color-border)] sticky top-14 h-[calc(100dvh-56px)] overflow-y-auto">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Batch</p>
            <p className="font-mono text-sm font-medium">{batch}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Department</p>
            <p className="font-mono text-sm font-medium" style={{ color: accentColor }}>{dept}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Section</p>
            <p className="font-mono text-sm font-medium">{section}</p>
          </div>
          <div className="h-px bg-[var(--color-border)]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Found</p>
            <p className="font-mono text-2xl font-medium">{filtered.length}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">class slot{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {/* View toggle */}
          <div className="h-px bg-[var(--color-border)]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">View</p>
            <div className="grid grid-cols-2 gap-1">
              {(['list', 'grid'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  id={`view-${v}`}
                  onClick={() => setViewMode(v)}
                  aria-pressed={viewMode === v}
                  className="h-8 rounded border font-mono text-xs font-medium transition-all duration-150 focus-visible:outline-none"
                  style={viewMode === v ? {
                    backgroundColor: 'var(--color-text-primary)',
                    color: 'var(--color-bg)',
                    borderColor: 'transparent',
                  } : {
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {v === 'list' ? 'List' : 'Grid'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <button
              onClick={() => router.push('/')}
              className="text-xs text-[var(--color-text-secondary)] underline underline-offset-2 text-left hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2"
            >
              Change filters
            </button>
            <TimetableExportButton entries={filtered} variant="sidebar" />
          </div>
        </aside>

        {/* ── List / Grid area ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Search + view toggle (mobile) */}
          <div className="sticky top-14 z-10 bg-[var(--color-bg)] px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <SearchBar value={query} onChange={setQuery} />
              </div>
              {/* View toggle — mobile only */}
              <div className="md:hidden flex gap-1">
                {(['list', 'grid'] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    id={`mobile-view-${v}`}
                    onClick={() => setViewMode(v)}
                    aria-pressed={viewMode === v}
                    className="h-9 w-9 rounded border font-mono text-xs font-medium transition-all"
                    style={viewMode === v ? {
                      backgroundColor: 'var(--color-text-primary)',
                      color: 'var(--color-bg)',
                      borderColor: 'transparent',
                    } : {
                      borderColor: 'var(--color-border-strong)',
                      color: 'var(--color-text-secondary)',
                    }}
                    title={v === 'list' ? 'List view' : 'Grid view'}
                  >
                    {v === 'list' ? '☰' : '⊞'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Partial data banner */}
          {hasPartialDays && (
            <div className="px-4 pt-3">
              <div className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-subtle)] rounded-md px-3 py-2">
                <span>ℹ</span>
                <span>Showing {grouped.length} of 5 days. Some classes may not yet be scheduled.</span>
              </div>
            </div>
          )}

          {/* Result count (mobile) */}
          <p className="md:hidden px-4 pt-3 pb-1 font-mono text-xs text-[var(--color-text-tertiary)]">
            {filtered.length} class slot{filtered.length !== 1 ? 's' : ''} found
          </p>

          {/* Content area */}
          <div id="print-area" className="flex-1 px-4 pb-24 md:pb-8 bg-[var(--color-bg)]">
            {filtered.length === 0 ? (
              <EmptyState
                query={query}
                batch={batch}
                dept={dept}
                message={
                  query
                    ? `No classes matching "${query}" for ${dept} Section ${section}, Batch ${batch}.`
                    : allEntries.length === 0
                      ? 'No timetable data yet. Run the Python script and place the output in public/data/timetable.json.'
                      : `No timetable found for ${dept} Section ${section}, Batch ${batch}. The timetable may not yet be available.`
                }
              />
            ) : viewMode === 'list' ? (
              <ListView grouped={grouped} dept={dept} conflicts={conflicts} onSelect={setSelected} />
            ) : (
              <GridView entries={filtered} dept={dept} conflicts={conflicts} onSelect={setSelected} />
            )}
          </div>
        </div>
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────── */}
      {selected && (
        <TimetableDetail
          entry={selected}
          dept={dept}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  grouped,
  dept,
  conflicts,
  onSelect,
}: {
  grouped: { day: string; entries: TimetableEntry[] }[];
  dept: string;
  conflicts: Set<string>;
  onSelect: (e: TimetableEntry) => void;
}) {
  return (
    <>
      {grouped.map(({ day, entries }) => (
        <section key={day} className="mt-6 first:mt-4">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
            {day}
          </h2>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
            {entries.map((entry, idx) => {
              const key = `${entry.day}|${entry.time}|${entry.courseName}|${entry.section}`;
              return (
                <TimetableCard
                  key={`${key}-${idx}`}
                  entry={entry}
                  dept={dept}
                  conflicting={conflicts.has(key)}
                  onClick={() => onSelect(entry)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({
  entries,
  dept,
  conflicts,
  onSelect,
}: {
  entries: TimetableEntry[];
  dept: string;
  conflicts: Set<string>;
  onSelect: (e: TimetableEntry) => void;
}) {
  const accentColor = `var(--accent-${dept.toLowerCase()})`;
  const accentBg    = `var(--accent-${dept.toLowerCase()}-bg)`;

  // Build a map: day → time-slot-start (minutes) → entries
  const cellMap = useMemo(() => {
    const m = new Map<string, Map<number, TimetableEntry[]>>();
    for (const day of DAYS_ORDER) m.set(day, new Map());
    for (const e of entries) {
      const dayMap = m.get(e.day);
      if (!dayMap) continue;
      // Find the nearest grid slot ≤ entry start
      const startMin = parseTimeToMinutes(e.time.split('-')[0]?.trim() ?? e.time);
      const slotMin = GRID_SLOTS
        .map(s => parseTimeToMinutes(s))
        .filter(sm => sm <= startMin + 30)
        .at(-1) ?? parseTimeToMinutes(GRID_SLOTS[0]);
      if (!dayMap.has(slotMin)) dayMap.set(slotMin, []);
      dayMap.get(slotMin)!.push(e);
    }
    return m;
  }, [entries]);

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-xs" style={{ minWidth: '600px' }}>
        <thead>
          <tr>
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] pb-3 w-16 pr-2">
              Time
            </th>
            {DAYS_ORDER.map(day => (
              <th
                key={day}
                className="text-center font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] pb-3 px-1"
              >
                {day.slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRID_SLOTS.map(slot => {
            const slotMin = parseTimeToMinutes(slot);
            return (
              <tr key={slot} className="border-t border-[var(--color-border)]">
                <td className="pr-2 py-2 align-top">
                  <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] whitespace-nowrap">
                    {formatTimeRange(slot)}
                  </span>
                </td>
                {DAYS_ORDER.map(day => {
                  const cellEntries = cellMap.get(day)?.get(slotMin) ?? [];
                  return (
                    <td key={day} className="px-1 py-2 align-top">
                      {cellEntries.map((e, idx) => {
                        const key = `${e.day}|${e.time}|${e.courseName}|${e.section}`;
                        const isConflict = conflicts.has(key);
                        return (
                          <button
                            key={idx}
                            onClick={() => onSelect(e)}
                            className="w-full text-left rounded-md p-2 text-[11px] transition-all hover:opacity-80 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 mb-1"
                            style={{
                              backgroundColor: isConflict ? '#fef2f2' : accentBg,
                              color: isConflict ? '#dc2626' : accentColor,
                              borderLeft: isConflict ? '2px solid #f87171' : `2px solid ${accentColor}`,
                            }}
                          >
                            <p className="font-medium leading-tight line-clamp-2">{e.courseName}</p>
                            <p className="mt-0.5 opacity-70">{e.room}</p>
                          </button>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function TimetablePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <p className="font-mono text-sm text-[var(--color-text-tertiary)]">Loading…</p>
      </div>
    }>
      <TimetablePageInner />
    </Suspense>
  );
}
