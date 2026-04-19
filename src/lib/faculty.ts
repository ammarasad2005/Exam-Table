// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacultyMember {
  name: string;
  status: string;       // e.g. "Associate Professor", "HoD (CS) & Professor"
  email: string;
  office_number: string;
  linkedin: string | null;
  profile_url: string;
  image_url: string;
}

/** The department key as used in faculty_data.json */
export type DeptGroupKey =
  | 'AI & Data Science'
  | 'Accounting & Finance'
  | 'Computer Engineering'
  | 'Computer Science'
  | 'Cyber Security'
  | 'Electrical Engineering'
  | 'Management Sciences'
  | 'Sciences & Humanities'
  | 'Software Engineering';

/** The short file keys (e.g. AIDS.json → 'AIDS') */
export type DeptFileKey = 'AIDS' | 'AF' | 'CE' | 'CS' | 'CY' | 'EE' | 'MS' | 'SE' | 'SH';

/** Maps short file key → full display name */
export const DEPT_LABELS: Record<DeptFileKey, string> = {
  AIDS: 'AI & Data Science',
  AF:   'Accounting & Finance',
  CE:   'Computer Engineering',
  CS:   'Computer Science',
  CY:   'Cyber Security',
  EE:   'Electrical Engineering',
  MS:   'Management Sciences',
  SE:   'Software Engineering',
  SH:   'Sciences & Humanities',
};

/** Maps full group key (from faculty_data.json) → short file key */
export const DEPT_KEY_FROM_GROUP: Record<DeptGroupKey, DeptFileKey> = {
  'AI & Data Science':    'AIDS',
  'Accounting & Finance': 'AF',
  'Computer Engineering': 'CE',
  'Computer Science':     'CS',
  'Cyber Security':       'CY',
  'Electrical Engineering': 'EE',
  'Management Sciences':  'MS',
  'Sciences & Humanities': 'SH',
  'Software Engineering': 'SE',
};

/** Ordered list of departments for the filter bar */
export const DEPT_ORDER: DeptFileKey[] = ['AIDS', 'CS', 'SE', 'CY', 'EE', 'CE', 'MS', 'AF', 'SH'];

// ─── Accent colours per dept ──────────────────────────────────────────────────
// Using the same CSS variable naming convention as the rest of the app,
// mapped to dept file keys.
export const DEPT_ACCENT: Record<DeptFileKey, string> = {
  AIDS: 'ai',
  CS:   'cs',
  SE:   'se',
  CY:   'cy',
  EE:   'ee',
  CE:   'ce',
  MS:   'bba',   // closest match in existing palette
  AF:   'af',
  SH:   'ds',    // closest match
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Normalise a string for case-insensitive substring searching. */
function norm(s: string) { return s.toLowerCase(); }

/**
 * Filter a flat array of FacultyMember by a free-text query.
 * Searches: name, status, email, office_number.
 */
export function searchFaculty<T extends FacultyMember>(members: T[], query: string): T[] {
  if (!query.trim()) return members;
  const q = norm(query.trim());
  return members.filter(m =>
    norm(m.name).includes(q) ||
    norm(m.status).includes(q) ||
    norm(m.email).includes(q) ||
    norm(m.office_number).includes(q)
  );
}

/**
 * Given the grouped faculty_data.json object, returns a flat array
 * with each member tagged with its DeptFileKey.
 */
export function flattenFaculty(
  grouped: Record<string, FacultyMember[]>
): Array<FacultyMember & { deptKey: DeptFileKey }> {
  const out: Array<FacultyMember & { deptKey: DeptFileKey }> = [];
  for (const [groupName, members] of Object.entries(grouped)) {
    const deptKey = DEPT_KEY_FROM_GROUP[groupName as DeptGroupKey];
    if (!deptKey) continue;
    for (const m of members) {
      out.push({ ...m, deptKey });
    }
  }
  return out;
}
