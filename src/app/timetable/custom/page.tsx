'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useId, Suspense } from 'react';
import { TimetableCard } from '@/components/TimetableCard';
import { TimetableDetail } from '@/components/TimetableDetail';
import { SearchBar } from '@/components/SearchBar';
import { TimetableExportButton } from '@/components/TimetableExportButton';
import { EmptyState } from '@/components/EmptyState';
import { ThemeToggle } from '@/components/ThemeToggle';
import { flattenTimetable, groupByDayTimetable, detectConflicts } from '@/lib/timetable-filter';
import type { TimetableEntry, RawTimetableJSON } from '@/lib/types';

// eslint-disable-next-line
const timetableRaw: RawTimetableJSON = require('../../../../public/data/timetable.json');
const allTimetableEntries = flattenTimetable(timetableRaw);

// Derive available batches from data
const availableBatches: string[] = [...new Set<string>(allTimetableEntries.map(e => e.batch))]
  .sort()
  .reverse();

const TIMETABLE_DEPTS = ['CS', 'AI', 'DS', 'CY', 'SE', 'AI/DS'];
const CATEGORIES = ['regular', 'repeat'];

interface CourseRow {
  id: string;
  batch: string;
  stream: string;
  category: string;
  selection: string; // Format: "Course Name|Section"
  // validation state
  errorBatch: boolean;
  errorStream: boolean;
  errorCategory: boolean;
  errorSelection: boolean;
}

function makeRow(id: string): CourseRow {
  return {
    id,
    batch: availableBatches[0] ?? '2024',
    stream: '',
    category: 'regular',
    selection: '',
    errorBatch: false,
    errorStream: false,
    errorCategory: false,
    errorSelection: false,
  };
}

function findClasses(entry: CourseRow): TimetableEntry[] {
  if (!entry.batch || !entry.stream || !entry.category || !entry.selection) return [];
  const [courseName, section] = entry.selection.split('|');
  return allTimetableEntries.filter(e =>
    e.batch === entry.batch &&
    e.department === entry.stream &&
    e.category === entry.category &&
    e.courseName === courseName &&
    e.section === section
  );
}

