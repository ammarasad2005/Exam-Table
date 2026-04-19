'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { FloatingMenu } from '@/components/FloatingMenu';

// ── Data ─────────────────────────────────────────────────────────────────────

const KEY_DATES = [
  { badge: 'Start',       type: 'milestone', label: 'First day of classes',                    date: 'Mon, 19 Jan 2026' },
  { badge: 'Deadline',    type: 'deadline',  label: 'Add & Drop of courses / labs',            date: 'Sat, 31 Jan 2026' },
  { badge: 'Deadline',    type: 'deadline',  label: 'Semester Freeze',                          date: 'Fri, 6 Feb 2026'  },
  { badge: 'Sessional 1', type: 'exam',      label: 'First Sessional Examination',             date: '21–25 Feb 2026'   },
  { badge: 'Results',     type: 'info',      label: 'First Sessional results announced',       date: 'Wed, 4 Mar 2026'  },
  { badge: 'Sessional 2', type: 'exam',      label: 'Second Sessional Examination',            date: '9–13 Apr 2026'    },
  { badge: 'Results',     type: 'info',      label: 'Second Sessional results announced',      date: 'Fri, 17 Apr 2026' },
  { badge: 'End',         type: 'milestone', label: 'Last day of classes',                     date: 'Fri, 8 May 2026'  },
  { badge: 'Deadline',    type: 'deadline',  label: 'Course withdrawal deadline / Makeup week', date: '11–15 May 2026'  },
  { badge: 'Finals',      type: 'exam',      label: 'Final Examinations',                      date: '18 May – 12 Jun 2026' },
  { badge: 'Results',     type: 'info',      label: 'Final Examination results announced',     date: 'Mon, 15 Jun 2026' },
];

const HOLIDAYS = [
  { name: 'Kashmir Day',   date: '5 Feb 2026',    lunar: false },
  { name: 'Eid-ul-Fitr',  date: '19–21 Mar 2026', lunar: true  },
  { name: 'Pakistan Day',  date: '23 Mar 2026',   lunar: false },
  { name: 'Labour Day',    date: '1 May 2026',    lunar: false },
  { name: 'Eid-ul-Azha',  date: '28–30 May 2026', lunar: true  },
];

// Calendar helpers
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June'];
const DOW_SHORT   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function addRange(set: Set<string>, y: number, m: number, d1: number, d2: number) {
  for (let d = d1; d <= d2; d++) set.add(`${y}-${m}-${d}`);
}

// m is 1-indexed here to match original JS exactly
const examDays     = new Set<string>();
const deadlineDays = new Set<string>();
const holidayDays  = new Set<string>();
addRange(examDays,     2026,  2, 21, 25);
addRange(examDays,     2026,  4,  9, 13);
addRange(examDays,     2026,  5, 18, 31);
addRange(examDays,     2026,  6,  1, 12);
deadlineDays.add('2026-1-31');
deadlineDays.add('2026-2-6');
addRange(deadlineDays, 2026,  5, 11, 15);
holidayDays.add('2026-2-5');
addRange(holidayDays,  2026,  3, 19, 21);
holidayDays.add('2026-3-23');
holidayDays.add('2026-5-1');
addRange(holidayDays,  2026,  5, 28, 30);

type DayKind = 'today' | 'classes-start' | 'exam' | 'deadline' | 'holiday' | 'normal' | 'empty';

function classifyDay(y: number, m1: number, d: number): DayKind {
  const today = new Date();
  if (today.getFullYear() === y && today.getMonth() + 1 === m1 && today.getDate() === d) return 'today';
  if ((m1 === 1 && d === 19) || (m1 === 5 && d === 8)) return 'classes-start';
  const key = `${y}-${m1}-${d}`;
  if (examDays.has(key))     return 'exam';
  if (deadlineDays.has(key)) return 'deadline';
  if (holidayDays.has(key))  return 'holiday';
  return 'normal';
}

// ── Badge colour maps (theme-aware via CSS vars) ──────────────────────────────

const BADGE_STYLES: Record<string, { bg: string; text: string; border?: string }> = {
  exam:      { bg: 'var(--accent-cs-bg)',  text: 'var(--accent-cs)'  },
  deadline:  { bg: 'var(--accent-ee-bg)',  text: 'var(--accent-ee)'  },
  milestone: { bg: 'var(--accent-ds-bg)',  text: 'var(--accent-ds)'  },
  info:      { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-secondary)' },
};

const BORDER_COLORS: Record<string, string> = {
  exam:      'var(--accent-cs)',
  deadline:  'var(--accent-ee)',
  milestone: 'var(--accent-ds)',
};

