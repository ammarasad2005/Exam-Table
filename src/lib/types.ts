export interface ExamEntry {
  date: string;        // "DD/MM/YYYY"
  day: string;         // "Monday"
  time: string;        // "09:00 AM – 11:00 AM"
  courseCode: string;  // "CS1004"
  courseName: string;
  batch: string;       // "2023"
  department: string;
  school: string;
}

export const SCHOOLS = ['FSC', 'FSM', 'FSE'];

export const SCHOOL_DEPARTMENTS: Record<string, string[]> = {
  FSC: ['CS', 'AI', 'DS', 'CY', 'SE'],
  FSM: ['BBA', 'AF', 'BA', 'FT'],
  FSE: ['EE', 'CE']
};

export interface FilterState {
  batch: string;
  department: string;
  school: string;
  query: string;       // live search string
}

export const DEPARTMENTS: string[] = ['CS', 'AI', 'DS', 'CY', 'SE', 'BBA', 'AF', 'BA', 'FT', 'EE', 'CE'];

export const DEPARTMENT_LABELS: Record<string, string> = {
  CS: 'Computer Science',
  AI: 'Artificial Intelligence',
  DS: 'Data Science',
  CY: 'Cyber Security',
  SE: 'Software Engineering',
  BBA: 'Bachelor of Business Admin',
  AF: 'Accounting and Finance',
  BA: 'Business Analytics',
  FT: 'FinTech',
  EE: 'Electrical Engineering',
  CE: 'Computer Engineering'
};

// Derive available batches from loaded data at runtime
export function getAvailableBatches(entries: ExamEntry[]): string[] {
  return [...new Set(entries.map(e => e.batch))].sort().reverse();
}

// ─── Timetable Types ──────────────────────────────────────────────────────────

/**
 * A single class slot extracted from the Python-generated timetable JSON.
 * The Python script stores times as "HH:MM - HH:MM" (24-h), room as a string,
 * and classifies courses as 'regular' | 'repeat'.
 */
export interface TimetableEntry {
  courseName: string;                  // "Programming Fundamentals"
  batch: string;                       // "2024"
  department: string;                  // "CS"
  section: string;                     // "A", "BX", "A1" etc.
  day: string;                         // "Monday"
  time: string;                        // "08:30 - 10:00" (from Python)
  room: string;                        // "CR-01", "TBA"
  type: 'lecture' | 'lab';             // inferred: 'lab' if name ends with 'Lab'
  category: 'regular' | 'repeat';      // from Python hierarchy key
  rescheduled?: boolean;               // flags special manual slots
  exam?: boolean;                      // flags "Mid", "Exam", or "Sessional" slots
}

export const TIMETABLE_META_KEY = '__meta__';

export interface TimetableSheetMeta {
  sheetName: string;
  date?: string;
}

export interface TimetableMetadata {
  days: Record<string, TimetableSheetMeta>;
}

export type TimetableSlot = {
  room: string;
  time: string;
  rescheduled?: boolean;
  exam?: boolean;
};

export type TimetableDayMap = Record<string, TimetableSlot[]>;

export type TimetableSectionMap = Record<string, TimetableDayMap>;

export type TimetableCourseMap = Record<string, TimetableSectionMap>;

export interface TimetableDepartmentMap {
  regular: TimetableCourseMap;
  repeat: TimetableCourseMap;
}

export type TimetableBatchMap = Record<string, TimetableDepartmentMap>;

export const DAYS_ORDER: string[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

// Fixed section set shown on the home-page pill selector.
// Dynamically available sections are filtered from loaded data
// after batch+dept are chosen.
export const TIMETABLE_SECTIONS: string[] = ['A', 'B', 'C', 'BX'];

// ─── Timetable raw JSON shape (from Python script) ───────────────────────────
// batch → dept → ("regular"|"repeat") → courseName → section → day → [{room,time}]
export type RawTimetableJSON = Record<
  string,
  TimetableBatchMap
> & {
  [TIMETABLE_META_KEY]?: TimetableMetadata;
};
