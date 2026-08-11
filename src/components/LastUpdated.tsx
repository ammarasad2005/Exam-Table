'use client';

/**
 * LastUpdated — a small "Updated Aug 5, 2026" badge showing when data was last
 * refreshed. Pass a date string (derived at build time via getDataLastUpdated).
 *
 * Design: mono eyebrow style, tertiary text, subtle. Sits near page headers or
 * section labels. Hover/focus reveals a tooltip explaining the data source.
 */
interface LastUpdatedProps {
  date: string | null;
  label?: string;
  className?: string;
  /** Tooltip text explaining where the data comes from. */
  source?: string;
}

export function LastUpdated({ date, label = 'Updated', className = '', source }: LastUpdatedProps) {
  if (!date) return null;
  const tooltip = source
    ? `${label} ${date} — Source: ${source}`
    : `${label} ${date}`;
  return (
    <span
      className={`group relative inline-flex items-center gap-1.5 font-mono text-data-sm text-[var(--color-text-tertiary)] ${className}`}
      title={tooltip}
      tabIndex={0}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span>{label} {date}</span>
      {source && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md bg-[var(--color-primary-action)] text-[var(--color-primary-action-fg)] font-mono text-data-sm whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-10 shadow-float"
        >
          Source: {source}
        </span>
      )}
    </span>
  );
}
