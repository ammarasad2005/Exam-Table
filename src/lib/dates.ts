// Parse "DD/MM/YYYY" → Date object
export function parseExamDate(dateStr: string): Date | null {
  const [d, m, y] = dateStr.split('/').map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

// Returns days from today to exam date (negative if passed)
export function getDaysUntil(dateStr: string): number | null {
  const examDate = parseExamDate(dateStr);
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = examDate.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// "12/05/2025" → "12 May 2025"
export function formatDate(dateStr: string): string {
  const [d, m, y] = dateStr.split('/');
  const month = new Date(2000, parseInt(m) - 1, 1).toLocaleString('en', { month: 'long' });
  return `${parseInt(d)} ${month} ${y}`;
}

export function parseTime(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function sortByChronological(a: ExamEntry, b: ExamEntry): number {
  const [ad, am, ay] = a.date.split('/').map(Number);
  const [bd, bm, by] = b.date.split('/').map(Number);
  const da = new Date(ay, am - 1, ad).getTime();
  const db = new Date(by, bm - 1, bd).getTime();
  if (da !== db) return da - db;
  return parseTime(a.time) - parseTime(b.time);
}

import type { ExamEntry } from './types';
