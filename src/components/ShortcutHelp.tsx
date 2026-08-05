'use client';

/**
 * ShortcutHelp — a keyboard-shortcut help overlay triggered by the `?` key.
 *
 * Shows all available keyboard shortcuts across the app:
 * - Cmd/Ctrl+K → Command Palette
 * - ? → This help overlay
 * - Ctrl+Shift+A → Admin portal
 * - Ctrl+Shift+Z → Go back
 * - Esc → Close overlays / go back
 *
 * Accessible: role="dialog", aria-modal, focus management. Respects
 * prefers-reduced-motion. Closes on Esc or backdrop click.
 *
 * Design: matches the Editorial Ink refresh — warm raised surface, mono
 * eyebrows, ink-primary accents, laser-rail-adjacent kbd styling.
 */
import { useEffect, useState, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';

type Shortcut = {
  keys: string[];
  description: string;
  group: 'Navigation' | 'Actions' | 'Power User';
};

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Open command palette (quick search)', group: 'Navigation' },
  { keys: ['Ctrl', 'Shift', 'A'], description: 'Go to admin portal', group: 'Navigation' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Go back', group: 'Navigation' },
  { keys: ['Esc'], description: 'Close overlay / go back', group: 'Navigation' },
  // Actions
  { keys: ['?'], description: 'Show this help overlay', group: 'Actions' },
  { keys: ['↑', '↓'], description: 'Navigate command palette results', group: 'Actions' },
  { keys: ['↵'], description: 'Select command palette result', group: 'Actions' },
  // Power User (vim-style)
  { keys: ['g', 'h'], description: 'Go to Home', group: 'Power User' },
  { keys: ['g', 't'], description: 'Go to Timetable', group: 'Power User' },
  { keys: ['g', 's'], description: 'Go to Exam Schedule', group: 'Power User' },
  { keys: ['g', 'r'], description: 'Go to Free Rooms', group: 'Power User' },
  { keys: ['g', 'f'], description: 'Go to Faculty Directory', group: 'Power User' },
  { keys: ['g', 'e'], description: 'Go to Campus Events', group: 'Power User' },
  { keys: ['g', 'm'], description: 'Go to Semester Calendar', group: 'Power User' },
  { keys: ['g', 'l'], description: 'Go to Lost & Found', group: 'Power User' },
  { keys: ['g', 'o'], description: 'Go to Timetable Optimizer', group: 'Power User' },
  { keys: ['g', 'c'], description: 'Go to Custom Courses', group: 'Power User' },
  { keys: ['g', 'x'], description: 'Go to Custom Exams', group: 'Power User' },
];

export function ShortcutHelp() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Dedupe (Cmd+K appears once)
  const seen = new Set<string>();
  const deduped = SHORTCUTS.filter((s) => {
    const key = s.keys.join('+') + '|' + s.description;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Open on `?` (Shift+/) — only when not typing in an input/textarea/select
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox' ||
        target.getAttribute('role') === 'combobox' ||
        // Also check if the active element is a form control (covers shadow DOM)
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT';

      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isTyping) {
        e.preventDefault();
        triggerRef.current = document.activeElement as HTMLElement;
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Esc to close + return focus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const groups = ['Navigation', 'Actions', 'Power User'] as const;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts help"
      onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: prefersReducedMotion ? 'none' : 'fade-in 150ms ease-out both' }}
      />
      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] shadow-float overflow-hidden flex flex-col max-h-[80vh]"
        style={{
          animation: prefersReducedMotion ? 'none' : 'page-enter 180ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
          boxShadow: 'var(--shadow-float), var(--border-inset)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-secondary)]">
              <Keyboard width={16} height={16} strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-body text-base font-semibold text-[var(--color-text-primary)]">Keyboard Shortcuts</h2>
              <p className="font-mono text-data-sm text-[var(--color-text-tertiary)]">Press ? anytime to open this</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
            aria-label="Close shortcuts help"
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            <X width={16} height={16} strokeWidth={2} />
          </button>
        </div>
        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {groups.map((group) => {
            const items = deduped.filter((s) => s.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-2">
                <div className="px-5 py-1.5 font-mono text-data-sm uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  {group}
                </div>
                {items.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  >
                    <span className="font-body text-sm text-[var(--color-text-primary)]">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="font-mono text-data-sm font-medium min-w-[24px] h-7 px-1.5 flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50">
          <p className="font-mono text-data-sm text-[var(--color-text-tertiary)] text-center">
            Shortcuts work site-wide · Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}
