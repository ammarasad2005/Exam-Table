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

// 3. Build time_row: col_index → "HH:MM AM – HH:MM AM"
// Row index 3 (0-based) = row 4 in Excel
function buildTimeRow(sheet: any, range: any): Map<number, string> {
  const timeMap = new Map<number, string>();
  for (let c = 1; c <= range.e.c; c++) {
    const cell = getCell(sheet, 3, c);
    if (!cell || cell.v === undefined) continue;
    const val = String(cell.w || cell.v).trim();
    if (val) timeMap.set(c, val);
  }
  return timeMap;
}

// 4. Build date_col: row_index → { date: string, day: string }
// KEY FIX: Use the Excel formatted 'w' string or parse the serial with SSF,
// NOT JavaScript Date objects (which apply UTC and cause timezone off-by-one).
function buildDateCol(sheet: any, range: any): Map<number, { date: string; day: string }> {
  const dateMap = new Map<number, { date: string; day: string }>();

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTH_MAP: Record<string, string> = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12',
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  };

  for (let r = 4; r <= range.e.r; r++) {
    const cell = getCell(sheet, r, 0);
    if (!cell || cell.v === undefined || cell.v === null || cell.v === '') continue;

    let dateStr = '';
    let dayStr = '';

    // Strategy: if it's a numeric serial (Excel date), use XLSX.SSF.parse_date_code
    // which returns { y, m, d, H, M, S } in LOCAL calendar (no timezone issue).
    if (cell.t === 'n') {
      const serial = Number(cell.v);
      if (serial > 40000 && serial < 60000) {
        const parsed = XLSX.SSF.parse_date_code(serial);
        if (parsed) {
          const dd = String(parsed.d).padStart(2, '0');
          const mm = String(parsed.m).padStart(2, '0');
          const yyyy = String(parsed.y);
          dateStr = `${dd}/${mm}/${yyyy}`;
          // Compute day of week using UTC constructor (no tz issue, all we need is weekday)
          const dt = new Date(parsed.y, parsed.m - 1, parsed.d);
          dayStr = DAY_NAMES[dt.getDay()];
        }
      }
    }

    // Strategy 2: cell was stored as a Date object (cellDates mode) — read its 'w' formatted text
    // Since we're now using cellDates:false, type 'd' shouldn't appear, but handle as fallback
    if (!dateStr && cell.t === 'd' && cell.w) {
      // 'w' is the formatted text like "Thursday, April 09, 2026"
      const raw = String(cell.w).trim();
      const m = raw.match(/([A-Za-z]+),\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
      if (m) {
        const dayName = m[1];
        const monthName = m[2].toLowerCase();
        const dd = m[3].padStart(2, '0');
        const yyyy = m[4];
        const mm = MONTH_MAP[monthName] ?? '01';
        dateStr = `${dd}/${mm}/${yyyy}`;
        dayStr = dayName;
      }
    }

    // Strategy 3: text strings
    if (!dateStr) {
      const raw = String(cell.v).trim();

      // "DD/MM/YYYY"
      const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slashMatch) {
        const dd = slashMatch[1].padStart(2, '0');
        const mm = slashMatch[2].padStart(2, '0');
        const yyyy = slashMatch[3];
        dateStr = `${dd}/${mm}/${yyyy}`;
        const dt = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
        dayStr = DAY_NAMES[dt.getDay()];
      }

      // "12 May 2025"
      if (!dateStr) {
        const longMatch = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
        if (longMatch) {
          const dd = longMatch[1].padStart(2, '0');
          const monthWord = longMatch[2].toLowerCase();
          const mm = MONTH_MAP[monthWord] ?? '01';
          const yyyy = longMatch[3];
          dateStr = `${dd}/${mm}/${yyyy}`;
          const dt = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
          dayStr = DAY_NAMES[dt.getDay()];
        }
      }
    }

    // Also check 'w' (formatted text) if nothing else worked
    if (!dateStr && cell.w) {
      const raw = String(cell.w).trim();
      // "Thursday, April 09, 2026"
      const mLong = raw.match(/([A-Za-z]+),\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
      if (mLong) {
        const dayName = mLong[1];
        const monthName = mLong[2].toLowerCase();
        const dd = mLong[3].padStart(2, '0');
        const yyyy = mLong[4];
        const mm = MONTH_MAP[monthName] ?? '01';
        dateStr = `${dd}/${mm}/${yyyy}`;
        dayStr = dayName;
      }
      // "9/4/2026" or "4/9/2026"
      if (!dateStr) {
        const mSlash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mSlash) {
          // Excel typically formats as M/D/YYYY in 'w', so treat as M/D/YYYY
          const mmExcel = mSlash[1].padStart(2, '0');
          const ddExcel = mSlash[2].padStart(2, '0');
          const yyyy = mSlash[3];
          dateStr = `${ddExcel}/${mmExcel}/${yyyy}`;
          const dt = new Date(parseInt(yyyy), parseInt(mmExcel) - 1, parseInt(ddExcel));
          dayStr = DAY_NAMES[dt.getDay()];
        }
      }
    }

    if (dateStr) {
      dateMap.set(r, { date: dateStr, day: dayStr || 'Unknown' });
    }
  }

  return dateMap;
}

