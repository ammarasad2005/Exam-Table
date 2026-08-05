'use client';

/**
 * ContrastChecker — a QA/debug overlay that highlights text elements with a
 * colored outline indicating their WCAG contrast ratio against their background.
 *
 * Toggle with Ctrl+Shift+C (or the button in the dev tools). When active:
 * - Green outline: passes AA (≥4.5:1 for normal text, ≥3:1 for large)
 * - Amber outline: passes AA-large only (≥3:1 but <4.5:1)
 * - Red outline: fails AA (<3:1)
 *
 * The overlay is purely visual — it adds outlines via a <style> tag. It does
 * NOT modify the DOM. Respects prefers-reduced-motion (instant toggle).
 *
 * This is a dev/QA tool, not a user-facing feature. It's intentionally lightweight
 * and can be removed before production without affecting anything.
 */
import { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';

const OVERLAY_STYLE_ID = 'contrast-checker-overlay';

function srgbToLin(c: number) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLum([r, g, b]: number[]) {
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}
function contrastRatio(rgb1: number[], rgb2: number[]) {
  const L1 = relLum(rgb1), L2 = relLum(rgb2);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function parseColor(color: string): number[] | null {
  const rgb = color.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const parts = rgb[1].split(',').map((s) => parseFloat(s.trim()));
    return [parts[0], parts[1], parts[2]];
  }
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16)];
  }
  return null;
}

export function ContrastChecker() {
  const [active, setActive] = useState(false);
  const [stats, setStats] = useState({ pass: 0, large: 0, fail: 0, total: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
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

    // Scan text elements and inject outline styles
    const style = document.createElement('style');
    style.id = OVERLAY_STYLE_ID;
    const rules: string[] = [];

    const textElements = document.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th, div, input, textarea, select, kbd, code, small, strong, em'
    );

    let passCount = 0, largeCount = 0, failCount = 0;
    let idx = 0;

    textElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Only check elements with direct text content (not containers only)
      const hasText = htmlEl.childNodes.length > 0 &&
        Array.from(htmlEl.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim());
      if (!hasText) return;

      const cs = getComputedStyle(htmlEl);
      const fg = parseColor(cs.color);
      if (!fg) return;

      // Walk up to find a non-transparent background
      let bg: number[] | null = null;
      let parent: HTMLElement | null = htmlEl;
      while (parent && !bg) {
        const pcs = getComputedStyle(parent);
        const bgc = pcs.backgroundColor;
        if (bgc && bgc !== 'rgba(0, 0, 0, 0)' && bgc !== 'transparent') {
          bg = parseColor(bgc);
        }
        parent = parent.parentElement;
      }
      if (!bg) bg = [250, 250, 248]; // default to page bg

      const ratio = contrastRatio(fg, bg);
      const fontSize = parseFloat(cs.fontSize);
      const fontWeight = parseInt(cs.fontWeight) || 400;
      const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

      let color: string;
      if (ratio >= 4.5) { color = '#16a34a'; passCount++; } // green
      else if (ratio >= 3 && (isLarge || ratio >= 3)) { color = '#d97706'; largeCount++; } // amber
      else { color = '#dc2626'; failCount++; } // red

      const cls = `cc-check-${idx++}`;
      htmlEl.classList.add(cls);
      rules.push(`.${cls} { outline: 2px solid ${color} !important; outline-offset: 1px !important; }`);
    });

    style.textContent = rules.join('\n');
    document.head.appendChild(style);

    // Update stats state for the indicator
    setStats({ pass: passCount, large: largeCount, fail: failCount, total: passCount + largeCount + failCount });

    return () => {
      document.getElementById(OVERLAY_STYLE_ID)?.remove();
      textElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.classList.forEach((c) => {
          if (c.startsWith('cc-check-')) htmlEl.classList.remove(c);
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
      <Eye width={14} height={14} strokeWidth={2} className="text-[var(--color-text-secondary)]" />
      <div className="flex items-center gap-3 font-mono text-data-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#16a34a' }} />
          <span className="text-[var(--color-text-primary)]">{stats.pass} pass</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#d97706' }} />
          <span className="text-[var(--color-text-primary)]">{stats.large} large</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#dc2626' }} />
          <span className="text-[var(--color-text-primary)]">{stats.fail} fail</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setActive(false)}
        aria-label="Close contrast checker"
        className="w-6 h-6 flex items-center justify-center rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
      >
        <X width={12} height={12} strokeWidth={2.25} />
      </button>
    </div>
  );
}
