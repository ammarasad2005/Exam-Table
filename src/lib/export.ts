import type { ExamEntry } from './types';

// Download as CSV
export function downloadCSV(entries: ExamEntry[]): void {
  try {
    const header = 'Date,Day,Time,Course Code,Course Name,Batch,Department';
    const rows = entries.map(e =>
      [e.date, e.day, e.time, e.courseCode, `"${e.courseName}"`, e.batch, e.department].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fsc-exams-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('CSV export failed:', err);
  }
}

// Download as XLSX
// Download as XLSX (Matching the provided screenshot style)
export async function downloadXLSX(entries: ExamEntry[]): Promise<void> {
  try {
    // Dynamically import to avoid breaking Next.js SSR
    const { Workbook } = await import('exceljs');
    const { saveAs } = (await import('file-saver')).default;

    const wb = new Workbook();
    wb.creator = 'FSC Exams Engine';
    const sheet = wb.addWorksheet('Exam Timetable');

    // Define columns as per the original content, but styled like the screenshot
    sheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Day', key: 'day', width: 14 },
      { header: 'Time', key: 'time', width: 25 },
      { header: 'Course Code', key: 'courseCode', width: 18 },
      { header: 'Course Name', key: 'courseName', width: 55 },
      { header: 'Batch', key: 'batch', width: 12 },
      { header: 'Department', key: 'department', width: 16 },
    ];

    // Insert Data
    sheet.addRows(entries);

    // -- Styling: Header Row --
    const headerRow = sheet.getRow(1);
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      // Dark navy blue background, white bold text, centered
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F3864' }, // A dark blue common in standard tables
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      // Thin explicit borders for the header
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // -- Styling: Data Rows --
    entries.forEach((_, index) => {
      const row = sheet.getRow(index + 2); // 1-based index, plus 1 for header
      row.height = 18;

      row.eachCell((cell, colNumber) => {
        // Center all data cells perfectly as seen in the screenshot,
        // EXCEPT Course Name (col 5) which we left-align for readability.
        if (colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        
        // Plain white fill
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' }
        };
        // Thin borders for that pronounced grid feeling
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        };
      });
    });

    // Buffer to blob and save
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Exam_Timetable_${Date.now()}.xlsx`);
  } catch (err) {
    console.error('XLSX export failed:', err);
  }
}

// Generate .ics for a single exam and trigger download
export function generateICS(exam: ExamEntry): void {
  try {
    const [d, m, y] = exam.date.split('/');
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // Parse start/end from time string "09:00 AM – 11:00 AM"
    const parts = exam.time.split('–').map(s => s.trim());
    const startStr = parts[0] ?? '';
    const endStr = parts[1] ?? parts[0] ?? '';
    const startDT = toICSDateTime(y, m, d, startStr);
    const endDT   = toICSDateTime(y, m, d, endStr);

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FSC Exams//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDT}`,
      `DTEND:${endDT}`,
      `DTSTAMP:${dtStamp}`,
      `SUMMARY:${exam.courseCode} – ${exam.courseName}`,
      `DESCRIPTION:Batch ${exam.batch}\\nDepartment: ${exam.department}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.courseCode}-exam.ics`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('ICS export failed:', err);
  }
}

function toICSDateTime(y: string, m: string, d: string, timeStr: string): string {
  // "09:00 AM" or "11:00 PM" → YYYYMMDDTHHMMSS
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return `${y}${m.padStart(2,'0')}${d.padStart(2,'0')}T090000`;
  let h = parseInt(match[1]);
  const min = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${y}${m.padStart(2,'0')}${d.padStart(2,'0')}T${String(h).padStart(2,'0')}${min}00`;
}
