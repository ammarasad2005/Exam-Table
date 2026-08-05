'use client';

/**
 * FocusVisibleDebug — a QA/debug overlay that outlines all focusable elements
 * with a dashed border so QA can verify keyboard focus states are present.
 *
 * Toggle with Ctrl+Shift+F. When active:
 * - Dashed blue outline on every focusable element (button, a, input, select,
 *   textarea, [tabindex])
 * - Stats indicator (N focusable elements) in the bottom-left corner.
 *
 * Purely visual (injects a <style> tag). Dev/QA-only, gated behind NODE_ENV.
 */
import { useEffect, useState } from 'react';
import { MousePointerClick, X } from 'lucide-react';

const OVERLAY_STYLE_ID = 'focus-visible-debug-overlay';

export function FocusVisibleDebug() {
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActive((a) => !a);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const existing = document.getElementById(OVERLAY_STYLE_ID);
    if (!active) {
      existing?.remove();
      return;
    }

    const style = document.createElement('style');
    style.id = OVERLAY_STYLE_ID;

    const focusable = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    );

    const rules: string[] = [];
    let idx = 0;
    focusable.forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Skip hidden elements
      if (htmlEl.offsetParent === null && htmlEl.tagName !== 'INPUT') return;
      const cls = `fv-debug-${idx++}`;
      htmlEl.classList.add(cls);
      rules.push(`.${cls} { outline: 2px dashed var(--color-today) !important; outline-offset: 2px !important; }`);
    });

    style.textContent = rules.join('\n');
    document.head.appendChild(style);
    setCount(idx);

    return () => {
      document.getElementById(OVERLAY_STYLE_ID)?.remove();
      focusable.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.classList.forEach((c) => {
          if (c.startsWith('fv-debug-')) htmlEl.classList.remove(c);
        });
      });
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[120] flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[var(--color-bg-raised)] border border-[var(--color-border)] shadow-float"
      style={{ animation: 'page-enter 200ms ease-out both' }}
    >
      <MousePointerClick width={14} height={14} strokeWidth={2} className="text-[var(--color-today)]" />
      <span className="font-mono text-data-sm text-[var(--color-text-primary)]">
        {count} focusable elements
      </span>
      <button
        type="button"
        onClick={() => setActive(false)}
        aria-label="Close focus-visible debug"
        className="w-6 h-6 flex items-center justify-center rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
      >
        <X width={12} height={12} strokeWidth={2.25} />
      </button>
    </div>
  );
}
