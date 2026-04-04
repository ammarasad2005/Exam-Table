'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DepartmentPill } from '@/components/DepartmentPill';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '@/lib/types';
import type { Department } from '@/lib/types';

// eslint-disable-next-line
const scheduleRaw = require('../../public/data/schedule.json');
const batches: string[] = [...new Set<string>(scheduleRaw.map((e: { batch: string }) => e.batch))]
  .sort()
  .reverse();

const STATS = [
  { value: String(scheduleRaw.length), label: 'exam slots' },
  { value: String(new Set<string>(scheduleRaw.map((e: { courseCode: string }) => e.courseCode)).size), label: 'courses' },
  { value: '5', label: 'departments' },
];

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
      router.push('/custom');
    }
  }

  // ─── Shared form pieces ───────────────────────────────────────────────────
  // Defined once, reused in both mobile and desktop JSX trees so
  // state, handlers, and markup stay perfectly in sync.

  const modeSelector = (
    <div>
      <p
        id="mode-label"
        className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2"
      >
        Mode
      </p>
      <div role="group" aria-labelledby="mode-label" className="grid grid-cols-2 gap-2">
        {(['default', 'custom'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className="h-11 rounded-md border font-body text-sm font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={mode === m ? {
              backgroundColor: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
              borderColor: 'transparent',
            } : {
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {m === 'default' ? 'Default Courses' : 'Custom Courses'}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        {mode === 'default'
          ? 'All exams for your batch and department automatically.'
          : 'Enter specific course codes — for irregular credit loads.'}
      </p>
    </div>
  );

  const batchAndDept = mode === 'default' ? (
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
            {batches.length > 0
              ? batches.map(b => <option key={b} value={b}>{b}</option>)
              : <option value="2023">2023</option>
            }
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
  ) : null;

  const ctaButton = (
    <button
      onClick={handleSubmit}
      style={{ height: '52px' }}
      className="w-full bg-[var(--color-text-primary)] text-[var(--color-bg)] rounded-md font-body font-medium text-base active:scale-[0.98] transition-transform hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {mode === 'default' ? 'View my exams →' : 'Enter course codes →'}
    </button>
  );

  return (
    <>
      {/* ================================================================
          MOBILE  (< 768px) — pixel-perfect original, nothing changed
      ================================================================ */}
      <main className="md:hidden min-h-dvh flex flex-col px-5 pt-safe-top pb-safe-bottom max-w-lg mx-auto">

        <header className="flex items-center justify-between h-14 flex-shrink-0">
          <div className="flex items-center">
            <img 
              src="/logo/logo.png" 
              alt="FAST Logo" 
              className="h-6 w-auto object-contain brightness-0 dark:invert transition-opacity" 
            />
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/ammarasad2005" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
            </a>
            <a href="https://linkedin.com/in/ammar-asad-563047289" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[#0a66c2] transition-colors dark:hover:text-[#3b82f6]" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-10 mb-8">
          <h1 className="font-display text-4xl leading-tight text-[var(--color-text-primary)]">
            Find your<br />
            <span className="italic">exam schedule.</span>
          </h1>
          <div className="mt-6 h-px bg-[var(--color-border)]" />
        </div>

        <div className="flex flex-col gap-6 flex-1">
          {modeSelector}
          {batchAndDept}
        </div>

        <div className="pb-8 pt-6 flex flex-col gap-8">
          {ctaButton}
        </div>
      </main>

      {/* ================================================================
          DESKTOP  (≥ 768px) — new two-column layout
      ================================================================ */}
      <div className="hidden md:flex min-h-dvh flex-col">

        {/* Full-width header */}
        <header className="flex items-center justify-between px-10 h-14 flex-shrink-0 border-b border-[var(--color-border)]">
          <div className="flex items-center">
            <img 
              src="/logo/logo.png" 
              alt="FAST Logo" 
              className="h-6 w-auto object-contain brightness-0 dark:invert transition-opacity" 
            />
          </div>
          <ThemeToggle />
        </header>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — hero + stats */}
          <div className="w-1/2 lg:w-[55%] flex flex-col justify-between px-10 lg:px-16 xl:px-24 py-14 border-r border-[var(--color-border)] relative overflow-hidden">

            {/* Dot-grid texture */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, var(--color-border-strong) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Headline block */}
            <div className="relative z-10">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] mb-6">
                FAST School of Computing — Exam Portal
              </p>
              <h1
                className="font-display leading-[1.1] text-[var(--color-text-primary)]"
                style={{ fontSize: 'clamp(2.4rem, 3.5vw, 3.6rem)' }}
              >
                Find your<br />
                <span className="italic">exam schedule.</span>
              </h1>
              <p className="mt-6 font-body text-base text-[var(--color-text-secondary)] max-w-sm leading-relaxed">
                Select your batch and department. Your full timetable — every
                date, time, and course — in one place.
              </p>
            </div>

            {/* Social / Developer Links */}
            <div className="relative z-10 flex gap-8">
              <a
                href="https://github.com/ammarasad2005"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                  <span className="font-mono text-sm font-medium">GitHub</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest pl-[28px]">@ammarasad2005</span>
              </a>

              <a
                href="https://linkedin.com/in/ammar-asad-563047289"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1 text-[var(--color-text-secondary)] hover:text-[#0a66c2] transition-colors dark:hover:text-[#3b82f6]"
              >
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="font-mono text-sm font-medium">LinkedIn</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest pl-[28px]">Connect</span>
              </a>
            </div>
          </div>

          {/* RIGHT — form card, vertically centered */}
          <div className="flex-1 flex items-center justify-center px-10 lg:px-16 xl:px-24 py-14">
            <div className="w-full max-w-sm">

              <div className="bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded-2xl p-8 lg:p-10 flex flex-col gap-6">
                {modeSelector}
                {/* Full-bleed divider inside card */}
                <div className="h-px bg-[var(--color-border)] -mx-8 lg:-mx-10" />
                {batchAndDept}
                {ctaButton}
              </div>

              <p className="mt-5 font-mono text-[11px] text-[var(--color-text-tertiary)] text-center leading-relaxed">
                Data updates for all examinations.{' '}
              </p>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
