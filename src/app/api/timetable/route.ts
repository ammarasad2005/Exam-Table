import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { flattenTimetable } from '@/lib/timetable-filter';
import type { TimetableEntry, SummerCourseCatalogEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';

// ─── URL helpers ─────────────────────────────────────────────────────────────

function extractSheetInfo(url: string): { spreadsheetId: string | null; gid: string | null } {
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = idMatch ? idMatch[1] : null;
  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : null;
  return { spreadsheetId, gid };
}

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else { cell += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ',') { row.push(cell.trim()); cell = ''; }
      else if (char === '\r' || char === '\n') {
        row.push(cell.trim()); cell = '';
        if (row.some(c => c !== '')) result.push(row);
        row = [];
        if (char === '\r' && nextChar === '\n') i++;
      } else { cell += char; }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c !== '')) result.push(row);
  }
  return result;
}

const headerAliases: Record<string, string[]> = {
  courseName:    ['coursename', 'course name', 'course', 'title', 'subject'],
  batch:         ['batch', 'year'],
  department:    ['department', 'dept', 'discipline'],
  section:       ['section', 'sec'],
  day:           ['day', 'weekday'],
  time:          ['time', 'timeslot', 'time slot', 'duration', 'slot'],
  room:          ['room', 'roomno', 'room no', 'room number', 'room_no'],
  type:          ['type', 'classtype'],
  category:      ['category', 'classcategory'],
  rescheduled:   ['rescheduled'],
  exam:          ['exam'],
  isElective:    ['iselective', 'elective', 'is_elective'],
  electiveGroup: ['electivegroup', 'group', 'elective_group'],
};

function parseBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const str = String(val).toLowerCase().trim();
  return str === 'true' || str === '1' || str === 'yes';
}

function processCSVRows(rows: string[][], defaultDay?: string): TimetableEntry[] {
  if (rows.length < 2) return [];

  // Determine if this is a 2D grid format (e.g. "Room" header on the left, time slots on top)
  let isGridFormat = false;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const firstCell = rows[i][0]?.toLowerCase().trim();
    if (firstCell === 'room' || firstCell === 'rooms') {
      isGridFormat = true;
      break;
    }
  }

  const entries: TimetableEntry[] = [];

  if (isGridFormat) {
    // ---- ADVANCED 2D GRID PARSING ----
    let currentTimeHeaders: string[] | null = null;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstCell = row[0]?.toLowerCase().trim();
      if (!firstCell) continue;
      
      // If we hit a header row, update currentTimeHeaders
      if (firstCell === 'room' || firstCell === 'rooms' || firstCell === 'lab' || firstCell === 'labs') {
        currentTimeHeaders = row;
        continue;
      }
      
      // If we have active headers, parse courses
      if (currentTimeHeaders) {
        const room = row[0]?.trim();
        
        // Skip empty or purely "Reserved" administrative rows
        if (!room || room.toLowerCase().includes("reserved") || room.toLowerCase().includes("students")) continue;
        
        for (let col = 1; col < row.length; col++) {
          const cell = row[col]?.trim();
          if (!cell || cell === '') continue; // Empty cell
          
          const timeSlot = currentTimeHeaders[col]?.trim();
          if (!timeSlot || timeSlot === '') continue; // Skip if no time header

          const type: 'lecture' | 'lab' =
            cell.toLowerCase().includes('lab') ? 'lab' : 'lecture';

          entries.push({
            courseName: cell,
            batch: '',
            department: '',
            section: '',
            day: defaultDay || '',
            time: timeSlot,
            room: room,
            type: type,
            category: 'regular',
            rescheduled: false,
            exam: false,
            isElective: false,
            electiveGroup: null,
          });
        }
      }
    }
    return entries;
  }

  // ---- FLAT TABLE PARSING ----
  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((h, index) => {
    const cleanH = h.toLowerCase().trim();
    for (const [key, aliases] of Object.entries(headerAliases)) {
      if (cleanH === key.toLowerCase() || aliases.includes(cleanH)) {
        headerMap[key] = index;
        break;
      }
    }
  });

  const getValue = (key: string, row: string[], defaultValue: unknown) => {
    const idx = headerMap[key];
    if (idx === undefined || idx >= row.length) return defaultValue;
    return row[idx] ?? defaultValue;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => c === '')) continue;
    const courseName = String(getValue('courseName', row, '')).trim();
    if (!courseName) continue;

    const typeVal = String(getValue('type', row, ''));
    const type: 'lecture' | 'lab' =
      typeVal.toLowerCase().includes('lab') || courseName.toLowerCase().endsWith('lab')
        ? 'lab'
        : 'lecture';

    const rawDay = String(getValue('day', row, '')).trim();
    const day = rawDay || defaultDay || '';

    entries.push({
      courseName,
      batch:         String(getValue('batch', row, '')),
      department:    String(getValue('department', row, '')),
      section:       String(getValue('section', row, '')),
      day,
      time:          String(getValue('time', row, '')),
      room:          String(getValue('room', row, '')),
      type,
      category:      String(getValue('category', row, 'regular')) as 'regular' | 'repeat',
      rescheduled:   parseBoolean(getValue('rescheduled', row, false)),
      exam:          parseBoolean(getValue('exam', row, false)),
      isElective:    parseBoolean(getValue('isElective', row, false)),
      electiveGroup: (getValue('electiveGroup', row, null) as string | null) || null,
    });
  }
  return entries;
}

