'use client';

/**
 * ReadingProgress — a thin laser-rail-colored progress bar at the top of the
 * viewport showing scroll progress through the current page.
 *
 * Appears on all pages. Uses the purple→orange laser-rail gradient (brand motif).
 * Respects prefers-reduced-motion (width still updates, but the CSS transition
 * is disabled by the global reduced-motion rule).
 */
import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="reading-progress"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}
