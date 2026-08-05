interface Props { days: number; }

export function CountdownBadge({ days }: Props) {
  if (days < 0) return null;
  const urgent = days <= 2;
  return (
    <span
      className="font-mono text-data-sm font-medium px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: urgent ? 'color-mix(in srgb, var(--color-urgent) 14%, transparent)' : 'var(--color-bg-subtle)',
        color: urgent ? 'var(--color-urgent)' : 'var(--color-text-tertiary)',
      }}
    >
      {days === 0 ? 'TODAY' : days === 1 ? '1d' : `${days}d`}
    </span>
  );
}
