'use client';

/**
 * useScrollReveal — IntersectionObserver-based scroll reveal (DESIGN_BRIEF §3.6 T20).
 *
 * Adds the `.in-view` class to elements with `.reveal` or `.reveal-stagger` when
 * they enter the viewport. The CSS (globals.css) handles the opacity/transform
 * transition + stagger delays.
 *
 * Respects prefers-reduced-motion: the CSS forces `.reveal` elements to
 * opacity:1 / transform:none under reduced-motion, so this hook is a no-op
 * visually (it still adds the class, which has no effect).
 *
 * Usage:
 *   const ref = useScrollReveal<HTMLDivElement>();
 *   return <div ref={ref} className="reveal">…</div>;
 *
 * For staggered children:
 *   const ref = useScrollReveal<HTMLUListElement>();
 *   return <ul ref={ref} className="reveal-stagger">…</ul>;
 *
 * IMPORTANT (design rule): only apply to heroes, section headers, and non-data
 * sections. NEVER apply to data cells/cards in timetable/schedule/rooms grids —
 * clarity beats decoration there.
 */

import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options?: { threshold?: number; rootMargin?: string; once?: boolean }
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR / no-IO fallback: just reveal.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in-view');
      return;
    }

    const {
      threshold = 0.12,
      rootMargin = '0px 0px -8% 0px',
      once = true,
    } = options ?? {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('in-view');
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin, options?.once]);

  return ref;
}

/**
 * useScrollRevealAll — observe every element matching a selector within a root.
 * Useful for applying reveal to multiple siblings without wrapping them.
 */
export function useScrollRevealAll<T extends HTMLElement = HTMLElement>(
  selector: string = '.reveal, .reveal-stagger',
  options?: { threshold?: number; rootMargin?: string; once?: boolean }
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>(selector);
    if (targets.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((t) => t.classList.add('in-view'));
      return;
    }

    const {
      threshold = 0.12,
      rootMargin = '0px 0px -8% 0px',
      once = true,
    } = options ?? {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('in-view');
          }
        });
      },
      { threshold, rootMargin }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [selector, options?.threshold, options?.rootMargin, options?.once]);

  return ref;
}
