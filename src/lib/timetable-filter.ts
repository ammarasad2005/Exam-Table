import type { TimetableEntry, RawTimetableJSON } from './types';
import { DAYS_ORDER } from './types';

// ─── Flatten ─────────────────────────────────────────────────────────────────
// Converts the nested Python output into a flat TimetableEntry[].
// Structure: batch → dept → "regular"|"repeat" → courseName → section → day → [{room,time}]

export function flattenTimetable(raw: RawTimetableJSON): TimetableEntry[] {
  const entries: TimetableEntry[] = [];

  for (const batch of Object.keys(raw)) {
    const deptMap = raw[batch];
    for (const dept of Object.keys(deptMap)) {
      const cats = deptMap[dept];
      for (const category of ['regular', 'repeat'] as const) {
        const courseMap = cats[category] ?? {};
        for (const courseName of Object.keys(courseMap)) {
          const sectionMap = courseMap[courseName];
          for (const section of Object.keys(sectionMap)) {
            const dayMap = sectionMap[section];
            for (const day of Object.keys(dayMap)) {
              const slots = dayMap[day];
              for (const slot of slots) {
                entries.push({
                  courseName,
                  batch,
                  department: dept,
                  section,
                  day,
                  time: slot.time ?? 'TBA',
                  room: slot.room ?? 'TBA',
                  type: courseName.toLowerCase().endsWith('lab') ? 'lab' : 'lecture',
                  category,
                });
              }
            }
          }
        }
      }
    }
  }

  return entries;
}

// ─── Filter ──────────────────────────────────────────────────────────────────

export interface TimetableFilter {
  batch: string;
  department: string;
  section: string;
  query: string;
}

export function filterTimetable(
  entries: TimetableEntry[],
  filter: TimetableFilter
): TimetableEntry[] {
  const q = filter.query.toLowerCase().trim();
  return entries.filter(e => {
    if (e.batch !== filter.batch) return false;
    if (e.department !== filter.department) return false;
    if (e.section !== filter.section) return false;
    if (
      q &&
      !e.courseName.toLowerCase().includes(q) &&
      !e.room.toLowerCase().includes(q) &&
      !e.section.toLowerCase().includes(q)
    )
      return false;
    return true;
  });
}

// ─── Group by Day ─────────────────────────────────────────────────────────────

export function groupByDayTimetable(
  entries: TimetableEntry[]
): { day: string; entries: TimetableEntry[] }[] {
  const map = new Map<string, TimetableEntry[]>();
  for (const day of DAYS_ORDER) map.set(day, []);

  for (const e of entries) {
    if (map.has(e.day)) map.get(e.day)!.push(e);
  }

  // Sort each day's entries by start time
  for (const dayEntries of map.values()) {
    dayEntries.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  }

  return [...map.entries()]
    .filter(([, dayEntries]) => dayEntries.length > 0)
    .map(([day, dayEntries]) => ({ day, entries: dayEntries }));
}

// ─── Derive available sections ────────────────────────────────────────────────

export function getAvailableSections(
  entries: TimetableEntry[],
  batch: string,
  department: string
): string[] {
  const set = new Set<string>();
  for (const e of entries) {
    if (e.batch === batch && e.department === department) set.add(e.section);
  }
  // Return sorted: single-letter first (A, B, C…), then compound (BX, A1…)
  return [...set].sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });
}

// ─── Conflict detection ───────────────────────────────────────────────────────

/** Returns a Set of entry keys that overlap in time on the same day. */
export function detectConflicts(entries: TimetableEntry[]): Set<string> {
  const conflicting = new Set<string>();
  const byDay = new Map<string, TimetableEntry[]>();

  for (const e of entries) {
    if (!byDay.has(e.day)) byDay.set(e.day, []);
    byDay.get(e.day)!.push(e);
  }

  for (const dayEntries of byDay.values()) {
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        if (overlaps(dayEntries[i], dayEntries[j])) {
          conflicting.add(makeKey(dayEntries[i]));
          conflicting.add(makeKey(dayEntries[j]));
        }
      }
    }
  }

  return conflicting;
}

function overlaps(a: TimetableEntry, b: TimetableEntry): boolean {
  const [aStart, aEnd] = parseTimeRange(a.time);
  const [bStart, bEnd] = parseTimeRange(b.time);
  return aStart < bEnd && bStart < aEnd;
}

function parseTimeRange(t: string): [number, number] {
  // Handles "08:30 - 10:00" and "08:00 AM - 09:30 AM" formats
  const parts = t.split('-').map(s => s.trim());
  if (parts.length >= 2) {
    return [parseTimeToMinutes(parts[0]), parseTimeToMinutes(parts[parts.length - 1])];
  }
  const start = parseTimeToMinutes(t);
  return [start, start + 90]; // fallback: assume 90-min slot
}

export function makeKey(e: TimetableEntry): string {
  return `${e.day}|${e.time}|${e.courseName}|${e.section}`;
}

// ─── Time parsing ─────────────────────────────────────────────────────────────

/**
 * Parses a time string to minutes since midnight.
 * Handles:
 *   - "08:30" / "10:00"  (24-h, from Python script)
 *   - "08:00 AM" / "09:30 PM"  (12-h, if ever present)
 */
export function parseTimeToMinutes(t: string): number {
  if (!t || t === 'TBA' || t === 'Unknown Time') return 0;

  // 12-h format: "8:30 AM"
  const amPmMatch = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (amPmMatch) {
    let h = parseInt(amPmMatch[1]);
    const min = parseInt(amPmMatch[2]);
    const p = amPmMatch[3].toUpperCase();
    if (p === 'PM' && h < 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }

  // 24-h format: "08:30" or ambiguous "01:00"
  const h24Match = t.match(/(\d{1,2}):(\d{2})/);
  if (h24Match) {
    let h = parseInt(h24Match[1]);
    const min = parseInt(h24Match[2]);
    // FAST University classes are 8:30 AM to 5:15 PM.
    // If the hour is 1 through 7, it definitively means PM (13:00 - 19:00).
    if (h >= 1 && h <= 7) h += 12;
    return h * 60 + min;
  }

  return 0;
}

/** Formats a 24-h time string like "08:30" to "8:30 AM" for display */
export function formatTime(t: string): string {
  if (!t || t === 'TBA' || t === 'Unknown Time') return t;

  // Already has AM/PM — return as-is
  if (/AM|PM/i.test(t)) return t;

  const match = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return t;

  let h = parseInt(match[1]);
  const min = match[2];
  
  // FAST University classes are 8:30 AM to 5:15 PM.
  // If the hour is 1 through 7, it definitively means PM (13:00 - 19:00).
  if (h >= 1 && h <= 7) h += 12;

  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${period}`;
}

/** Formats a "HH:MM - HH:MM" range for human display: "8:30 – 10:00 AM" */
export function formatTimeRange(t: string): string {
  if (!t || t === 'TBA' || t === 'Unknown Time') return t;
  const parts = t.split('-').map(s => s.trim());
  if (parts.length === 2) {
    return `${formatTime(parts[0])} – ${formatTime(parts[1])}`;
  }
  return formatTime(t);
}