/**
 * Parse a full cell value (potentially multi-line) using the positional structure:
 *
 *   Line 1:   {COURSE_CODE}  {Course Name}
 *   Line N:   BS({STREAM})  (sections...)     ← one per department
 *   Last:     {BATCH}                         ← standalone year at the end
 *
 * Returns one result object per BS({STREAM}) line found.
 * If the cell doesn't follow this structure, returns [].
 */
function parseCell(rawValue: string): Array<{
  courseCode: string;
  courseName: string;
  department: string;
  batch: string;
}> {
  // Normalize: split on \r\n or \n into trimmed, non-empty lines
  const lines = rawValue.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // --- Line 1: course code (first token) + course name (rest of line) ---
  const firstLine = lines[0];
  const codeMatch = firstLine.match(/^([A-Za-z]{2,4}\d{3,5})\b/);
  if (!codeMatch) return [];
  const courseCode = codeMatch[1].toUpperCase();
  // Course name = everything after the course code on line 1, trimmed
  const courseName = firstLine.slice(codeMatch[0].length).trim() || 'Unknown Course';

  // --- Batch: last \b20\d{2}\b anywhere in the full cell text ---
  const allBatches = rawValue.match(/\b(20\d{2})\b/g);
  if (!allBatches || allBatches.length === 0) return [];
  const batch = allBatches[allBatches.length - 1];

  // --- Departments: each line that starts with BS({STREAM}) contributes one entry ---
  const results: Array<{ courseCode: string; courseName: string; department: string; batch: string }> = [];

  for (const line of lines.slice(1)) {
    // Match BS(CS), BBA, BS(AF), BS(EE) etc. at the start of the line (after optional whitespace)
    const bsMatch = line.match(/^(?:BS\s*\(\s*(CS|AI|DS|CY|SE|AF|FT|BA|EE|CE)\s*\)|(BBA))(?:[^\w]|$)/i);
    if (!bsMatch) continue;
    const department = (bsMatch[1] || bsMatch[2]).toUpperCase();

    results.push({ courseCode, courseName, department, batch });
  }

  return results;
}

// 9. Build entries — parse each cell using the multi-line positional structure
function buildEntries(
  sheet: any,
  timeRow: Map<number, string>,
  dateCol: Map<number, { date: string; day: string }>,
  range: any,
  school: string
): ExamEntry[] {
  const entries: ExamEntry[] = [];
  const seen = new Set<string>();

  for (let r = 4; r <= range.e.r; r++) {
    const dateInfo = dateCol.get(r);
    if (!dateInfo) continue;

    for (let c = 1; c <= range.e.c; c++) {
      const time = timeRow.get(c);
      if (!time) continue;

      const cell = getCell(sheet, r, c);
      if (!cell || cell.v === undefined) continue;

      const rawValue = String(cell.v ?? '').trim();
      if (!rawValue) continue;

      const parsed = parseCell(rawValue);
      for (const p of parsed) {
        if (!DEPARTMENTS.includes(p.department.toLowerCase())) continue;

        const dedupKey = `${dateInfo.date}|${time}|${p.courseCode}|${p.batch}|${p.department}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        entries.push({
          date: dateInfo.date,
          day: dateInfo.day,
          time,
          courseCode: p.courseCode,
          courseName: p.courseName,
          batch: p.batch,
          department: p.department,
          school,
        });
      }
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
  const timeRow = buildTimeRow(sheet, sheetRange);
  const dateCol = buildDateCol(sheet, sheetRange);
  const sheetEntries = buildEntries(sheet, timeRow, dateCol, sheetRange, sheetName);
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

