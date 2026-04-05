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
