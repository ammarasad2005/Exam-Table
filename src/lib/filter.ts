import type { ExamEntry, FilterState } from './types';

export function filterExams(entries: ExamEntry[], filter: FilterState): ExamEntry[] {
  const q = filter.query.toLowerCase().trim();
  return entries.filter(e => {
    if (e.batch !== filter.batch) return false;
    if (e.school !== filter.school) return false;
    if (e.department !== filter.department) return false;
    if (q && !e.courseCode.toLowerCase().includes(q) && !e.courseName.toLowerCase().includes(q)) return false;
    return true;
  });
}

/**
 * Summer exam filter — does NOT filter by batch/school/department.
 * Instead, optionally filters by the student's selected summer courses
 * (course names from localStorage fsc_summer_courses), plus free-text search.
 *
 * If selectedCourses is empty or undefined, all summer exams are shown.
 */
export function filterSummerExams(
  entries: ExamEntry[],
  filter: { query: string; selectedCourses?: string[] }
): ExamEntry[] {
  const q = filter.query.toLowerCase().trim();
  const courses = filter.selectedCourses ?? [];

  return entries.filter(e => {
    // If the student has selected specific summer courses, filter by name match
    if (courses.length > 0) {
      const matches = courses.some(course => {
        const cl = course.toLowerCase().trim();
        const el = e.courseName.toLowerCase().trim();
        return el.includes(cl) || cl.includes(el);
      });
      if (!matches) return false;
    }
    // Apply free-text search
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
