export interface ExamEntry {
  date: string;        // "DD/MM/YYYY"
  day: string;         // "Monday"
  time: string;        // "09:00 AM – 11:00 AM"
  courseCode: string;  // "CS1004"
  courseName: string;
  batch: string;       // "2023"
  department: Department;
}

export type Department = 'CS' | 'AI' | 'DS' | 'CY' | 'SE';

export interface FilterState {
  batch: string;
  department: Department;
  query: string;       // live search string
}

export const DEPARTMENTS: Department[] = ['CS', 'AI', 'DS', 'CY', 'SE'];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  CS: 'Computer Science',
  AI: 'Artificial Intelligence',
  DS: 'Data Science',
  CY: 'Cyber Security',
  SE: 'Software Engineering',
};

// Derive available batches from loaded data at runtime
export function getAvailableBatches(entries: ExamEntry[]): string[] {
  return [...new Set(entries.map(e => e.batch))].sort().reverse();
}
