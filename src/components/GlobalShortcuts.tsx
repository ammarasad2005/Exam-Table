'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * GlobalShortcuts — site-wide keyboard shortcuts.
 *
 * Shortcuts:
 * - Ctrl+Shift+A → admin portal
 * - Ctrl+Shift+Z → go back
 * - g then letter → vim-style navigation (power-user feature):
 *   g h → /home, g t → /timetable, g s → /schedule, g r → /rooms,
 *   g f → /faculty, g e → /events, g m → /semester (calendar),
 *   g l → /lost-found, g o → /timetable/optimizer, g c → /timetable/custom,
 *   g x → /custom, g / → / (landing)
 *
 * The 'g' prefix waits 1.5s for the next key; if no valid follow-up key
 * arrives, it cancels silently. Ignores keys when typing in form fields.
 */
const GOTO_MAP: Record<string, string> = {
  h: '/home',
  t: '/timetable',
  s: '/schedule',
  r: '/rooms',
  f: '/faculty',
  e: '/events',
  m: '/semester',
  l: '/lost-found',
  o: '/timetable/optimizer',
  c: '/timetable/custom',
  x: '/custom',
  '/': '/',
};

export function GlobalShortcuts() {
  const router = useRouter()
  const [gPressed, setGPressed] = useState(false)

  useEffect(() => {
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const isTyping = (el: HTMLElement | null) => {
      if (!el) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable ||
        el.getAttribute('role') === 'textbox' ||
        el.getAttribute('role') === 'combobox'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A → admin
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        router.push('/admin')
        return
      }
      // Ctrl+Shift+Z → back
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        router.back()
        return
      }

      // Vim-style 'g' prefix navigation — only when not typing and no modifiers
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (isTyping(target) || isTyping(document.activeElement as HTMLElement)) return;

      if (!gPressed && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setGPressed(true);
        // Auto-cancel after 1.5s if no follow-up key
        gTimer = setTimeout(() => setGPressed(false), 1500);
        return;
      }

      if (gPressed) {
        const key = e.key.toLowerCase();
        if (gTimer) clearTimeout(gTimer);
        setGPressed(false);
        const dest = GOTO_MAP[key];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        // If invalid follow-up key, just cancel silently
      }
    };

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimer) clearTimeout(gTimer);
    }
  }, [router, gPressed])

  return null
}
