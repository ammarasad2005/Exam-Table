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
