'use client';

/**
 * ReducedMotionIndicator — a small badge that appears in the header when the
 * user has `prefers-reduced-motion: reduce` enabled. Helps QA confirm the
 * setting is detected, and reassures users that their preference is respected.
 *
 * Hidden when reduced-motion is OFF (most users). Visible as a small mono
 * badge with a vibrations-off icon when ON.
 */
import { useEffect, useState } from 'react';
import { VibrateOff } from 'lucide-react';

export function ReducedMotionIndicator() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!reduced) return null;

  return (
    <span
      className="hidden md:inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] font-mono text-data-sm text-[var(--color-text-secondary)]"
      title="Reduced motion is ON — animations are minimized per your system preference"
      aria-label="Reduced motion is enabled"
    >
      <VibrateOff width={12} height={12} strokeWidth={2} aria-hidden="true" />
      <span>reduced motion</span>
    </span>
  );
}
