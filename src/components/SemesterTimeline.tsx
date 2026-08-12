'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  getSemesterStartDate,
  getSemesterEndDate,
  getFinalExamsStartDate,
  getFinalExamsEndDate,
  getSemesterWeekNumber,
  getSemesterProgress,
  getSemesterMilestones,
  formatMonthsWeeksDays,
  daysUntil,
} from '@/lib/dates';

interface SemesterTimelineProps {
  semesterName?: string;
}

type Phase = 'before' | 'live' | 'final' | 'complete';

// ── Color interpolation: green → amber → red ──
// Concept palette: #18A36B (start) → #DCA12D (middle) → #D94A59 (end)
// Pre-semester void: #7D8797
function interpolateColor(pct: number): string {
  if (pct <= 0) return '#7d8797'; // void
  if (pct >= 100) return '#d94a59'; // end red

  // Three-stop interpolation: 0% = green, 50% = amber, 100% = red
  const stops = [
    { p: 0,   r: 0x18, g: 0xa3, b: 0x6b }, // #18A36B green
    { p: 50,  r: 0xdc, g: 0xa1, b: 0x2d }, // #DCA12D amber
    { p: 100, r: 0xd9, g: 0x4a, b: 0x59 }, // #D94A59 red
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (pct >= a.p && pct <= b.p) {
      const t = (pct - a.p) / (b.p - a.p);
      const r = Math.round(a.r + (b.r - a.r) * t);
      const g = Math.round(a.g + (b.g - a.g) * t);
      const bl = Math.round(a.b + (b.b - a.b) * t);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
    }
  }
  return '#18a36b';
}

