'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, Suspense } from 'react';
import { filterExams, groupByDay } from '@/lib/filter';
import { ExamCard } from '@/components/ExamCard';
import { ExamDetail } from '@/components/ExamDetail';
import { SearchBar } from '@/components/SearchBar';
import { ExportButton } from '@/components/ExportButton';
import { EmptyState } from '@/components/EmptyState';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { ExamEntry, Department } from '@/lib/types';

// eslint-disable-next-line
const scheduleData = require('../../../public/data/schedule.json');
const allExams = scheduleData as ExamEntry[];

function SchedulePageInner() {
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
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 flex items-center gap-2">
          <span
            className="font-mono text-sm font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: `var(--accent-${dept.toLowerCase()}-bg)`,
              color: `var(--accent-${dept.toLowerCase()})`,
            }}
          >
            {dept}
          </span>
          <span className="font-mono text-sm text-[var(--color-text-secondary)]">Batch {batch}</span>
        </div>
        <ThemeToggle />
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
            <p
              className="font-mono text-sm font-medium"
              style={{ color: `var(--accent-${dept.toLowerCase()})` }}
            >
              {dept}
            </p>
          </div>
          <div className="h-px bg-[var(--color-border)]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Found</p>
            <p className="font-mono text-2xl font-medium">{filtered.length}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">exam{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <button
              onClick={() => router.push('/')}
              className="text-xs text-[var(--color-text-secondary)] underline underline-offset-2 text-left hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2"
            >
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
          <div id="print-area" className="flex-1 px-4 pb-24 md:pb-8 bg-[var(--color-bg)]">
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

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <p className="font-mono text-sm text-[var(--color-text-tertiary)]">Loading…</p>
      </div>
    }>
      <SchedulePageInner />
    </Suspense>
  );
}
