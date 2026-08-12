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
  getUpcomingMilestones,
  formatMonthsWeeksDays,
  daysUntil,
} from '@/lib/dates';

interface SemesterTimelineProps {
  semesterName?: string;
}

type Phase = 'pre' | 'active' | 'final-stretch' | 'finals' | 'post';

export function SemesterTimeline({ semesterName }: SemesterTimelineProps) {
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [expanded]);

  const data = useMemo(() => {
    const startISO = getSemesterStartDate();
    const endISO = getSemesterEndDate();
    const finalsStartISO = getFinalExamsStartDate();
    const finalsEndISO = getFinalExamsEndDate();

    if (!startISO || !endISO) return null;

    const progress = getSemesterProgress(now);
    const weekNum = getSemesterWeekNumber(now);
    const milestones = getSemesterMilestones();
    const upcoming = getUpcomingMilestones(5, now);
    const duration = formatMonthsWeeksDays(startISO, endISO, now);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const start = new Date(startISO + 'T00:00:00');
    const end = new Date(endISO + 'T00:00:00');
    const finalsEnd = finalsEndISO ? new Date(finalsEndISO + 'T00:00:00') : null;

    let phase: Phase;
    if (today < start) phase = 'pre';
    else if (finalsEnd && today > finalsEnd) phase = 'post';
    else if (finalsStartISO && today >= new Date(finalsStartISO + 'T00:00:00')) phase = 'finals';
    else if (progress !== null && progress >= 80) phase = 'final-stretch';
    else phase = 'active';

    const daysToStart = daysUntil(startISO, now);
    const daysToEnd = daysUntil(endISO, now);

    return {
      startISO,
      endISO,
      finalsStartISO,
      finalsEndISO,
      progress,
      weekNum,
      milestones,
      upcoming,
      duration,
      phase,
      daysToStart,
      daysToEnd,
      semesterLabel: semesterName,
    };
  }, [now, semesterName]);

  if (!data) return null;

  const { progress, weekNum, milestones, upcoming, duration, phase, daysToStart, daysToEnd, startISO, endISO } = data;

  // ── Auto label (collapsed state) ──
  let label: string;
  if (phase === 'pre') {
    label = `Starts in ${daysToStart} day${daysToStart !== 1 ? 's' : ''}`;
  } else if (phase === 'post') {
    label = 'Semester complete';
  } else if (phase === 'finals') {
    const finalsWeek = weekNum ? Math.ceil((weekNum + (daysToEnd < 0 ? -daysToEnd : 0)) / 1) : null;
    label = `Finals Week`;
  } else if (phase === 'final-stretch') {
    const weeksLeft = Math.max(0, Math.ceil(daysToEnd / 7));
    label = `Week ${weekNum} · ${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} left`;
  } else {
    label = `Week ${weekNum}`;
  }

  // ── Progress fill percentage (clamped 0-100 for display) ──
  const fillPct = Math.max(0, Math.min(100, progress ?? 0));

  return (
    <div className="relative hidden md:block" ref={dropdownRef}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex flex-col items-center gap-1 px-3 py-1 rounded-md hover:bg-[var(--color-bg-subtle)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2"
        aria-label="Semester timeline"
        aria-expanded={expanded}
      >
        {/* Bar */}
        <div className="relative w-[280px] h-[6px] rounded-full overflow-hidden bg-[var(--color-bg-subtle)]">
          {/* Full gradient (green → red) always rendered, revealed by clip */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #86efac 0%, #4ade80 15%, #a3e635 30%, #fbbf24 50%, #fb923c 70%, #f87171 85%, #dc2626 100%)',
              clipPath: `inset(0 ${100 - fillPct}% 0 0)`,
            }}
          />
          {/* Pre-semester shimmer (only when phase === 'pre') */}
          {phase === 'pre' && (
            <div
              className="absolute inset-0 rounded-full opacity-40"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--color-text-tertiary), transparent)',
                backgroundSize: '50% 100%',
                animation: 'shimmer 3s linear infinite',
              }}
            />
          )}
          {/* Post-semester desaturation */}
          {phase === 'post' && (
            <div className="absolute inset-0 rounded-full bg-[var(--color-bg-raised)]/40" />
          )}

          {/* Milestone tick marks */}
          {milestones.map((m) => (
            <div
              key={m.shortLabel}
              className="absolute top-0 bottom-0 flex items-center justify-center"
              style={{ left: `${m.progressPercent}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-[1.5px] h-[10px] -my-[2px] bg-[var(--color-text-primary)] opacity-60 rounded-full" />
            </div>
          ))}

          {/* Today cursor */}
          {phase !== 'pre' && phase !== 'post' && (
            <div
              className="absolute top-0 bottom-0 w-[2px] -my-[3px] bg-[var(--color-text-primary)] rounded-full shadow-sm"
              style={{ left: `${fillPct}%`, transform: 'translateX(-50%)' }}
            />
          )}
        </div>

        {/* Label + milestone abbreviations row */}
        <div className="relative w-[280px] flex items-center justify-between">
          {/* Milestone short labels positioned under their tick marks */}
          <div className="relative flex-1 h-[14px]">
            {milestones.map((m) => (
              <span
                key={m.shortLabel}
                className="absolute font-mono text-[8px] font-bold text-[var(--color-text-tertiary)] -translate-x-1/2"
                style={{ left: `${m.progressPercent}%`, top: 0 }}
              >
                {m.shortLabel}
              </span>
            ))}
          </div>
          {/* Auto label (centered) */}
          <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
            {label}
          </span>
        </div>
      </button>

      {/* Expanded dropdown */}
      {expanded && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[320px] rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50">
            <p className="font-display text-sm font-bold text-[var(--color-text-primary)]">
              {semesterName ?? 'Semester'} Timeline
            </p>
          </div>

          {/* Duration breakdown */}
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            {phase === 'pre' ? (
              <p className="font-mono text-xs text-[var(--color-text-secondary)]">
                {duration.months > 0 && `${duration.months} month${duration.months !== 1 ? 's' : ''}, `}
                {duration.weeks > 0 && `${duration.weeks} week${duration.weeks !== 1 ? 's' : ''}, `}
                {duration.days} day{duration.days !== 1 ? 's' : ''} until semester begins
              </p>
            ) : phase === 'post' ? (
              <p className="font-mono text-xs text-[var(--color-text-secondary)]">
                Semester ended on {new Date(endISO + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="font-mono text-xs text-[var(--color-text-secondary)]">
                  {duration.months > 0 && `${duration.months} month${duration.months !== 1 ? 's' : ''}, `}
                  {duration.weeks > 0 && `${duration.weeks} week${duration.weeks !== 1 ? 's' : ''}, `}
                  {duration.days} day{duration.days !== 1 ? 's' : ''} elapsed
                </p>
                <p className="font-mono text-xs text-[var(--color-text-tertiary)]">
                  {(() => {
                    const totalRemaining = Math.max(0, daysToEnd);
                    const remMonths = Math.floor(totalRemaining / 30.44);
                    const remDaysAfterMonths = totalRemaining - Math.floor(remMonths * 30.44);
                    const remWeeks = Math.floor(remDaysAfterMonths / 7);
                    const remDays = remDaysAfterMonths - remWeeks * 7;
                    return `${remMonths > 0 ? `${remMonths} month${remMonths !== 1 ? 's' : ''}, ` : ''}${remWeeks > 0 ? `${remWeeks} week${remWeeks !== 1 ? 's' : ''}, ` : ''}${remDays} day${remDays !== 1 ? 's' : ''} remaining`;
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Upcoming milestones */}
          <div className="px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold mb-2">
              Upcoming
            </p>
            {upcoming.length === 0 ? (
              <p className="font-mono text-xs text-[var(--color-text-tertiary)] italic">No upcoming dates</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {upcoming.map((m, idx) => {
                  const dUntil = daysUntil(m.date, now);
                  const isNext = idx === 0;
                  const dateObj = new Date(m.date + 'T00:00:00');
                  return (
                    <div
                      key={m.label}
                      className={`flex items-center justify-between gap-2 px-2 py-1 rounded ${isNext ? 'bg-[var(--color-bg-subtle)]' : ''}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isNext ? 'bg-[var(--color-text-primary)]' : 'bg-[var(--color-text-tertiary)]'}`} />
                        <span className={`font-body text-xs truncate ${isNext ? 'font-bold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                          {m.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                          {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`font-mono text-[10px] ${isNext ? 'text-[var(--color-text-primary)] font-bold' : 'text-[var(--color-text-tertiary)]'}`}>
                          {dUntil === 0 ? 'today' : dUntil > 0 ? `${dUntil}d` : 'done'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Phase legend */}
          <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]/30">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--color-text-tertiary)]">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#86efac' }} /> Start
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--color-text-tertiary)]">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#fbbf24' }} /> Mid
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--color-text-tertiary)]">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#dc2626' }} /> End
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