function CustomTimetableInner() {
  const router = useRouter();
  const baseId = useId();
  const [rows, setRows] = useState<CourseRow[]>([makeRow(`${baseId}-0`)]);
  const [nextIdx, setNextIdx] = useState(1);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<TimetableEntry | null>(null);

  // ── Row management ────────────────────────────────────────────────────────
  function addRow() {
    const id = `${baseId}-${nextIdx}`;
    setNextIdx(n => n + 1);
    setRows(prev => [...prev, makeRow(id)]);
    setSaved(false);
  }

  function updateRow(id: string, patch: Partial<CourseRow>) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    setSaved(false);
  }

  function removeRow(id: string) {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
    setSaved(false);
  }

  // ── Save / validate ──────────────────────────────────────────────────────
  function handleSave() {
    let hasError = false;
    const validated = rows.map(r => {
      const eb = !r.batch;
      const es = !r.stream;
      const ec = !r.category;
      const esel = !r.selection;
      if (eb || es || ec || esel) hasError = true;
      return { ...r, errorBatch: eb, errorStream: es, errorCategory: ec, errorSelection: esel };
    });
    setRows(validated);
    if (!hasError) setSaved(true);
  }

  // ── Compute results ──────────────────────────────────────────────────────
  const savedMatches = useMemo(() => {
    if (!saved) return [];
    const seen = new Set<string>();
    const result: TimetableEntry[] = [];
    for (const row of rows) {
      for (const slot of findClasses(row)) {
        const key = `${slot.day}|${slot.time}|${slot.courseName}|${slot.section}`;
        if (!seen.has(key)) { seen.add(key); result.push(slot); }
      }
    }
    return result; // Order matters less here because groupByDay sorts them
  }, [saved, rows]);

  const filtered = useMemo(() => {
    if (!query.trim()) return savedMatches;
    const q = query.toLowerCase();
    return savedMatches.filter(e =>
      e.courseName.toLowerCase().includes(q) ||
      e.room.toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q)
    );
  }, [savedMatches, query]);

  const grouped = useMemo(() => groupByDayTimetable(filtered), [filtered]);
  const conflicts = useMemo(() => detectConflicts(filtered), [filtered]);

  // ── Per-row "not found" hint ─────────────────────────────────────────────
  const rowMatches = useMemo(() =>
    rows.map(r => ({ id: r.id, count: findClasses(r).length })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  );

  const anyError = saved === false && rows.some(r => r.errorBatch || r.errorStream || r.errorCategory || r.errorSelection);

  return (
    <div className="min-h-dvh flex flex-col">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur-sm border-b border-[var(--color-border)] h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => router.push('/')}
          aria-label="Back to setup"
          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <span className="font-mono text-sm font-medium text-[var(--color-text-primary)]">Custom Timetable</span>
        </div>
        <ThemeToggle />
        {saved && <TimetableExportButton entries={filtered} />}
      </header>

      <div className="flex flex-1 md:gap-0">

        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden md:flex md:w-[350px] lg:w-[400px] flex-col border-r border-[var(--color-border)] sticky top-14 h-[calc(100dvh-56px)] overflow-y-auto">
          <div className="flex-1 px-5 py-5 flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                Your Classes
              </p>
              <button
                onClick={addRow}
                className="flex items-center gap-1 px-3 h-8 rounded-md border border-[var(--color-border-strong)] font-mono text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add Row
              </button>
            </div>

            {/* Row list */}
            <div className="flex flex-col gap-3">
              {rows.map((row, idx) => (
                <RowEditor
                  key={row.id}
                  row={row}
                  index={idx}
                  matchCount={rowMatches.find(m => m.id === row.id)?.count ?? 0}
                  showMatchHint={saved}
                  onUpdate={patch => updateRow(row.id, patch)}
                  onRemove={() => removeRow(row.id)}
                  canRemove={rows.length > 1}
                />
              ))}
            </div>

            {anyError && (
              <p className="text-xs text-red-500 font-mono">Fill all highlighted fields first.</p>
            )}
          </div>

          {/* Save + stats */}
          <div className="px-5 py-4 border-t border-[var(--color-border)] flex flex-col gap-2">
            {saved && (
              <p className="font-mono text-xs text-[var(--color-text-tertiary)]">
                {savedMatches.length} class slot{savedMatches.length !== 1 ? 's' : ''} found
              </p>
            )}
            <button
              onClick={handleSave}
              className="w-full h-10 rounded-md bg-[var(--color-text-primary)] text-[var(--color-bg)] font-body text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2"
            >
              {saved ? 'Update Results' : 'Save & Build Timetable'}
            </button>
            {saved && (
              <TimetableExportButton entries={filtered} variant="sidebar" />
            )}
          </div>
        </aside>

        {/* ── Main display area ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Mobile: row editor */}
          <div className="md:hidden border-b border-[var(--color-border)] px-4 py-4 bg-[var(--color-bg)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                Your Classes
              </p>
              <button
                onClick={addRow}
                className="flex items-center gap-1 px-3 h-8 rounded-md border border-[var(--color-border-strong)] font-mono text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add Row
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {rows.map((row, idx) => (
                <RowEditor
                  key={row.id}
                  row={row}
                  index={idx}
                  matchCount={rowMatches.find(m => m.id === row.id)?.count ?? 0}
                  showMatchHint={saved}
                  onUpdate={patch => updateRow(row.id, patch)}
                  onRemove={() => removeRow(row.id)}
                  canRemove={rows.length > 1}
                />
              ))}
            </div>

            {anyError && (
              <p className="text-xs text-red-500 font-mono mt-1">Fill all highlighted fields first.</p>
            )}

            <button
              onClick={handleSave}
              className="w-full h-11 rounded-md bg-[var(--color-text-primary)] text-[var(--color-bg)] font-body text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2"
            >
              {saved ? 'Update Results' : 'Save & Build Timetable'}
            </button>
          </div>

          {/* Search bar */}
          {saved && (
            <div className="sticky top-14 z-10 bg-[var(--color-bg)] px-4 py-3 border-b border-[var(--color-border)]">
              <SearchBar value={query} onChange={setQuery} />
            </div>
          )}

          {/* Results */}
          <div id="print-area" className="flex-1 px-4 pb-24 md:pb-8 bg-[var(--color-bg)]">
            {!saved ? (
              <div className="flex flex-col items-center justify-center text-center py-24 px-6">
                <div className="text-4xl mb-4 select-none">📋</div>
                <p className="font-body text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
                  Add your class selections above, then tap{' '}
                  <strong className="text-[var(--color-text-primary)]">Save & Build Timetable</strong>{' '}
                  to generate your schedule.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState query={query} batch="" dept="" message="No classes found for the selected rows." />
            ) : (
              grouped.map(({ day, entries }) => (
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
                          dept={entry.department}
                          conflicting={conflicts.has(key)}
                          onClick={() => setSelected(entry)}
                        />
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>

      {selected && (
        <TimetableDetail
          entry={selected}
          dept={selected.department}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── RowEditor sub-component ────────────────────────────────────────────────
interface RowEditorProps {
  row: CourseRow;
  index: number;
  matchCount: number;
  showMatchHint: boolean;
  onUpdate: (patch: Partial<CourseRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function RowEditor({ row, index, matchCount, showMatchHint, onUpdate, onRemove, canRemove }: RowEditorProps) {
  const errorBase = 'border-red-400 ring-1 ring-red-400';
  const normalBase = 'border-[var(--color-border-strong)]';

  const availableCourses = useMemo(() => {
    if (!row.batch || !row.stream || !row.category) return [];
    const coursesMap = new Map<string, string>();
    for (const e of allTimetableEntries) {
      if (e.batch === row.batch && e.department === row.stream && e.category === row.category) {
        const key = `${e.courseName}|${e.section}`;
        const label = `(${e.courseName})-${e.section}`;
        if (!coursesMap.has(key)) {
          coursesMap.set(key, label);
        }
      }
    }
    return Array.from(coursesMap.entries()).map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [row.batch, row.stream, row.category]);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-3 flex flex-col gap-3">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
          Class Selection {index + 1}
        </span>
        <div className="flex items-center gap-2">
          {showMatchHint && (
            <span
              className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={matchCount > 0
                ? { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }
                : { backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-tertiary)' }
              }
            >
              {matchCount > 0 ? `${matchCount} slot${matchCount !== 1 ? 's' : ''}` : 'not found'}
            </span>
          )}
          {canRemove && (
            <button
              onClick={onRemove}
              aria-label={`Remove course ${index + 1}`}
              className="w-6 h-6 flex items-center justify-center rounded text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Top 3 fields in a row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Batch */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Batch
            </label>
            <select
              value={row.batch}
              onChange={e => onUpdate({ batch: e.target.value, selection: '', errorBatch: false, errorSelection: false })}
              className={`h-9 px-2 rounded-md border text-xs font-mono bg-[var(--color-bg)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer ${row.errorBatch ? errorBase : normalBase}`}
              aria-invalid={row.errorBatch}
            >
              {availableBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Dept
            </label>
            <select
              value={row.stream}
              onChange={e => onUpdate({ stream: e.target.value, selection: '', errorStream: false, errorSelection: false })}
              className={`h-9 px-2 rounded-md border text-xs font-mono bg-[var(--color-bg)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer ${row.errorStream ? errorBase : normalBase}`}
              aria-invalid={row.errorStream}
            >
              <option value="" disabled>—</option>
              {TIMETABLE_DEPTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Category
            </label>
            <select
              value={row.category}
              onChange={e => onUpdate({ category: e.target.value, selection: '', errorCategory: false, errorSelection: false })}
              className={`h-9 px-2 rounded-md border text-xs font-mono bg-[var(--color-bg)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer ${row.errorCategory ? errorBase : normalBase}`}
              aria-invalid={row.errorCategory}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c === 'regular' ? 'Regular' : 'Repeat'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Course Selection (Full width below) */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
            Course & Section
          </label>
          <div className="relative">
            <select
              value={row.selection}
              onChange={e => onUpdate({ selection: e.target.value, errorSelection: false })}
              className={`w-full h-9 pl-2 pr-6 rounded-md border text-xs font-mono bg-[var(--color-bg)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer truncate ${row.errorSelection ? errorBase : normalBase}`}
              aria-invalid={row.errorSelection}
              disabled={!row.stream || availableCourses.length === 0}
            >
              <option value="" disabled>
                {!row.stream ? 'Select Dept first' : availableCourses.length === 0 ? 'No classes found' : 'Select (Course)-Section'}
              </option>
              {availableCourses.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
              <svg width="10" height="6" viewBox="0 0 12 7" fill="none" aria-hidden="true"><path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Inline error hints */}
      {(row.errorBatch || row.errorStream || row.errorCategory || row.errorSelection) && (
        <p className="font-mono text-[10px] text-red-500">
          {[
            row.errorStream && 'Select Dept',
            row.errorSelection && 'Select Course & Section',
          ].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}

export default function CustomTimetablePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <p className="font-mono text-sm text-[var(--color-text-tertiary)]">Loading…</p>
      </div>
    }>
      <CustomTimetableInner />
    </Suspense>
  );
}