const DAY_STYLES: Record<DayKind, { bg: string; color: string; fw?: string }> = {
  today:         { bg: 'var(--accent-cs)',      color: '#fff',                          fw: '600' },
  'classes-start':{ bg: 'var(--accent-ds)',     color: '#fff',                          fw: '600' },
  exam:          { bg: 'var(--accent-cs-bg)',    color: 'var(--accent-cs)',              fw: '500' },
  deadline:      { bg: 'var(--accent-ee-bg)',    color: 'var(--accent-ee)',              fw: '500' },
  holiday:       { bg: 'var(--accent-cy-bg)',    color: 'var(--accent-cy)',              fw: '500' },
  normal:        { bg: 'transparent',            color: 'var(--color-text-secondary)'             },
  empty:         { bg: 'transparent',            color: 'transparent'                             },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SemesterPlanPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* ================================================================
          MOBILE  (< 768px)
      ================================================================ */}
      <main className="md:hidden min-h-dvh flex flex-col bg-[var(--color-bg)]">
        <Header />
        <div className="flex flex-col flex-1 px-5 pb-28 pt-4 max-w-lg mx-auto w-full gap-10">
          <MobileHero />
          <KeyDatesSection />
          <HolidaysSection />
          {mounted && <CalendarsSection />}
        </div>
        <FloatingMenu />
      </main>

      {/* ================================================================
          DESKTOP  (≥ 768px)
      ================================================================ */}
      <div className="hidden md:flex min-h-dvh flex-col bg-[var(--color-bg)]">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto w-full px-10 lg:px-16 py-14 flex flex-col gap-12">
          <DesktopHero />
          <KeyDatesSection />
          {mounted && <CalendarsSection />}
          <HolidaysSection />
        </div>
        <div className="pb-20" /> {/* spacer for navbar */}
        <Navbar />
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MobileHero() {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">
        FAST NUCES · Islamabad
      </p>
      <h1 className="font-display text-3xl leading-tight text-[var(--color-text-primary)]">
        Semester Schedule<br /><span className="italic">Spring 2026.</span>
      </h1>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-text-tertiary)]">
        Signed Jan 8, 2026
      </p>
    </div>
  );
}

function DesktopHero() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4">
        FAST NUCES · Islamabad · Signed Jan 8, 2026
      </p>
      <h1
        className="font-display leading-[1.1] text-[var(--color-text-primary)]"
        style={{ fontSize: 'clamp(2.2rem, 3vw, 3rem)' }}
      >
        Semester Schedule — <span className="italic">Spring 2026.</span>
      </h1>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4">
      {children}
    </p>
  );
}

function KeyDatesSection() {
  return (
    <section>
      <SectionLabel>Key dates at a glance</SectionLabel>
      <div className="flex flex-col gap-2">
        {KEY_DATES.map((ev, i) => {
          const isKey = ev.type !== 'info';
          const badgeStyle = BADGE_STYLES[ev.type];
          const borderColor = isKey ? BORDER_COLORS[ev.type] : undefined;

          return (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-raised)',
                boxShadow: 'var(--shadow-card)',
                ...(isKey && {
                  borderLeftWidth: '3px',
                  borderLeftColor: borderColor,
                  borderRadius: '0 12px 12px 0',
                }),
              }}
            >
              {/* Badge */}
              <span
                className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: badgeStyle.bg,
                  color: badgeStyle.text,
                }}
              >
                {ev.badge}
              </span>

              {/* Label */}
              <span className="font-body text-sm text-[var(--color-text-primary)] flex-1 min-w-0">
                {ev.label}
              </span>

              {/* Date */}
              <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] shrink-0 ml-2">
                {ev.date}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CalendarsSection() {
  const months = [0, 1, 2, 3, 4, 5]; // Jan–Jun 2026 (0-indexed)

  return (
    <section>
      <SectionLabel>Monthly calendars</SectionLabel>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
        {[
          { label: 'Classes start / Last day', bg: 'var(--accent-ds)',                                border: undefined },
          { label: 'Exam period',              bg: 'var(--accent-cs-bg)',                             border: 'var(--accent-cs)' },
          { label: 'Deadline',                 bg: 'var(--accent-ee-bg)',                             border: 'var(--accent-ee)' },
          { label: 'Holiday',                  bg: 'var(--accent-cy-bg)',                             border: 'var(--accent-cy)' },
          { label: 'Today',                    bg: 'var(--accent-cs)',                                border: undefined },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-[3px] shrink-0"
              style={{ background: l.bg, ...(l.border && { border: `1px solid ${l.border}` }) }}
            />
            <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {months.map((mi) => {
          const m1 = mi + 1; // 1-indexed month
          const year = 2026;
          const firstDay = new Date(year, mi, 1).getDay();
          const daysInMonth = new Date(year, mi + 1, 0).getDate();
          const cells: { d: number | null; kind: DayKind }[] = [];

          for (let i = 0; i < firstDay; i++) cells.push({ d: null, kind: 'empty' });
          for (let d = 1; d <= daysInMonth; d++) cells.push({ d, kind: classifyDay(year, m1, d) });

          return (
            <div
              key={mi}
              className="rounded-2xl border p-4"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-raised)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p className="font-mono text-xs font-semibold text-center text-[var(--color-text-primary)] mb-3">
                {MONTH_NAMES[mi]} {year}
              </p>
              <div className="grid grid-cols-7 gap-[2px] text-center">
                {DOW_SHORT.map((d) => (
                  <div key={d} className="font-mono text-[9px] text-[var(--color-text-tertiary)] pb-1">{d}</div>
                ))}
                {cells.map((cell, ci) => {
                  const s = DAY_STYLES[cell.kind];
                  return (
                    <div
                      key={ci}
                      className="aspect-square flex items-center justify-center rounded-[4px] font-mono text-[10px]"
                      style={{
                        background: s.bg,
                        color: s.color,
                        fontWeight: s.fw ?? '400',
                      }}
                    >
                      {cell.d ?? ''}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HolidaysSection() {
  return (
    <section>
      <SectionLabel>Holidays</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOLIDAYS.map((h, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-subtle)',
            }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: 'var(--accent-cy)' }}
            />
            <div className="flex-1 min-w-0">
              <span className="font-body text-sm text-[var(--color-text-primary)]">{h.name}</span>
              {h.lunar && (
                <span className="font-mono text-[9px] text-[var(--color-text-tertiary)] ml-1">(lunar)</span>
              )}
            </div>
            <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] shrink-0">{h.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
