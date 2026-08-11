'use client';

/**
 * BackToTop — floating button that appears after scrolling down, smooth-scrolls to top.
 *
 * Design: ink-primary (matches the redesign's primary action color), appears at
 * bottom-right above the floating nav dock on desktop / above the FAB zone on mobile.
 * Respects prefers-reduced-motion (instant scroll). Hidden until user scrolls 600px.
 * Hidden on the lost-found page (which has its own fixed bottom bar on mobile).
 */
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Hide on lost-found mobile (it has its own fixed bottom report pill)
  const hideOnMobile = pathname === '/lost-found';

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      className={`fixed right-5 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-primary-action)] text-[var(--color-primary-action-fg)] shadow-float border border-[var(--color-border)] hover:bg-[var(--color-primary-action-hover)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
        hideOnMobile ? 'bottom-24 md:bottom-24' : 'bottom-24 md:bottom-24'
      }`}
      style={{ animation: 'page-enter 200ms ease-out both' }}
    >
      <ArrowUp width={18} height={18} strokeWidth={2.25} />
    </button>
  );
}
