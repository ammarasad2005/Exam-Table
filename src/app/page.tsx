'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DepartmentPill } from '@/components/DepartmentPill';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SCHOOLS, SCHOOL_DEPARTMENTS, DEPARTMENT_LABELS } from '@/lib/types';
import { flattenTimetable, getAvailableSections } from '@/lib/timetable-filter';
import type { RawTimetableJSON } from '@/lib/types';

// eslint-disable-next-line
const scheduleRaw = require('../../public/data/schedule.json');
const batches: string[] = [...new Set<string>(scheduleRaw.map((e: { batch: string }) => e.batch))]
  .sort()
  .reverse();

// eslint-disable-next-line
const timetableRaw: RawTimetableJSON = require('../../public/data/timetable.json');
const allTimetableEntries = flattenTimetable(timetableRaw);
const timetableBatches: string[] = [...new Set<string>(allTimetableEntries.map(e => e.batch))].sort().reverse();



type Mode = 'default' | 'custom';
type Feature = 'exams' | 'timetable';

// FSC-only departments for the timetable (from the Python data)
const TIMETABLE_DEPTS = ['CS', 'AI', 'DS', 'CY', 'SE'];

// Typing animation strings — one per feature
const HERO_TEXTS: Record<Feature, string> = {
  exams:
    'Select your batch and department. Your full exam schedule — every date, time, and course — in one place.',
  timetable:
    'Select your batch, department and section. Your weekly class timetable — every slot, room, and timing — instantly.',
};

