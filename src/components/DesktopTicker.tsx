'use client';

import { useState, useEffect, useMemo } from 'react';
import { parseTimeRange, formatDuration } from '@/lib/dates';
import { DAYS_ORDER, type TimetableEntry, type RawTimetableJSON, type SummerCourseCatalogEntry } from '@/lib/types';
import { ShieldAlert } from 'lucide-react';
import { findMatchingCatalogEntry } from '@/lib/timetable-filter';
import {
  getLiveTimetableEntries,
  RESULT_PREFS_STORAGE_KEY,
  type TimetableResultPreference,
  type UserConfig,
} from '@/lib/timetable-live';

// eslint-disable-next-line
const timetableRaw: RawTimetableJSON = require('../../public/data/timetable.json');

interface Bundle {
  id: string;
  name: string;
  rows: any[];
}

interface DesktopTickerProps {
  allTimetableEntries: TimetableEntry[];
  userConfig: UserConfig | null;
  bundles: Bundle[];
  isSummer?: boolean;
  summerSelections?: Record<string, string>;
  summerCatalog?: SummerCourseCatalogEntry[];
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

export function DesktopTicker({
  allTimetableEntries,
  userConfig,
  bundles,
  isSummer = false,
  summerSelections = {},
  summerCatalog = [],
}: DesktopTickerProps) {

  const [now, setNow] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [resultPreferences, setResultPreferences] = useState<TimetableResultPreference | null>(null);

  // Update clock every second
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userConfig) {
      setResultPreferences(null);
      return;
    }

