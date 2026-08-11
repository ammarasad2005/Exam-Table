'use client';

/**
 * OnboardingTour — a one-time guided tour of the redesign's key features.
 *
 * Shows on first visit (when localStorage 'tour-seen' is not set). Walks the
 * user through 4 steps with callout tooltips pointing to the relevant UI:
 *   1. Command Palette (Cmd+K) — quick search
 *   2. Keyboard Shortcuts (?) — discover all shortcuts
 *   3. Dark mode toggle — theme switching
 *   4. Vim navigation (g + letter) — power-user jumps
 *
 * Each step is a centered modal (not a pointer-callout, to keep it simple and
 * robust against layout changes). Progress dots, Skip + Next/Finish buttons.
 * Respects prefers-reduced-motion. Persists 'seen' state in localStorage.
 *
 * Design: matches the Editorial Ink refresh — warm raised surface, ink-primary
 * buttons, mono eyebrows, laser-rail-adjacent accents.
 */
import { useEffect, useState, useRef } from 'react';
import { Sparkles, Keyboard, Moon, Compass, X, ArrowRight, Check } from 'lucide-react';

const TOUR_KEY = 'onboarding-tour-seen';
const TOTAL_STEPS = 4;

type Step = {
  icon: typeof Sparkles;
  title: string;
  body: string;
  hint: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Command Palette',
    body: 'Press ⌘K (or Ctrl+K) anytime to open the command palette. Search any page or action — timetables, exams, rooms, faculty — and jump there instantly.',
    hint: 'Try it: press ⌘K now',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    body: 'Press ? to see all keyboard shortcuts at any time. Includes navigation, the command palette, and power-user vim-style jumps.',
    hint: 'Try it: press ? anytime',
  },
  {
    icon: Moon,
    title: 'Dark Mode',
    body: 'Toggle dark/light mode with the switch in the top-right. A small blue dot appears when the theme is auto-set by time of day.',
    hint: 'Look for the toggle in the header',
  },
  {
    icon: Compass,
    title: 'Vim-Style Navigation',
    body: 'Power users: press g then a letter to jump to a page — g t for timetable, g f for faculty, g r for rooms, and more. See all with ?.',
    hint: '11 destinations available',
  },
];

export function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = localStorage.getItem(TOUR_KEY);
      if (!seen) {
        // Small delay so it doesn't fight with page load animations
        const t = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(t);
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* ignore */ }
    triggerRef.current?.focus();
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOTAL_STEPS - 1;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding tour — step ${step + 1}: ${current.title}`}
      onClick={dismiss}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: prefersReducedMotion ? 'none' : 'fade-in 150ms ease-out both' }}
      />
      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] shadow-float overflow-hidden"
        style={{
          animation: prefersReducedMotion ? 'none' : 'page-enter 220ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
          boxShadow: 'var(--shadow-float), var(--border-inset)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with step indicator */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-data-sm uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Welcome · Step {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Skip tour"
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            <X width={14} height={14} strokeWidth={2.25} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--color-primary-action)] text-[var(--color-primary-action-fg)]">
              <Icon width={22} height={22} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl leading-tight text-[var(--color-text-primary)] mb-2">
                {current.title}
              </h2>
              <p className="font-body text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {current.body}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
            <Sparkles width={12} height={12} strokeWidth={2} className="text-[var(--color-today)] shrink-0" />
            <span className="font-mono text-data-sm text-[var(--color-text-secondary)]">{current.hint}</span>
          </div>
        </div>

        {/* Progress dots + actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === step
                    ? 'w-6 bg-[var(--color-primary-action)]'
                    : i < step
                      ? 'w-1.5 bg-[var(--color-primary-action)] opacity-50'
                      : 'w-1.5 bg-[var(--color-border-strong)]'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="h-9 px-3 rounded-md font-body text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={next}
              className="btn-ink inline-flex items-center gap-1.5 h-9 px-4 rounded-md font-body text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {isLast ? (
                <>
                  <Check width={14} height={14} strokeWidth={2.25} />
                  <span>Got it</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight width={14} height={14} strokeWidth={2.25} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
