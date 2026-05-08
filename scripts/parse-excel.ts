/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

interface ExamEntry {
  date: string;        // "DD/MM/YYYY"
  day: string;         // "Monday"
  time: string;        // "09:00 AM – 11:00 AM"
  courseCode: string;  // "CS1004"
  courseName: string;  // "Programming Fundamentals"
  batch: string;       // "2023"
  department: string;  // "CS" or "BBA"
  school: string;      // "FSC", "FSM", or "FSE"
}

const DEPARTMENTS = ['cs', 'ai', 'ds', 'cy', 'se', 'bba', 'af', 'ft', 'ba', 'ee', 'ce'];

// 1. Load workbook — do NOT use cellDates:true to avoid UTC timezone shift.
//    Instead we'll use the formatted 'w' text or the numeric serial.
const wb = XLSX.readFile('exam_schedule.xlsx', { cellDates: false, cellNF: true });

// 2. Expand merged cells
function expandMerges(sheet: any): void {
  const merges: any[] = sheet['!merges'] || [];
  for (const merge of merges) {
    const topLeft = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
    const topLeftCell = sheet[topLeft];
    if (!topLeftCell) continue;
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (addr !== topLeft) {
          sheet[addr] = { ...topLeftCell };
        }
      }
    }
  }
}

// Helper to get cell as raw object
function getCell(sheet: any, r: number, c: number): any {
  const addr = XLSX.utils.encode_cell({ r, c });
  return sheet[addr] || null;
}