// ─── Catalog helpers ──────────────────────────────────────────────────────────

/**
 * Build a default catalog from unique course names in the entries.
 * Used when the admin has not yet set up the catalog (course_mappings is empty).
 */
function autoBuildCatalog(entries: TimetableEntry[]): SummerCourseCatalogEntry[] {
  const seen = new Set<string>();
  const catalog: SummerCourseCatalogEntry[] = [];
  for (const e of entries) {
    if (e.courseName && !seen.has(e.courseName)) {
      seen.add(e.courseName);
      catalog.push({ sheetName: e.courseName, displayName: null, hidden: false });
    }
  }
  return catalog.sort((a, b) => a.sheetName.localeCompare(b.sheetName));
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function serveLocalFallback(catalog: SummerCourseCatalogEntry[] = []) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const timetableRaw = require('../../../../public/data/timetable.json');
    const entries = flattenTimetable(timetableRaw);
    return NextResponse.json({ entries, catalog });
  } catch (err) {
    console.error('Error reading/flattening local timetable:', err);
    return NextResponse.json({ error: 'Failed to retrieve timetable data' }, { status: 500 });
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const { data: settings, error } = await supabase
      .from('semester_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !settings) {
      console.error('Error fetching settings from Supabase, using fallback:', error);
      return serveLocalFallback();
    }

    const isSummer = settings.semester_type === 'summer';

    // ── Determine entries source ──────────────────────────────────────────────
    let entries: TimetableEntry[] = [];
    let usedFallback = false;

    if (settings.bypass_courses_config === true) {
      const { spreadsheetId } = extractSheetInfo(settings.google_sheets_url || '');
      if (!spreadsheetId) {
        console.error('[GViz Fetch Error] Invalid Google Sheets URL (no Spreadsheet ID found):', settings.google_sheets_url);
        usedFallback = true;
      } else {
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        try {
          // R1: Fetch sheets concurrently for all specified days
          const fetchPromises = DAYS.map(async (day) => {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(day)}`;
            try {
              const csvRes = await fetch(csvUrl, { next: { revalidate: 300 } });
              if (!csvRes.ok) {
                throw new Error(`HTTP ${csvRes.status}: ${csvRes.statusText}`);
              }
              const csvText = await csvRes.text();
              
              const trimmed = csvText.trim();
              const lowerTrimmed = trimmed.toLowerCase();
              if (
                lowerTrimmed.startsWith('<html>') ||
                lowerTrimmed.startsWith('<html') ||
                lowerTrimmed.startsWith('<!doctype html')
              ) {
                throw new Error('Received HTML instead of CSV (spreadsheet may be private or invalid)');
              }

              if (!csvText || csvText.trim() === '') {
                throw new Error('Received empty CSV content');
              }
              
              const rows = parseCSV(csvText);
              const dayEntries = processCSVRows(rows, day);
              return { day, entries: dayEntries, success: true };
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : String(err);
              // R2: Gracefully log warnings for failed sheets and skip them
              console.warn(`[GViz Fetch Warning] Skipped sheet for day "${day}" due to error:`, errorMsg);
              return { day, entries: [], success: false };
            }
          });

          const results = await Promise.all(fetchPromises);
          
          const allEntries: TimetableEntry[] = [];
          let successCount = 0;
          
          for (const res of results) {
            if (res.success) {
              allEntries.push(...res.entries);
              successCount++;
            }
          }

          // R3: Handle completely inaccessible sheets
          if (successCount === 0) {
            console.error(`[GViz Fetch Error] Google Spreadsheet (ID: ${spreadsheetId}) is completely inaccessible or all sheets failed to fetch.`);
            usedFallback = true;
          } else {
            entries = allEntries;
            if (successCount < DAYS.length) {
              const failedDays = results.filter(r => !r.success).map(r => r.day);
              console.warn(`[GViz Fetch Warning] Timetable partially loaded. Failed days: ${failedDays.join(', ')}`);
            }
          }
        } catch (err) {
          console.error('[GViz Fetch Error] Unexpected error during parallel fetch processing:', err);
          usedFallback = true;
        }
      }
    } else {
      usedFallback = true;
    }

    if (usedFallback) {
      // Build catalog from local fallback entries if in summer mode
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const timetableRaw = require('../../../../public/data/timetable.json');
        entries = flattenTimetable(timetableRaw);
      } catch {
        return NextResponse.json({ error: 'Failed to retrieve timetable data' }, { status: 500 });
      }
    }

    // ── Build catalog ─────────────────────────────────────────────────────────
    let catalog: SummerCourseCatalogEntry[] = [];

    if (isSummer) {
      const rawMappings = settings.course_mappings;
      const isEmptyCatalog =
        !rawMappings ||
        (Array.isArray(rawMappings) && rawMappings.length === 0);

      if (isEmptyCatalog) {
        // First-time: auto-generate from entries (all visible, no aliases)
        catalog = autoBuildCatalog(entries);
      } else {
        // Admin has curated the catalog — serve as-is
        catalog = rawMappings as SummerCourseCatalogEntry[];
      }
    }
    // Regular semester: catalog stays [] — frontend ignores it

    const response = { entries, catalog };

    return NextResponse.json(response);
  } catch (err) {
    console.error('API Error in timetable route:', err);
    return serveLocalFallback();
  }
}
