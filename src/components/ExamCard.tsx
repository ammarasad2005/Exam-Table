'use client';
import type { ExamEntry, Department } from '@/lib/types';
import { getDaysUntil } from '@/lib/dates';
import { CountdownBadge } from './CountdownBadge';

interface Props {
  exam: ExamEntry;
  dept: Department;
  onClick: () => void;
}

export function ExamCard({ exam, dept, onClick }: Props) {
  const accentColor = `var(--accent-${dept.toLowerCase()})`;
  const accentBg = `var(--accent-${dept.toLowerCase()}-bg)`;
  const daysUntil = getDaysUntil(exam.date);

  return (
    <button
      onClick={onClick}
      className="exam-card w-full text-left bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-2 active:scale-[0.98] transition-all duration-100 hover:border-[var(--color-border-strong)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
      style={{ '--ring-color': accentColor } as React.CSSProperties}
    >
      {/* Top row: course code + countdown */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-xs font-medium px-2 py-0.5 rounded"
          style={{ backgroundColor: accentBg, color: accentColor }}
        >
          {exam.courseCode}
        </span>
        {daysUntil !== null && daysUntil >= 0 && (
          <CountdownBadge days={daysUntil} />
        )}
        {daysUntil !== null && daysUntil < 0 && (
          <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)]">
            Passed
          </span>
        )}
      </div>

      {/* Course name */}
      <p className="font-body text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
        {exam.courseName}
      </p>

      {/* Time */}
      <p className="font-mono text-xs text-[var(--color-text-secondary)]">
        {exam.time}
      </p>
    </button>
  );
}