// Helper to get cell value as string
function getCellStr(sheet: any, r: number, c: number): string {
  const cell = getCell(sheet, r, c);
  if (!cell) return '';
  return String(cell.v ?? '').trim();
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_MAP: Record<string, string> = {
  'january': '01', 'february': '02', 'march': '03', 'april': '04',
  'may': '05', 'june': '06', 'july': '07', 'august': '08',
  'september': '09', 'october': '10', 'november': '11', 'december': '12',
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
  'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
};

function getCellDisplay(sheet: any, r: number, c: number): string {
  const cell = getCell(sheet, r, c);
  if (!cell || cell.v === undefined || cell.v === null) return '';
  return String(cell.w ?? cell.v).trim();
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function findHeaderRow(sheet: any, range: any): { row: number; columns: Record<string, number> } | null {
  const aliases: Record<string, string> = {
    sno: 'serial',
    serialno: 'serial',
    date: 'date',
    timeslot: 'time',
    time: 'time',
    coursecode: 'courseCode',
    coursename: 'courseName',
    degreessections: 'degreeSections',
    degreesections: 'degreeSections',
    degreeandsections: 'degreeSections',
    batch: 'batch',
  };

  for (let r = range.s.r; r <= Math.min(range.e.r, 20); r++) {
    const columns: Record<string, number> = {};
    for (let c = range.s.c; c <= range.e.c; c++) {
      const key = aliases[normalizeHeader(getCellDisplay(sheet, r, c))];
      if (key) columns[key] = c;
    }

    if (
      columns.date !== undefined &&
      columns.time !== undefined &&
      columns.courseCode !== undefined &&
      columns.courseName !== undefined &&
      columns.degreeSections !== undefined &&
      columns.batch !== undefined
    ) {
      return { row: r, columns };
    }
  }

  return null;
}

// Keep date parsing explicit so the generated JSON shape remains DD/MM/YYYY + day.
function parseDateCell(cell: any): { date: string; day: string } | null {
  if (!cell || cell.v === undefined || cell.v === null || cell.v === '') return null;

  if (cell.t === 'n') {
    const serial = Number(cell.v);
    if (serial > 40000 && serial < 60000) {
      const parsed = XLSX.SSF.parse_date_code(serial);
      if (parsed) {
        const dd = String(parsed.d).padStart(2, '0');
        const mm = String(parsed.m).padStart(2, '0');
        const yyyy = String(parsed.y);
        const dt = new Date(parsed.y, parsed.m - 1, parsed.d);
        return { date: `${dd}/${mm}/${yyyy}`, day: DAY_NAMES[dt.getDay()] };
      }
    }
  }

  const candidates = [String(cell.v ?? '').trim(), String(cell.w ?? '').trim()].filter(Boolean);
  for (const raw of candidates) {
    const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const yyyy = isoMatch[1];
      const mm = isoMatch[2].padStart(2, '0');
      const dd = isoMatch[3].padStart(2, '0');
      const dt = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
      return { date: `${dd}/${mm}/${yyyy}`, day: DAY_NAMES[dt.getDay()] };
    }

    const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const dd = slashMatch[1].padStart(2, '0');
      const mm = slashMatch[2].padStart(2, '0');
      const yyyy = slashMatch[3];
      const dt = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
      return { date: `${dd}/${mm}/${yyyy}`, day: DAY_NAMES[dt.getDay()] };
    }

    const longWithDayMatch = raw.match(/^([A-Za-z]+),\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
    if (longWithDayMatch) {
      const dayName = longWithDayMatch[1];
      const monthName = longWithDayMatch[2].toLowerCase();
      const dd = longWithDayMatch[3].padStart(2, '0');
      const yyyy = longWithDayMatch[4];
      const mm = MONTH_MAP[monthName] ?? '01';
      return { date: `${dd}/${mm}/${yyyy}`, day: dayName };
    }

    const longMatch = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (longMatch) {
      const dd = longMatch[1].padStart(2, '0');
      const monthWord = longMatch[2].toLowerCase();
      const mm = MONTH_MAP[monthWord] ?? '01';
      const yyyy = longMatch[3];
      const dt = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
      return { date: `${dd}/${mm}/${yyyy}`, day: DAY_NAMES[dt.getDay()] };
    }
  }

  return null;
}

function parseBatch(rawValue: string): string {
  const match = rawValue.match(/\b(20\d{2})\b/);
  return match ? match[1] : '';
}

function parseDepartments(rawValue: string): string[] {
  const departments: string[] = [];
  const seen = new Set<string>();
  const deptPattern = /(?:BS\s*\(\s*(CS|AI|DS|CY|SE|AF|FT|BA|EE|CE)\s*\)|\b(BBA)\b)/gi;

  let match: RegExpExecArray | null;
  while ((match = deptPattern.exec(rawValue)) !== null) {
    const department = (match[1] || match[2]).toUpperCase();
    if (!seen.has(department)) {
      seen.add(department);
      departments.push(department);
    }
  }

  return departments;
}

// Build entries from the structured table format:
// Date | Time Slot | Course Code | Course Name | Degree & Sections | Batch
function buildEntries(
  sheet: any,
  range: any,
  school: string
): ExamEntry[] {
  const entries: ExamEntry[] = [];
  const seen = new Set<string>();
  const header = findHeaderRow(sheet, range);
  if (!header) return entries;

  const { row: headerRow, columns } = header;

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const dateInfo = parseDateCell(getCell(sheet, r, columns.date));
    if (!dateInfo) continue;

    const time = getCellDisplay(sheet, r, columns.time);
    const courseCode = getCellDisplay(sheet, r, columns.courseCode).toUpperCase();
    const courseName = getCellDisplay(sheet, r, columns.courseName) || 'Unknown Course';
    const degreeSections = getCellDisplay(sheet, r, columns.degreeSections);
    const batch = parseBatch(getCellDisplay(sheet, r, columns.batch));
    if (!time || !courseCode || !degreeSections || !batch) continue;

    for (const department of parseDepartments(degreeSections)) {
      if (!DEPARTMENTS.includes(department.toLowerCase())) continue;

      const dedupKey = `${dateInfo.date}|${time}|${courseCode}|${batch}|${department}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      entries.push({
        date: dateInfo.date,
        day: dateInfo.day,
        time,
        courseCode,
        courseName,
        batch,
        department,
        school,
      });
    }
  }

  return entries;
}

// Sort by date ascending, then time ascending
function parseDate(dateStr: string): number {
  const parts = dateStr.split('/').map(Number);
  return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
}

function parseTime(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function sortEntries(entries: ExamEntry[]): ExamEntry[] {
  return entries.sort((a, b) => {
    const dateDiff = parseDate(a.date) - parseDate(b.date);
    if (dateDiff !== 0) return dateDiff;
    return parseTime(a.time) - parseTime(b.time);
  });
}

// Main
const allRawEntries: ExamEntry[] = [];
for (const sheetName of ['FSC', 'FSM', 'FSE']) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) continue;
  const sheetRange = XLSX.utils.decode_range(sheet['!ref']);
  expandMerges(sheet);
  const sheetEntries = buildEntries(sheet, sheetRange, sheetName);
  allRawEntries.push(...sheetEntries);
}

const output = sortEntries(allRawEntries);

// Ensure output directory exists
const outDir = path.join('public', 'data');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'schedule.json'),
  JSON.stringify(output, null, 2),
  'utf-8'
);

// Fallback for timetable so the Next.js build doesn't fail on Vercel if it's missing
const timetablePath = path.join(outDir, 'timetable.json');
if (!fs.existsSync(timetablePath)) {
  fs.writeFileSync(timetablePath, '{}', 'utf-8');
  console.log('✅ Created empty fallback public/data/timetable.json');
}

console.log(`✅ Wrote ${output.length} exam entries to public/data/schedule.json`);
if (output.length > 0) {
  console.log(`   First entry date: ${output[0].date} (${output[0].day})`);
  console.log(`   Last  entry date: ${output[output.length-1].date} (${output[output.length-1].day})`);
}
if (output.length === 0) {
  console.warn('⚠️  Zero entries written — check Excel sheet structure and data format');
}
