'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DepartmentPill } from '@/components/DepartmentPill';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '@/lib/types';
import type { Department } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const scheduleRaw = require('../../public/data/schedule.json');
const batches: string[] = [...new Set<string>(scheduleRaw.map((e: { batch: string }) => e.batch))]
  .sort()
  .reverse();

type Mode = 'default' | 'custom';

export default function SetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('default');
  const [batch, setBatch] = useState<string>(batches[0] ?? '2023');
  const [dept, setDept] = useState<Department>('CS');

  function handleSubmit() {
    if (mode === 'default') {
      router.push(`/schedule?batch=${batch}&dept=${dept}`);
    } else {
      // Custom mode: batch & stream are selected per-row on the next page
      router.push('/custom');
    }
  }

  return (
    <main className="min-h-dvh flex flex-col px-5 pt-safe-top pb-safe-bottom max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between h-14 flex-shrink-0">
        <span className="font-mono text-sm font-medium tracking-widest text-[var(--color-text-secondary)] uppercase">
          FSC
        </span>
        <ThemeToggle />
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

        {/* Mode Selection */}
        <div>
          <p
            id="mode-label"
            className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2"
          >
            Mode
          </p>
          <div
            role="group"
            aria-labelledby="mode-label"
            className="grid grid-cols-2 gap-2"
          >
            <button
              onClick={() => setMode('default')}
              aria-pressed={mode === 'default'}
              className="h-11 rounded-md border font-body text-sm font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
              style={mode === 'default' ? {
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-bg)',
                borderColor: 'transparent',
              } : {
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Default Courses
            </button>
            <button
              onClick={() => setMode('custom')}
              aria-pressed={mode === 'custom'}
              className="h-11 rounded-md border font-body text-sm font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
              style={mode === 'custom' ? {
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-bg)',
                borderColor: 'transparent',
              } : {
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Custom Courses
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            {mode === 'default'
              ? 'All exams for your batch and department automatically.'
              : 'Enter specific course codes — for irregular credit loads.'}
          </p>
        </div>

        {/* Batch & Department (Default mode only) */}
        {mode === 'default' && (
          <>
            {/* Batch */}
            <div>
              <label
                htmlFor="batch-select"
                className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2"
              >
                Batch year
              </label>
              <div className="relative">
                <select
                  id="batch-select"
                  value={batch}
                  onChange={e => setBatch(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 bg-[var(--color-bg-raised)] border border-[var(--color-border-strong)] rounded-md font-mono text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer"
                >
                  {batches.length > 0 ? (
                    batches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))
                  ) : (
                    <option value="2023">2023</option>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
                  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" aria-hidden="true">
                    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <p
                id="department-label"
                className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2"
              >
                Department
              </p>
              <div
                role="group"
                aria-labelledby="department-label"
                className="grid grid-cols-3 gap-2 sm:grid-cols-5"
              >
                {DEPARTMENTS.map(d => (
                  <DepartmentPill
                    key={d}
                    dept={d}
                    selected={dept === d}
                    onClick={() => setDept(d)}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                {DEPARTMENT_LABELS[dept]}
              </p>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="pb-8 pt-6">
        <button
          onClick={handleSubmit}
          style={{ height: '52px' }}
          className="w-full bg-[var(--color-text-primary)] text-[var(--color-bg)] rounded-md font-body font-medium text-base active:scale-[0.98] transition-transform hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {mode === 'default' ? 'View my exams →' : 'Enter course codes →'}
        </button>
      </div>
    </main>
  );
}