    try {
      const raw = localStorage.getItem(RESULT_PREFS_STORAGE_KEY);
      if (!raw) {
        setResultPreferences(null);
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, TimetableResultPreference>;
      setResultPreferences(parsed[`${userConfig.batch}|${userConfig.dept}`] ?? null);
    } catch (err) {
      console.error('Failed to parse timetable result preferences', err);
      setResultPreferences(null);
    }
  }, [userConfig]);

  // Build sheet name to meta mapping
  const sheetToMeta = useMemo(() => {
    const map: Record<string, { day: string; isoDate: string; isMakeup: boolean; date: string }> = {};
    const daysList = timetableRaw.__meta__?.days;
    if (Array.isArray(daysList)) {
      daysList.forEach(d => {
        map[d.sheetName] = {
          day: d.day,
          isoDate: d.isoDate || '',
          isMakeup: !!d.isMakeup,
          date: d.date || '',
        };
      });
    }
    return map;
  }, []);

  // ─── Timetable Logic ──────────────────────────────────────────────────
  const relevantEntries = useMemo(() => {
    if (isSummer) {
      const filtered = allTimetableEntries.filter(e => {
        const catalogEntry = findMatchingCatalogEntry(e.courseName, summerCatalog);
        const canonicalName = catalogEntry ? catalogEntry.sheetName : e.courseName;

        if (!summerSelections[canonicalName]) return false;
        const selectedSection = summerSelections[canonicalName];
        if (!e.section || !selectedSection || selectedSection === 'A') return true;
        return e.section === selectedSection;
      });
      // Deduplicate
      const seen = new Set<string>();
      return filtered.filter(entry => {
        const key = `${entry.day}|${entry.time}|${entry.courseName}|${entry.section}|${entry.category}|${entry.department}|${entry.room}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return entry.time && (entry.time.includes('-') || entry.time.includes(' to '));
      });
    }

    if (userConfig) {
      return getLiveTimetableEntries(allTimetableEntries, userConfig, resultPreferences);
    }

    if (bundles.length > 0) {
      const allSelections = bundles.flatMap((b: any) => b.rows).filter((r: any) => r.selection);
      const filtered = allTimetableEntries.filter(e => {
        return allSelections.some((sel: any) => {
          const [course, section] = sel.selection.split('|');
          return (
            e.courseName === course.trim() &&
            e.section === section.trim() &&
            e.batch === sel.batch &&
            e.department === sel.stream
          );
        });
      });

      const seen = new Set<string>();
      return filtered.filter(entry => {
        const key = `${entry.day}|${entry.time}|${entry.courseName}|${entry.section}|${entry.category}|${entry.department}|${entry.room}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return entry.time && (entry.time.includes('-') || entry.time.includes(' to '));
      });
    }

    return [];
  }, [isSummer, summerSelections, summerCatalog, userConfig, bundles, allTimetableEntries, resultPreferences]);

  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // local date YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  const todayISO = `${year}-${month}-${dayStr}`;

  const status = useMemo((): TickerStatus | null => {
    if (relevantEntries.length === 0) return null;

    // A class is ongoing if today's date matches the sheet's isoDate, or falls back to canonical weekday
    const ongoing = relevantEntries.filter(e => {
      const meta = sheetToMeta[e.day];
      const canonicalDay = meta?.day ?? e.day;
      const isoDate = meta?.isoDate ?? '';

      const isToday = isoDate ? (isoDate === todayISO) : (canonicalDay === currentDay);
      if (!isToday) return false;

      const { start, end } = parseTimeRange(e.time);
      return currentMins >= start && currentMins < end;
    });

    if (ongoing.length > 0) {
      return {
        type: 'ongoing',
        classes: ongoing.map(e => ({
          ...e,
          remaining: parseTimeRange(e.time).end - currentMins,
        })),
      };
    }

    // Filter out past classes (e.g. classes whose end times have already passed today or in the past days)
    const activeEntries = relevantEntries.filter(e => {
      const meta = sheetToMeta[e.day];
      const canonicalDay = meta?.day ?? e.day;
      const isoDate = meta?.isoDate ?? '';

      // 1. If date is strictly in the past, skip
      if (isoDate && isoDate < todayISO) return false;

      // 2. If date is today, check if class end time has passed
      if (isoDate && isoDate === todayISO) {
        const { end } = parseTimeRange(e.time);
        if (currentMins >= end) return false;
      }

      // 3. Fallback: if no isoDate, check if canonical day matches today and end time has passed
      if (!isoDate && canonicalDay === currentDay) {
        const { end } = parseTimeRange(e.time);
        if (currentMins >= end) return false;
      }
      
      // 4. Fallback: check if canonical day is strictly in the past
      if (!isoDate && canonicalDay !== currentDay) {
        const nextDayIdx = DAYS_ORDER.indexOf(canonicalDay);
        const curDayIdx = DAYS_ORDER.indexOf(currentDay);
        if (nextDayIdx < curDayIdx) return false;
      }

      return true;
    });

    if (activeEntries.length === 0) return null;

    // Sort active entries chronologically
    const sorted = [...activeEntries].sort((a, b) => {
      const metaA = sheetToMeta[a.day];
      const metaB = sheetToMeta[b.day];

      if (metaA?.isoDate && metaB?.isoDate) {
        if (metaA.isoDate !== metaB.isoDate) {
          return metaA.isoDate.localeCompare(metaB.isoDate);
        }
      } else if (metaA?.isoDate) {
        return -1;
      } else if (metaB?.isoDate) {
        return 1;
      } else {
        const dayA = DAYS_ORDER.indexOf(metaA?.day ?? a.day);
        const dayB = DAYS_ORDER.indexOf(metaB?.day ?? b.day);
        if (dayA !== dayB) return dayA - dayB;
      }

      return parseTimeRange(a.time).start - parseTimeRange(b.time).start;
    });

    const nextClass = sorted[0];
    const { start: nextStartMins } = parseTimeRange(nextClass.time);
    
    // Find all next classes starting at the same time on the same day
    const allNext = sorted.filter(e => 
      e.day === nextClass.day && 
      parseTimeRange(e.time).start === nextStartMins
    );

    let minsUntil = 0;
    const metaNext = sheetToMeta[nextClass.day];

    if (metaNext?.isoDate) {
      const sh = Math.floor(nextStartMins / 60);
      const sm = nextStartMins % 60;
      const [ny, nm, nd] = metaNext.isoDate.split('-').map(Number);
      const targetDate = new Date(ny, nm - 1, nd, sh, sm, 0);
      const diffMs = targetDate.getTime() - now.getTime();
      minsUntil = Math.max(0, Math.floor(diffMs / 60000));
    } else {
      const canonicalNextDay = metaNext?.day ?? nextClass.day;
      if (canonicalNextDay === currentDay) {
        minsUntil = nextStartMins - currentMins;
      } else {
        const nextDayIdx = DAYS_ORDER.indexOf(canonicalNextDay);
        const curDayIdx = DAYS_ORDER.indexOf(currentDay);
        let daysDiff = (nextDayIdx - curDayIdx + 7) % 7;
        if (daysDiff === 0 && nextStartMins <= currentMins) daysDiff = 7;
        minsUntil = daysDiff * 24 * 60 - currentMins + nextStartMins;
      }
    }

    return {
      type: 'next',
      classes: allNext.map(e => ({
        ...e,
        until: minsUntil,
      })),
    };
  }, [relevantEntries, currentDay, currentMins, todayISO, sheetToMeta, now]);

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
            {isSummer 
              ? 'No summer courses selected. Live class tracking will appear here once selected.'
              : 'No preferences detected. Live class tracking will appear here once saved.'}
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
        <div className="mt-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] font-bold">
              {status.type === 'ongoing' ? 'Ongoing Class' : 'Next Up'}
            </span>
            {isConflict && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-mono text-[10px] font-bold uppercase tracking-widest animate-pulse border border-red-500/20">
                <ShieldAlert size={12} />
                Critical Conflict
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {status.classes.map((cls, idx) => {
              const deptCode = cls.department?.toLowerCase() || 'cs';
              const accentColor = `var(--accent-${deptCode})`;
              const label = status.type === 'ongoing' 
                ? `${formatDuration((cls as OngoingClass).remaining)} left` 
                : `starts in ${formatDuration((cls as UpcomingClass).until)}`;
              
              const pillStyle = {
                borderColor: `rgba(var(--accent-rgb-${deptCode}), 0.25)`,
                color: accentColor,
                backgroundColor: `rgba(var(--accent-rgb-${deptCode}), 0.08)`
              };

              return (
                <div key={idx} className="grid grid-cols-3 gap-2 w-full max-w-xl">
                  <div className="h-12 px-4 flex items-center justify-center rounded-md border font-mono text-sm font-bold shadow-sm whitespace-nowrap" style={pillStyle}>
                    {cls.room || 'TBA'}
                  </div>
                  
                  <div className="h-12 px-4 flex items-center justify-center rounded-md border font-mono text-sm font-bold shadow-sm truncate text-center" style={pillStyle}>
                    {cls.courseName}
                  </div>

                  <div className="h-12 px-4 flex items-center justify-center rounded-md border font-mono text-sm font-bold shadow-sm whitespace-nowrap" style={pillStyle}>
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
