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
import { Header } from '@/components/Header';
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
  const [includeRepeats, setIncludeRepeats] = useState(false);

  const filtered = useMemo(
    () => filterTimetable(allEntries, { batch, department: dept, section, query, includeRepeats }),
    [batch, dept, section, query, includeRepeats]
  );

  const grouped  = useMemo(() => groupByDayTimetable(filtered), [filtered]);
  const conflicts = useMemo(() => detectConflicts(filtered, includeRepeats), [filtered, includeRepeats]);

  const accentColor = `var(--accent-${dept.toLowerCase()})`;
  const accentBg    = `var(--accent-${dept.toLowerCase()}-bg)`;

  const hasPartialDays = filtered.length > 0 &&
    grouped.length < DAYS_ORDER.length;

  return (
    <div className="min-h-dvh flex flex-col">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <Header rightActions={<TimetableExportButton entries={filtered} />}>
        <div className="flex flex-1 items-center gap-2 md:gap-3 w-full max-w-full min-w-0">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 shrink-0 -ml-2"
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
        </div>
      </Header>


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

          {/* Include Repeats toggle */}
          <div className="h-px bg-[var(--color-border)]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">Repeat Courses</p>
            <button
              id="sidebar-repeats-toggle"
              role="switch"
              aria-checked={includeRepeats}
              onClick={() => setIncludeRepeats(v => !v)}
              className="flex items-center justify-between w-full h-8 px-3 rounded border font-mono text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
              style={includeRepeats ? {
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-bg)',
                borderColor: 'transparent',
              } : {
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>{includeRepeats ? 'Included' : 'Excluded'}</span>
              <span className="opacity-60 text-[10px]">{includeRepeats ? '●' : '○'}</span>
            </button>
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
              {/* Include Repeats — mobile inline toggle */}
              <button
                id="mobile-repeats-toggle"
                role="switch"
                aria-checked={includeRepeats}
                onClick={() => setIncludeRepeats(v => !v)}
                title={includeRepeats ? 'Exclude repeat courses' : 'Include repeat courses'}
                className="h-9 px-2.5 rounded border font-mono text-[10px] font-medium transition-all shrink-0 focus-visible:outline-none"
                style={includeRepeats ? {
                  backgroundColor: 'var(--color-text-primary)',
                  color: 'var(--color-bg)',
                  borderColor: 'transparent',
                } : {
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Repeats
              </button>
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
          )}          {/* Result count (mobile) */}
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
                  isRepeat={entry.category === 'repeat'}
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

import { parseTimeRange } from '@/lib/timetable-filter';

// ─── Grid View ────────────────────────────────────────────────────────────────

const GRID_START = 8 * 60; // 08:00
const GRID_END   = 18.5 * 60; // 18:30 (last slot ends at 17:00 + 90min)
const PX_PER_MIN = 1.35;
const DAY_COL_WIDTH = 'minmax(120px, 1fr)';

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

  const totalHeight = (GRID_END - GRID_START) * PX_PER_MIN;

  // Generate hour marks
  const hours = [];
  for (let m = GRID_START; m <= GRID_END; m += 60) {
    hours.push(m);
  }

  return (
    <div className="mt-8 overflow-x-auto select-none rounded-xl border border-[var(--color-border)] shadow-sm bg-[var(--color-bg-raised)]">
      <div className="min-w-[650px] md:min-w-[850px] relative flex flex-col">
        
        {/* Day Headers - Sticky */}
        <div className="grid grid-cols-[45px_repeat(5,1fr)] md:grid-cols-[60px_repeat(5,1fr)] sticky top-0 z-20 bg-[var(--color-bg-raised)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
          <div className="h-10 border-r border-[var(--color-border)]" /> {/* Spacer for time column */}
          {DAYS_ORDER.map(day => (
            <div key={day} className="text-center font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] flex items-center justify-center border-r border-[var(--color-border)] last:border-r-0">
              {day.slice(0, 3)}
              <span className="hidden md:inline ml-1">{day.slice(3)}</span>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="relative grid grid-cols-[45px_repeat(5,1fr)] md:grid-cols-[60px_repeat(5,1fr)]" 
             style={{ height: `${totalHeight}px` }}>
          
          {/* Time Column & Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {hours.map(m => {
              const top = (m - GRID_START) * PX_PER_MIN;
              return (
                <div key={m} className="absolute left-0 right-0 border-t border-[var(--color-border)] opacity-30 flex items-start" style={{ top: `${top}px` }}>
                  <span className="font-mono text-[8px] md:text-[9px] -mt-2 ml-1 md:ml-2 text-[var(--color-text-tertiary)] bg-[var(--color-bg-raised)] px-1">
                    {Math.floor(m / 60)}:00
                  </span>
                </div>
              );
            })}
            
            {/* Vertical lines */}
            <div className="absolute inset-0 grid grid-cols-[45px_repeat(5,1fr)] md:grid-cols-[60px_repeat(5,1fr)]">
              <div className="border-r border-[var(--color-border)] bg-[var(--color-bg-subtle)]/30 sticky left-0 z-10" />
              {DAYS_ORDER.map(day => (
                <div key={day} className="border-r border-[var(--color-border)] last:border-r-0" />
              ))}
            </div>
          </div>

          {/* Classes Layer */}
          <div className="col-start-2 col-span-5 relative h-full">
            <div className="absolute inset-0 grid grid-cols-5 h-full">
              {DAYS_ORDER.map((day, dayIdx) => (
                <div key={day} className="relative h-full px-0.5 md:px-1">
                  {entries
                    .filter(e => e.day === day)
                    .map((e, idx) => {
                      const [start, end] = parseTimeRange(e.time);
                      const top = (start - GRID_START) * PX_PER_MIN;
                      const height = (end - start) * PX_PER_MIN;
                      const key = `${e.day}|${e.time}|${e.courseName}|${e.section}`;
                      const isConflict = conflicts.has(key);
                      const isRepeat = e.category === 'repeat';

                      return (
                        <button
                          key={idx}
                          onClick={() => onSelect(e)}
                          className="absolute left-0.5 right-0.5 rounded-md p-1.5 md:p-2 text-[9px] md:text-[10px] transition-all hover:ring-1 hover:ring-[var(--color-text-tertiary)] active:scale-[0.98] focus-visible:outline-none overflow-hidden text-left"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            background: isConflict 
                              ? (isRepeat ? 'repeating-linear-gradient(45deg, #fef2f2, #fef2f2 10px, #fff1f2 10px, #fff1f2 20px)' : '#fef2f2')
                              : (isRepeat 
                                ? 'linear-gradient(135deg, var(--color-bg-raised) 50%, color-mix(in srgb, var(--color-bg-raised) 80%, #f59e0b 20%))'
                                : accentBg),
                            color: isConflict ? '#dc2626' : accentColor,
                            borderLeft: isConflict ? '2px md:border-l-[3px] solid #f87171' : (isRepeat ? '2px md:border-l-[3px] solid #f59e0b' : `2px md:border-l-[3px] solid ${accentColor}`),
                            boxShadow: 'var(--shadow-card)',
                            zIndex: isConflict ? 10 : 1,
                          }}
                        >
                          <div className="flex flex-col h-full justify-between">
                            <div className="min-w-0">
                              <p className="font-bold leading-tight line-clamp-2 uppercase break-all">{e.courseName}</p>
                              <p className="mt-0.5 opacity-80 font-mono text-[8.5px] whitespace-nowrap overflow-hidden text-ellipsis">{formatTimeRange(e.time)}</p>
                            </div>
                            <p className="font-medium opacity-80 self-end text-[8.5px] truncate max-w-full">{e.room}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
