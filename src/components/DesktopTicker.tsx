'use client';

import { useState, useEffect, useMemo } from 'react';
import { parseTimeRange, formatDuration } from '@/lib/dates';
import { DAYS_ORDER, type TimetableEntry } from '@/lib/types';
import { ShieldAlert } from 'lucide-react';

interface UserConfig {
  batch: string;
  school: string;
  dept: string;
  section: string;
}

interface Bundle {
  id: string;
  name: string;
  rows: any[];
}

interface DesktopTickerProps {
  allTimetableEntries: TimetableEntry[];
  userConfig: UserConfig | null;
  bundles: Bundle[];
}

interface OngoingClass extends TimetableEntry {
  remaining: number;
}

interface UpcomingClass extends TimetableEntry {
  until: number;
}

type TickerStatus =
  | { type: 'ongoing'; classes: OngoingClass[] }
  | { type: 'next'; classes: UpcomingClass[] };

export function DesktopTicker({ allTimetableEntries, userConfig, bundles }: DesktopTickerProps) {

  const [now, setNow] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Update clock every second
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Timetable Logic (Hooks must be called before early returns) ────────

  const relevantEntries = useMemo(() => {
    let filtered: TimetableEntry[] = [];
    if (userConfig) {
      filtered = allTimetableEntries.filter(e => 
        e.batch === userConfig.batch && 
        e.department === userConfig.dept && 
        e.section === userConfig.section
      );
    } else if (bundles.length > 0) {
      const allSelections = bundles.flatMap((b: any) => b.rows).filter((r: any) => r.selection);
      filtered = allTimetableEntries.filter(e => {
        return allSelections.some((sel: any) => {
          const [course, section] = sel.selection.split('|');
          return e.courseName === course && e.section === section && e.batch === sel.batch && e.department === sel.stream;
        });
      });
    }
    // Ensure we only process entries with valid time ranges
    return filtered.filter(e => e.time && (e.time.includes('-') || e.time.includes(' to ')));
  }, [userConfig, bundles, allTimetableEntries]);



  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const status = useMemo((): TickerStatus | null => {
    if (relevantEntries.length === 0) return null;

    const ongoing = relevantEntries.filter(e => {
      if (e.day !== currentDay) return false;
      const { start, end } = parseTimeRange(e.time);
      return currentMins >= start && currentMins < end;
    });

    if (ongoing.length > 0) {
      return {
        type: 'ongoing',
        classes: ongoing.map(e => ({
          ...e,
          remaining: parseTimeRange(e.time).end - currentMins
        }))
      };
    }

    const sorted = [...relevantEntries].sort((a, b) => {
      const dayA = DAYS_ORDER.indexOf(a.day);
      const dayB = DAYS_ORDER.indexOf(b.day);
      if (dayA !== dayB) return dayA - dayB;
      return parseTimeRange(a.time).start - parseTimeRange(b.time).start;
    });

    const nextIdx = sorted.findIndex(e => {
      const eDayIdx = DAYS_ORDER.indexOf(e.day);
      const cDayIdx = DAYS_ORDER.indexOf(currentDay);
      if (eDayIdx > cDayIdx) return true;
      if (eDayIdx === cDayIdx && parseTimeRange(e.time).start > currentMins) return true;
      return false;
    });

    const nextClass = nextIdx !== -1 ? sorted[nextIdx] : sorted[0];
    const allNext = sorted.filter(e => e.day === nextClass.day && parseTimeRange(e.time).start === parseTimeRange(nextClass.time).start);

    let minsUntil = 0;
    const { start } = parseTimeRange(nextClass.time);
    if (nextClass.day === currentDay) {
      minsUntil = start - currentMins;
    } else {
      const nextDayIdx = DAYS_ORDER.indexOf(nextClass.day);
      const curDayIdx = DAYS_ORDER.indexOf(currentDay);
      let daysDiff = (nextDayIdx - curDayIdx + 7) % 7;
      if (daysDiff === 0 && start <= currentMins) daysDiff = 7;
      minsUntil = daysDiff * 24 * 60 - currentMins + start;
    }

    return {
      type: 'next',
      classes: allNext.map(e => ({
        ...e,
        until: minsUntil
      }))
    };
  }, [relevantEntries, currentDay, currentMins]);

  // ─── Early Return for Hydration (Must be after all Hooks) ───────────────

  if (!mounted) {
    return <div className="hidden md:block mb-12 h-[180px] opacity-0" aria-hidden="true" />;
  }

  // ─── Rendering Logic ──────────────────────────────────────────────────────

  const timeFull = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const [timeStr, period] = timeFull.split(' ');
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  if (relevantEntries.length === 0) {
    return (
      <div className="hidden md:block mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col gap-0.5 items-start">
          <div className="flex items-baseline gap-3">
            <h2 className="font-clock text-5xl tracking-tighter text-[var(--color-text-primary)] opacity-80 select-none">
              {timeStr.split(':').slice(0, 2).join(':')}
              <span className="opacity-20 inline-block w-[0.4em] text-center">
                <span className="animate-pulse">:</span>
              </span>
              {timeStr.split(':').slice(2).join('')}
            </h2>
            <span className="font-display text-2xl font-bold text-[var(--color-text-secondary)] select-none uppercase">{period}</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] font-bold">{dateStr}</p>
        </div>
        <div className="mt-6 border-t border-[var(--color-border)] pt-4 opacity-50">
          <p className="text-[11px] text-[var(--color-text-tertiary)] max-w-sm leading-relaxed font-mono">
            No preferences detected. Live class tracking will appear here once saved.
          </p>
        </div>
      </div>
    );
  }

  const isConflict = status && status.classes.length > 1;

  return (
    <div className="hidden md:block mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col gap-0.5 items-start">
        <div className="flex items-baseline gap-3">
          <h2 className="font-clock text-5xl tracking-tighter text-[var(--color-text-primary)] select-none">
            {timeStr.split(':').slice(0, 2).join(':')}
            <span className="opacity-20 w-[0.4em] inline-block text-center tabular-nums">
              <span className="animate-pulse">:</span>
            </span>
            <span className="tabular-nums">{timeStr.split(':').slice(2).join('')}</span>
          </h2>
          <span className="font-display text-2xl font-bold text-[var(--color-text-secondary)] select-none uppercase">{period}</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] font-bold">{dateStr}</p>
      </div>

      {status && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)] font-medium">
              {status.type === 'ongoing' ? 'Ongoing Class' : 'Next Up'}
            </span>
            {isConflict && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/5 text-red-500/70 border border-red-500/10 font-mono text-[9px] font-bold uppercase tracking-widest animate-pulse">
                <ShieldAlert size={10} />
                Conflict
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {status.classes.map((cls: OngoingClass | UpcomingClass, idx: number) => {
              const accentColor = `var(--accent-${cls.department.toLowerCase()})`;
              const label = status.type === 'ongoing' 
                ? `${formatDuration((cls as OngoingClass).remaining)} rem.` 
                : `in ${formatDuration((cls as UpcomingClass).until)}`;
              
              // Define common pill style based on department theme
              const pillStyle = {
                borderColor: `rgba(var(--accent-rgb-${cls.department.toLowerCase()}), 0.3)`,
                color: accentColor,
                backgroundColor: `rgba(var(--accent-rgb-${cls.department.toLowerCase()}), 0.05)`
              };

              return (
                <div key={idx} className="flex flex-wrap gap-1">
                  <div className="h-6 px-2.5 flex items-center justify-center rounded border text-[9px] font-bold shadow-sm" style={pillStyle}>
                    {cls.room}
                  </div>
                  
                  <div className="h-6 px-2.5 flex items-center justify-center rounded border text-[9px] font-bold shadow-sm" style={pillStyle}>
                    {cls.courseName}
                  </div>

                  <div className="h-6 px-2.5 flex items-center justify-center rounded border text-[9px] font-bold shadow-sm" style={pillStyle}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

