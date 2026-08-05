'use client';

/**
 * LastUpdated — a small "Updated Aug 5, 2026" badge showing when data was last
 * refreshed. Pass a date string (derived at build time via getDataLastUpdated).
 *
 * Design: mono eyebrow style, tertiary text, subtle. Sits near page headers or
 * section labels. No interaction — purely informational.
 */
interface LastUpdatedProps {
  date: string | null;
  label?: string;
  className?: string;
}

export function LastUpdated({ date, label = 'Updated', className = '' }: LastUpdatedProps) {
  if (!date) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-data-sm text-[var(--color-text-tertiary)] ${className}`}
      title={`Data last refreshed on ${date}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span>{label} {date}</span>
    </span>
  );
}
