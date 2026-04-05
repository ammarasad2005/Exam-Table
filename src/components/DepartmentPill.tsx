const ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
  CS: { bg: 'var(--accent-cs-bg)', text: 'var(--accent-cs)', ring: 'var(--accent-cs)' },
  AI: { bg: 'var(--accent-ai-bg)', text: 'var(--accent-ai)', ring: 'var(--accent-ai)' },
  DS: { bg: 'var(--accent-ds-bg)', text: 'var(--accent-ds)', ring: 'var(--accent-ds)' },
  CY: { bg: 'var(--accent-cy-bg)', text: 'var(--accent-cy)', ring: 'var(--accent-cy)' },
  SE: { bg: 'var(--accent-se-bg)', text: 'var(--accent-se)', ring: 'var(--accent-se)' },
};

interface Props {
  dept: string;
  selected: boolean;
  onClick: () => void;
}

export function DepartmentPill({ dept, selected, onClick }: Props) {
  const colors = ACCENT[dept];
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={selected ? {
        backgroundColor: colors.bg,
        color: colors.text,
        boxShadow: `0 0 0 2px ${colors.ring}`,
        borderColor: 'transparent',
      } : {}}
      className="h-11 rounded-md border border-[var(--color-border-strong)] font-mono text-sm font-medium transition-all duration-150 active:scale-95 hover:bg-[var(--color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2"
    >
      {dept}
    </button>
  );
}
