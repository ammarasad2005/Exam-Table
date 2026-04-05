'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useId, Suspense } from 'react';
import { ExamCard } from '@/components/ExamCard';
import { ExamDetail } from '@/components/ExamDetail';
import { SearchBar } from '@/components/SearchBar';
import { ExportButton } from '@/components/ExportButton';
import { EmptyState } from '@/components/EmptyState';
import { ThemeToggle } from '@/components/ThemeToggle';
import { groupByDay } from '@/lib/filter';
import { sortByChronological } from '@/lib/dates';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '@/lib/types';
import type { ExamEntry } from '@/lib/types';

// eslint-disable-next-line
const scheduleData = require('../../../public/data/schedule.json');
const allExams = scheduleData as ExamEntry[];

// Derive available batches from data
const availableBatches: string[] = [...new Set<string>(allExams.map(e => e.batch))]
  .sort()
  .reverse();

interface CourseRow {
  id: string;
  batch: string;
  stream: string;
  code: string;
  // validation state
  errorBatch: boolean;
  errorStream: boolean;
  errorCode: boolean;
}

function makeRow(id: string): CourseRow {
  return {
    id,
    batch: availableBatches[0] ?? '2023',
    stream: '',
    code: '',
    errorBatch: false,
    errorStream: false,
    errorCode: false,
  };
}

function findExams(entry: CourseRow): ExamEntry[] {
  const code = entry.code.trim().toUpperCase();
  if (!code || !entry.stream || !entry.batch) return [];
  return allExams.filter(e =>
    e.courseCode === code &&
    e.department === entry.stream &&
    e.batch === entry.batch
  );
}

function CustomPageInner() {
  const router = useRouter();
  const baseId = useId();
  const [rows, setRows] = useState<CourseRow[]>([makeRow(`${baseId}-0`)]);
  const [nextIdx, setNextIdx] = useState(1);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ExamEntry | null>(null);

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
      const codeOk = /^[A-Za-z\d\- ]+$/.test(r.code.trim());
      const eb = !r.batch;
      const es = !r.stream;
      const ec = !codeOk;
      if (eb || es || ec) hasError = true;
      return { ...r, errorBatch: eb, errorStream: es, errorCode: ec };
    });
    setRows(validated);
    if (!hasError) setSaved(true);
  }

  // ── Compute results ──────────────────────────────────────────────────────
  const savedMatches = useMemo(() => {
    if (!saved) return [];
    const seen = new Set<string>();
    const result: ExamEntry[] = [];
    for (const row of rows) {
      for (const exam of findExams(row)) {
        const key = `${exam.date}|${exam.time}|${exam.courseCode}|${exam.batch}|${exam.department}`;
        if (!seen.has(key)) { seen.add(key); result.push(exam); }
      }
    }
    return result.sort(sortByChronological);
  }, [saved, rows]);

  const filtered = useMemo(() => {
    if (!query.trim()) return savedMatches;
    const q = query.toLowerCase();
    return savedMatches.filter(e =>
      e.courseCode.toLowerCase().includes(q) ||
      e.courseName.toLowerCase().includes(q)
    );
  }, [savedMatches, query]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  // ── Per-row "not found" hint ─────────────────────────────────────────────
  const rowMatches = useMemo(() =>
    rows.map(r => ({ id: r.id, count: findExams(r).length })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  );

  const anyError = saved === false && rows.some(r => r.errorBatch || r.errorStream || r.errorCode);

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
          <span className="font-mono text-sm font-medium text-[var(--color-text-primary)]">Custom Courses</span>
        </div>
        <ThemeToggle />
        {saved && <ExportButton entries={filtered} />}
      </header>

      <div className="flex flex-1 md:gap-0">

        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden md:flex md:w-72 lg:w-80 flex-col border-r border-[var(--color-border)] sticky top-14 h-[calc(100dvh-56px)] overflow-y-auto">
          <div className="flex-1 px-5 py-5 flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                Your Courses
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
                {savedMatches.length} exam slot{savedMatches.length !== 1 ? 's' : ''} found
              </p>
            )}
            <button
              onClick={handleSave}
              className="w-full h-10 rounded-md bg-[var(--color-text-primary)] text-[var(--color-bg)] font-body text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2"
            >
              {saved ? 'Update Results' : 'Save & Find Exams'}
            </button>
            {saved && (
              <ExportButton entries={filtered} variant="sidebar" />
            )}
          </div>
        </aside>

        {/* ── Main list area ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Mobile: row editor */}
          <div className="md:hidden border-b border-[var(--color-border)] px-4 py-4 bg-[var(--color-bg)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
                Your Courses
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
              {saved ? 'Update Results' : 'Save & Find Exams'}
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
                  Add your course rows above, then tap{' '}
                  <strong className="text-[var(--color-text-primary)]">Save & Find Exams</strong>{' '}
                  to see your schedule.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState query={query} batch="" dept="CS" />
            ) : (
              grouped.map(({ label, entries }) => (
                <section key={label} className="mt-6 first:mt-4">
                  <h2 className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                    {label}
                  </h2>
                  <div className="flex flex-col gap-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
                    {entries.map(exam => (
                      <ExamCard
                        key={`${exam.date}-${exam.courseCode}-${exam.time}-${exam.department}-${exam.batch}`}
                        exam={exam}
                        dept={exam.department}
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

      {selected && (
        <ExamDetail
          exam={selected}
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

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-3 flex flex-col gap-2">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
          Course {index + 1}
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

      {/* Three fields in a row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Batch */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
            Batch
          </label>
          <select
            value={row.batch}
            onChange={e => onUpdate({ batch: e.target.value, errorBatch: false })}
            className={`h-9 px-2 rounded-md border text-xs font-mono bg-[var(--color-bg)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer ${row.errorBatch ? errorBase : normalBase}`}
            aria-invalid={row.errorBatch}
          >
            {availableBatches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Stream */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
            Stream
          </label>
          <select
            value={row.stream}
            onChange={e => onUpdate({ stream: e.target.value, errorStream: false })}
            className={`h-9 px-2 rounded-md border text-xs font-mono bg-[var(--color-bg)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer ${row.errorStream ? errorBase : normalBase}`}
            aria-invalid={row.errorStream}
          >
            <option value="" disabled>—</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d} title={DEPARTMENT_LABELS[d]}>{d}</option>
            ))}
          </select>
        </div>

        {/* Code */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
            Code
          </label>
          <input
            type="text"
            value={row.code}
            placeholder="CS2005"
            maxLength={10}
            onChange={e => onUpdate({ code: e.target.value.toUpperCase(), errorCode: false })}
            className={`h-9 px-2 rounded-md border text-xs font-mono bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] uppercase placeholder:normal-case placeholder:text-[var(--color-text-tertiary)] ${row.errorCode ? errorBase : normalBase}`}
            aria-invalid={row.errorCode}
            aria-label={`Course code for row ${index + 1}`}
          />
        </div>
      </div>

      {/* Inline error hints */}
      {(row.errorBatch || row.errorStream || row.errorCode) && (
        <p className="font-mono text-[10px] text-red-500">
          {[
            row.errorStream && 'Select a stream',
            row.errorCode && 'Enter a valid code (e.g. CS2005)',
          ].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}

export default function CustomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <p className="font-mono text-sm text-[var(--color-text-tertiary)]">Loading…</p>
      </div>
    }>
      <CustomPageInner />
    </Suspense>
  );
}