export default function SetupPage() {
  const router = useRouter();

  const [feature, setFeature] = useState<Feature>('timetable');
  const [mode, setMode] = useState<Mode>('default');

  // Shared form state
  const [batch, setBatch] = useState<string>('-');
  const [school, setSchool] = useState<string>('-');
  const [dept, setDept] = useState<string>('');
  const [section, setSection] = useState<string>('');

  // Typing animation
  const fullText = HERO_TEXTS[feature];
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Reset typing animation whenever feature changes
  useEffect(() => {
    setDisplayText('');
    setIsTypingComplete(false);
    let i = 0;
    const iv = setInterval(() => {
      setDisplayText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) { clearInterval(iv); setIsTypingComplete(true); }
    }, 22);
    return () => clearInterval(iv);
  }, [feature, fullText]);

  // Dynamically derive available sections from loaded timetable data
  const availableSections = useMemo(
    () => (feature === 'timetable' && batch !== '-' && dept)
      ? getAvailableSections(allTimetableEntries, batch, dept)
      : [],
    [feature, batch, dept]
  );

  // Reset section when dept/batch changes
  useEffect(() => {
    setSection('');
  }, [batch, dept, feature]);

  // When feature changes to exams, re-validate batch against exam batches
  useEffect(() => {
    if (feature === 'exams' && batch !== '-' && !batches.includes(batch)) setBatch('-');
    if (feature === 'timetable' && batch !== '-' && !timetableBatches.includes(batch)) setBatch('-');
  }, [feature, batch]);

  function handleSubmit() {
    if (feature === 'exams') {
      if (mode === 'default') {
        if (batch === '-' || school === '-' || !dept) return;
        router.push(`/schedule?batch=${batch}&school=${school}&dept=${dept}`);
      } else {
        router.push('/custom');
      }
    } else {
      if (mode === 'default') {
        if (batch === '-' || !dept || !section) return;
        router.push(`/timetable?batch=${batch}&dept=${dept}&section=${section}`);
      } else {
        router.push('/timetable/custom');
      }
    }
  }

  const activeBatches = feature === 'timetable' ? timetableBatches : batches;
  const examCtaDisabled = mode === 'default' && (batch === '-' || school === '-' || !dept);
  const timetableCtaDisabled = mode === 'default' && (batch === '-' || !dept || !section);
  const ctaDisabled = feature === 'exams' ? examCtaDisabled : timetableCtaDisabled;

  // ─── Shared UI pieces ──────────────────────────────────────────────────────

  const featureSelector = (
    <div>
      <p
        id="feature-label"
        className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2"
      >
        Feature
      </p>
      <div role="group" aria-labelledby="feature-label" className="grid grid-cols-2 gap-2">
        {(['timetable', 'exams'] as Feature[]).map(f => (
          <button
            key={f}
            id={`feature-${f}`}
            onClick={() => { setFeature(f); setMode('default'); }}
            aria-pressed={feature === f}
            className="h-11 rounded-md border font-body text-sm font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={feature === f ? {
              backgroundColor: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
              borderColor: 'transparent',
            } : {
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {f === 'exams' ? 'Exam Finder' : 'Timetable'}
          </button>
        ))}
      </div>
    </div>
  );

  const modeSelector = (
    <div>
      <p
        id="mode-label"
        className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2"
      >
        Mode
      </p>
      <div role="group" aria-labelledby="mode-label" className="grid grid-cols-2 gap-2">
        {(['default', 'custom'] as Mode[]).map(m => (
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
        {feature === 'exams'
          ? (mode === 'default'
            ? 'All exams for your batch and department automatically.'
            : 'Enter specific course codes — for irregular credit loads.')
          : (mode === 'default'
            ? 'All classes for your batch and department automatically.'
            : 'Select specific classes — for cross-section or repeat courses.')}
      </p>
    </div>
  );

  // Batch selector — shared between both features but only shown in 'default' mode
  const batchSelector = mode === 'default' ? (
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
          onChange={e => { setBatch(e.target.value); setDept(''); setSection(''); }}
          className="w-full h-12 pl-4 pr-10 bg-[var(--color-bg-raised)] border border-[var(--color-border-strong)] rounded-md font-mono text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer"
        >
          {batch === '-' && <option value="-">-</option>}
          {activeBatches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
          <svg width="12" height="7" viewBox="0 0 12 7" fill="none" aria-hidden="true">
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  ) : null;

  // School selector — only for exam feature
  const schoolSelector = feature === 'exams' && mode === 'default' ? (
    <div>
      <label
        htmlFor="school-select"
        className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2"
      >
        School
      </label>
      <div className="relative">
        <select
          id="school-select"
          value={school}
          onChange={e => {
            const s = e.target.value;
            setSchool(s);
            if (s !== '-' && SCHOOL_DEPARTMENTS[s]) setDept(SCHOOL_DEPARTMENTS[s][0]);
            else setDept('');
          }}
          className="w-full h-12 pl-4 pr-10 bg-[var(--color-bg-raised)] border border-[var(--color-border-strong)] rounded-md font-mono text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cs)] cursor-pointer"
        >
          {school === '-' && <option value="-">-</option>}
          {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
          <svg width="12" height="7" viewBox="0 0 12 7" fill="none" aria-hidden="true">
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  ) : null;

  // Department pills — for exams (school-gated) or timetable (FSC only)
  const deptPills = (feature === 'exams' && mode === 'default') ? (
    <div>
      {school === '-' ? (
        <div className="h-12 flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)] italic">
          Good Luck for Exams 😊
        </div>
      ) : (
        <>
          <p id="department-label" className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
            Department
          </p>
          <div role="group" aria-labelledby="department-label" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {SCHOOL_DEPARTMENTS[school]?.map(d => (
              <DepartmentPill key={d} dept={d} selected={dept === d} onClick={() => setDept(d)} />
            ))}
          </div>
          {dept && (
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{DEPARTMENT_LABELS[dept]}</p>
          )}
        </>
      )}
    </div>
  ) : (feature === 'timetable' && mode === 'default') ? (
    <div>
      <p id="tt-department-label" className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
        Department
      </p>
      <div role="group" aria-labelledby="tt-department-label" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {TIMETABLE_DEPTS.map(d => (
          <DepartmentPill key={d} dept={d} selected={dept === d} onClick={() => setDept(d)} />
        ))}
      </div>
      {dept && (
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{DEPARTMENT_LABELS[dept]}</p>
      )}
    </div>
  ) : null;

  // Section pills — only for timetable
  const sectionPills = (feature === 'timetable' && mode === 'default') && dept && batch !== '-' ? (
    <div>
      <p id="section-label" className="block font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
        Section
      </p>
      {availableSections.length === 0 ? (
        <p className="text-xs text-[var(--color-text-tertiary)] italic h-11 flex items-center">
          {allTimetableEntries.length === 0
            ? 'No timetable data yet — run the Python script first.'
            : 'No sections found for this batch & department.'}
        </p>
      ) : (
        <div role="group" aria-labelledby="section-label" className="flex flex-wrap gap-2">
          {availableSections.map(s => (
            <button
              key={s}
              id={`section-${s}`}
              onClick={() => setSection(s)}
              aria-pressed={section === s}
              className="h-11 min-w-[3.5rem] px-3 rounded-md border font-mono text-sm font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
              style={section === s ? {
                backgroundColor: `var(--accent-${dept.toLowerCase()}-bg)`,
                color: `var(--accent-${dept.toLowerCase()})`,
                boxShadow: `0 0 0 2px var(--accent-${dept.toLowerCase()})`,
                borderColor: 'transparent',
              } : {
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;

  const ctaButton = (
    <button
      id="cta-button"
      onClick={handleSubmit}
      disabled={ctaDisabled}
      style={{ height: '52px' }}
      className={`w-full rounded-md font-body font-medium text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${ctaDisabled
          ? 'bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] cursor-not-allowed'
          : 'bg-[var(--color-text-primary)] text-[var(--color-bg)] active:scale-[0.98] hover:opacity-90'
        }`}
    >
      {feature === 'timetable'
        ? 'View my timetable →'
        : mode === 'default'
          ? 'View my exams →'
          : 'Enter course codes →'}
    </button>
  );



  return (
    <>
      {/* ================================================================
          MOBILE  (< 768px)
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
            <a href="https://github.com/ammarasad2005/Exam-Table" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
            </a>
            <a href="https://linkedin.com/in/ammar-asad-563047289" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[#0a66c2] transition-colors dark:hover:text-[#3b82f6]" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-10 mb-8">
          <h1 className="font-display text-4xl leading-tight text-[var(--color-text-primary)]">
            {feature === 'exams' ? (
              <>Find your<br /><span className="italic">exam schedule.</span></>
            ) : (
              <>Find your<br /><span className="italic">class timetable.</span></>
            )}
          </h1>
          <div className="mt-6 h-px bg-[var(--color-border)]" />
        </div>

        <div className="flex flex-col gap-6 flex-1">
          {featureSelector}
          {modeSelector}
          {batchSelector}
          {schoolSelector}
          {deptPills}
          {sectionPills}
        </div>

        <div className="pb-8 pt-6 flex flex-col gap-8">
          {ctaButton}
        </div>
      </main>

      {/* ================================================================
          DESKTOP  (≥ 768px) — two-column layout
      ================================================================ */}
      <div className="hidden md:flex min-h-dvh flex-col">

        {/* Full-width header */}
        <header
          className="flex items-center justify-between px-10 h-14 flex-shrink-0 border-b border-[var(--color-border)]"
          style={{ boxShadow: 'var(--shadow-header)', position: 'relative', zIndex: 1 }}
        >
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/logo/logo.png"
              alt="FAST Logo"
              className="h-6 w-auto object-contain brightness-0 dark:invert transition-opacity"
            />
          </div>

          {/* Feature toggle — prominent centre nav */}
          <div role="group" aria-label="Select feature" className="flex items-center gap-1 bg-[var(--color-bg-subtle)] rounded-lg p-1">
            {(['timetable', 'exams'] as Feature[]).map(f => (
              <button
                key={f}
                id={`desktop-feature-${f}`}
                onClick={() => { setFeature(f); setMode('default'); }}
                aria-pressed={feature === f}
                className="h-8 px-5 rounded-md font-body text-sm font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                style={feature === f ? {
                  backgroundColor: 'var(--color-text-primary)',
                  color: 'var(--color-bg)',
                } : {
                  color: 'var(--color-text-secondary)',
                }}
              >
                {f === 'exams' ? 'Exam Finder' : 'Timetable'}
              </button>
            ))}
          </div>

          <ThemeToggle />
        </header>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — hero + stats */}
          <div
            className="w-1/2 lg:w-[55%] flex flex-col justify-between px-10 lg:px-16 xl:px-24 py-14 border-r border-[var(--color-border)] relative overflow-hidden"
          >

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
                FAST NUCES, Isb — {feature === 'exams' ? 'Exam Portal' : 'Timetable Portal'}
              </p>
              <h1
                className="font-display leading-[1.1] text-[var(--color-text-primary)]"
                style={{ fontSize: 'clamp(2.4rem, 3.5vw, 3.6rem)' }}
              >
                {feature === 'exams' ? (
                  <>Find your<br /><span className="italic">exam schedule.</span></>
                ) : (
                  <>Find your<br /><span className="italic">class timetable.</span></>
                )}
              </h1>
              <p className="mt-6 font-body text-base text-[var(--color-text-secondary)] max-w-sm leading-relaxed min-h-[4.5rem]">
                {displayText}
                {!isTypingComplete && (
                  <span className="inline-block w-[2px] h-[1em] bg-[var(--color-text-tertiary)] animate-pulse ml-1 align-middle" />
                )}
                <span className="sr-only">{fullText}</span>
              </p>

              {/* Stats row removed */}
            </div>

            {/* Social / Developer Links */}
            <div className="relative z-10 flex gap-8">
              <a
                href="https://github.com/ammarasad2005/Exam-Table"
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
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="font-mono text-sm font-medium">LinkedIn</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest pl-[28px] h-3 block"></span>
              </a>
            </div>
          </div>

          {/* RIGHT — form card */}
          <div className="flex-1 relative flex items-center justify-center px-10 lg:px-16 xl:px-24 py-14">
            <div className="w-full max-w-sm">

              <div
                className="bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded-2xl p-8 lg:p-10 flex flex-col gap-6"
                style={{ boxShadow: 'var(--shadow-raised), var(--border-inset)' }}
              >
                {modeSelector}
                {batchSelector}
                {schoolSelector}
                {deptPills}
                {sectionPills}
                {ctaButton}
              </div>

              <p className="mt-5 font-mono text-[11px] text-[var(--color-text-tertiary)] text-center leading-relaxed">
                {feature === 'exams'
                  ? 'Data updates for all examinations.'
                  : 'Time-Table for Spring 2026.'}
              </p>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