export function SemesterTimeline({ semesterName }: SemesterTimelineProps) {
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Update every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Close on outside click + Escape
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [expanded]);

  const data = useMemo(() => {
    const startISO = getSemesterStartDate();
    const endISO = getSemesterEndDate();
    if (!startISO || !endISO) return null;

    const progress = getSemesterProgress(now) ?? 0;
    const weekNum = getSemesterWeekNumber(now);
    const milestones = getSemesterMilestones();
    const daysToStart = daysUntil(startISO, now);
    const daysToEnd = daysUntil(endISO, now);
    const duration = formatMonthsWeeksDays(startISO, endISO, now);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const start = new Date(startISO + 'T00:00:00');
    const end = new Date(endISO + 'T00:00:00');

    let phase: Phase;
    if (today < start) phase = 'before';
    else if (today > end) phase = 'complete';
    else if (progress >= 80) phase = 'final';
    else phase = 'live';

    const clampedPct = Math.max(0, Math.min(100, progress));
    const barColor = interpolateColor(clampedPct);

    // ── Build summary texts based on phase ──
    let statusText: string;
    let primaryText: string;
    let metaText: string;
    let detailValue: string;
    let detailCaption: string;

    if (phase === 'before') {
      statusText = 'PRE-SEMESTER';
      primaryText = `${daysToStart}d to start`;
      metaText = `Begins ${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
      detailValue = formatDurationText(duration);
      detailCaption = 'until the semester begins';
    } else if (phase === 'complete') {
      statusText = 'COMPLETE';
      primaryText = 'Semester complete';
      metaText = `100%`;
      detailValue = formatDurationText(duration);
      detailCaption = 'total semester duration';
    } else if (phase === 'final') {
      statusText = 'FINAL STRETCH';
      const totalWeeks = Math.round((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      primaryText = `${daysToEnd}d left`;
      metaText = `Week ${weekNum} of ${totalWeeks} · ${Math.round(clampedPct)}%`;
      // For remaining: compute months-weeks-days from today to end
      const remMonths = Math.floor(daysToEnd / 30.44);
      const remDaysAfter = daysToEnd - Math.floor(remMonths * 30.44);
      const remWeeks = Math.floor(remDaysAfter / 7);
      const remDays = remDaysAfter - remWeeks * 7;
      detailValue = `${remMonths > 0 ? `${remMonths} month${remMonths !== 1 ? 's' : ''} · ` : ''}${remWeeks > 0 ? `${remWeeks} week${remWeeks !== 1 ? 's' : ''} · ` : ''}${remDays} day${remDays !== 1 ? 's' : ''}`;
      detailCaption = 'remaining until the semester ends';
    } else {
      statusText = 'IN SESSION';
      const totalWeeks = Math.round((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      primaryText = `Week ${weekNum}`;
      metaText = `${weekNum} of ${totalWeeks} · ${Math.round(clampedPct)}%`;
      detailValue = formatDurationText(duration);
      detailCaption = 'elapsed since the semester began';
    }

    return {
      startISO, endISO, phase, clampedPct, barColor,
      milestones, weekNum, statusText, primaryText, metaText,
      detailValue, detailCaption, semesterLabel: semesterName,
    };
  }, [now, semesterName]);

  if (!data) return null;

  const { phase, clampedPct, barColor, milestones, statusText, primaryText, metaText, detailValue, detailCaption, startISO, endISO } = data;

  const startDateObj = new Date(startISO + 'T00:00:00');
  const endDateObj = new Date(endISO + 'T00:00:00');
  const todayStr = new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="relative hidden md:block" ref={widgetRef} style={{ width: 'min(500px, calc(100% - 40px))' }}>
      {/* Floating capsule */}
      <div
        className="relative rounded-2xl border shadow-lg"
        style={{
          padding: '10px 14px 11px',
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-border-strong)',
          boxShadow: '0 10px 26px rgba(35, 47, 67, 0.13)',
        }}
      >
        {/* Summary row (clickable) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between gap-4 bg-transparent border-0 cursor-pointer text-left p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-secondary)] rounded-lg"
          aria-expanded={expanded}
          aria-label={`${primaryText}. ${metaText}. Open exact timeline breakdown.`}
        >
          {/* Left: orb + status + primary */}
          <span className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-[9px] h-[9px] rounded-full shrink-0 transition-colors duration-300"
              style={{
                backgroundColor: barColor,
                boxShadow: `0 0 0 4px ${barColor}26`,
              }}
            />
            <span className="min-w-0">
              <span
                className="block font-mono font-bold tracking-widest"
                style={{ fontSize: '8px', color: 'var(--color-text-tertiary)', letterSpacing: '0.12em', marginBottom: '2px' }}
              >
                {statusText}
              </span>
              <span
                className="block font-bold truncate"
                style={{ fontSize: '15px', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
              >
                {primaryText}
              </span>
            </span>
          </span>

          {/* Right: meta + chevron */}
          <span className="flex items-center gap-1.5 shrink-0" style={{ color: 'var(--color-text-secondary)', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            <span>{metaText}</span>
            <svg
              className="transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
            >
              <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>

        {/* Progress bar */}
        <div className="relative mt-2 py-0.5">
          <div
            className="relative h-[6px] rounded-full overflow-visible"
            style={{ backgroundColor: phase === 'before' ? 'var(--color-bg-subtle)' : 'var(--color-bg-subtle)' }}
            role="progressbar"
            aria-label="Semester progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clampedPct)}
            aria-valuetext={`${Math.round(clampedPct)} percent complete`}
          >
            {/* Fill — single solid color */}
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${clampedPct}%`,
                backgroundColor: barColor,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Sheen animation */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                  backgroundSize: '15% 100%',
                  animation: 'timelineSheen 3.2s infinite linear',
                }}
              />
            </div>

            {/* Milestone tick marks */}
            {milestones.map((m) => {
              const reached = clampedPct >= m.progressPercent && clampedPct > 0;
              return (
                <button
                  key={m.shortLabel}
                  className="absolute top-[-5px] w-[18px] h-[18px] bg-transparent border-0 rounded-full cursor-help p-0 group"
                  style={{ left: `${m.progressPercent}%`, transform: 'translateX(-50%)' }}
                  aria-label={`${m.label}, ${new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                >
                  {/* Tick line */}
                  <span
                    className="absolute top-[3px] left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      width: '2px',
                      height: '12px',
                      backgroundColor: reached ? barColor : 'var(--color-text-tertiary)',
                      border: '2px solid var(--color-bg-raised)',
                      boxShadow: '0 1px 3px rgba(20,28,40,0.22)',
                      boxSizing: 'content-box',
                    }}
                  />
                  {/* Tooltip on hover */}
                  <span
                    className="absolute top-[22px] left-1/2 -translate-x-1/2 z-10 max-w-[150px] px-2 py-1.5 rounded-lg text-white pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150"
                    style={{
                      backgroundColor: 'var(--color-text-primary)',
                      fontSize: '10px',
                      fontWeight: 700,
                      lineHeight: 1.35,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.label} · {new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popover (expanded detail) */}
      {expanded && (
        <div
          className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border shadow-xl"
          style={{
            backgroundColor: 'var(--color-bg-raised)',
            borderColor: 'var(--color-border-strong)',
            padding: '19px',
            animation: 'timelinePopoverIn 180ms ease',
            transformOrigin: 'top center',
          }}
        >
          {/* Pointing arrow */}
          <div
            className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-[11px] h-[11px] rotate-45"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderTop: '1px solid var(--color-border-strong)',
              borderLeft: '1px solid var(--color-border-strong)',
            }}
          />

          {/* Header row */}
          <div className="flex items-start justify-between">
            <div>
              <div
                className="font-mono font-bold uppercase tracking-widest"
                style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', letterSpacing: '0.12em' }}
              >
                Exact breakdown
              </div>
              <div
                className="mt-1.5 font-bold"
                style={{ fontSize: '21px', color: 'var(--color-text-primary)', letterSpacing: '-0.035em' }}
              >
                {detailValue}
              </div>
              <div className="mt-1" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {detailCaption}
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="w-[27px] h-[27px] grid place-items-center rounded-lg cursor-pointer border-0"
              style={{ backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)' }}
              aria-label="Close timeline details"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Date row: 3 columns */}
          <div className="grid grid-cols-3 mt-4 pt-3.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="px-3 first:pl-0" style={{ borderRight: '1px solid var(--color-border)' }}>
              <small className="block mb-1 font-mono font-bold uppercase tracking-widest" style={{ fontSize: '8px', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em' }}>
                Start
              </small>
              <strong style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                {startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </strong>
            </div>
            <div className="px-3" style={{ borderRight: '1px solid var(--color-border)' }}>
              <small className="block mb-1 font-mono font-bold uppercase tracking-widest" style={{ fontSize: '8px', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em' }}>
                Today
              </small>
              <strong style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                {todayStr}
              </strong>
            </div>
            <div className="px-3 last:pr-0">
              <small className="block mb-1 font-mono font-bold uppercase tracking-widest" style={{ fontSize: '8px', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em' }}>
                End
              </small>
              <strong style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                {endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: format duration as "X months · Y weeks · Z days" ──
function formatDurationText(d: { months: number; weeks: number; days: number; direction: string }): string {
  const parts: string[] = [];
  if (d.months > 0) parts.push(`${d.months} month${d.months !== 1 ? 's' : ''}`);
  if (d.weeks > 0) parts.push(`${d.weeks} week${d.weeks !== 1 ? 's' : ''}`);
  parts.push(`${d.days} day${d.days !== 1 ? 's' : ''}`);
  return parts.join(' · ');
}
