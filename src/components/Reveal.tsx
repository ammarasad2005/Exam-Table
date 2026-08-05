'use client';

/**
 * Reveal — a lightweight wrapper that applies the scroll-reveal animation
 * (DESIGN_BRIEF §3.6 T20) to its children.
 *
 * Uses IntersectionObserver via the useScrollReveal hook. The CSS (.reveal /
 * .reveal.in-view) lives in globals.css. Respects prefers-reduced-motion
 * (elements appear instantly — handled in CSS).
 *
 * Usage:
 *   <Reveal as="section">…</Reveal>
 *   <Reveal stagger>…children stagger in…</Reveal>
 *   <Reveal delay={120}>…slightly later…</Reveal>
 *
 * IMPORTANT (design rule): only use on heroes, section headers, and non-data
 * sections. NEVER wrap data cells/cards in timetable/schedule/rooms grids —
 * clarity beats decoration there.
 */
import { ElementType, ReactNode } from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

interface RevealProps {
  children: ReactNode;
  /** Render as a different element (default: div). */
  as?: ElementType;
  /** Stagger direct children instead of revealing the wrapper. */
  stagger?: boolean;
  /** Extra classes. */
  className?: string;
  /** Optional id for the element. */
  id?: string;
  /** Optional inline style. */
  style?: React.CSSProperties;
}

export function Reveal({
  children,
  as: Tag = 'div',
  stagger = false,
  className = '',
  id,
  style,
}: RevealProps) {
  const ref = useScrollReveal<HTMLElement>();
  const revealClass = stagger ? 'reveal-stagger' : 'reveal';
  return (
    <Tag
      ref={ref as any}
      className={`${revealClass} ${className}`}
      id={id}
      style={style}
    >
      {children}
    </Tag>
  );
}
