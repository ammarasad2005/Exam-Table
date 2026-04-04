import type { ExamEntry, FilterState } from './types';

export function filterExams(entries: ExamEntry[], filter: FilterState): ExamEntry[] {
  const q = filter.query.toLowerCase().trim();
  return entries.filter(e => {
    if (e.batch !== filter.batch) return false;
    if (e.department !== filter.department) return false;
    if (q && !e.courseCode.toLowerCase().includes(q) && !e.courseName.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function groupByDay(entries: ExamEntry[]): { label: string; entries: ExamEntry[] }[] {
  const map = new Map<string, ExamEntry[]>();
  for (const e of entries) {
    const key = e.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()].map(([date, dayEntries]) => ({
    label: formatDayHeader(date, dayEntries[0].day),
    entries: dayEntries,
  }));
}

// "12/05/2025" + "Monday" → "MON 12 MAY"
function formatDayHeader(date: string, day: string): string {
  const [d, m] = date.split('/');
  const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${day.slice(0, 3).toUpperCase()} ${d} ${monthNames[parseInt(m) - 1]}`;
}
