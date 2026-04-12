'use client';
import type { TimetableEntry } from '@/lib/types';
import { formatTimeRange } from '@/lib/timetable-filter';

interface Props {
  entry: TimetableEntry;
  dept: string;
  conflicting?: boolean;
  onClick: () => void;
}

export function TimetableCard({ entry, dept, conflicting = false, onClick }: Props) {
  const accentColor = `var(--accent-${dept.toLowerCase()})`;
  const accentBg    = `var(--accent-${dept.toLowerCase()}-bg)`;

  const isLab = entry.type === 'lab';

  return (
    <button
      onClick={onClick}
      className="timetable-card w-full text-left bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-2 active:scale-[0.98] transition-all duration-100 hover:border-[var(--color-border-strong)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
      style={{
        borderLeftWidth: conflicting ? '3px' : undefined,
        borderLeftColor: conflicting ? '#f87171' : undefined,
      }}
    >
      {/* Top row: course name truncated + type badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-mono text-xs font-medium px-2 py-0.5 rounded shrink-0"
          style={{ backgroundColor: accentBg, color: accentColor }}
        >
          {entry.section}
        </span>

        <div className="flex flex-wrap gap-1">
          {conflicting && (
            <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 shrink-0">
              ⚠ Conflict
            </span>
          )}
          {entry.exam && (
            <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-rose-900/40 dark:text-rose-400 shrink-0">
              📅 Exam
            </span>
          )}
          {entry.rescheduled && (
            <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 shrink-0">
              ✨ Rescheduled
            </span>
          )}
          {!conflicting && !entry.rescheduled && !entry.exam && (
            <span
              className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
              style={
                isLab
                  ? { backgroundColor: 'var(--accent-ds-bg)', color: 'var(--accent-ds)' }
                  : { backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)' }
              }
            >
              {isLab ? 'Lab' : 'Lecture'}
            </span>
          )}
        </div>
      </div>

      {/* Course name */}
      <p className="font-body text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
        {entry.courseName}
      </p>

      {/* Time */}
      <p className="font-mono text-xs text-[var(--color-text-secondary)]">
        {formatTimeRange(entry.time)}
      </p>

      {/* Room */}
      <p className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
        {entry.room === 'TBA' ? (
          <span className="italic">Room TBA</span>
        ) : (
          <>Room {entry.room}</>
        )}
      </p>
    </button>
  );
}
