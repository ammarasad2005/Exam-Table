'use client';

/**
 * SkipLinks — accessibility skip links that appear on keyboard focus.
 *
 * Renders two links at the top of the page (visible only when focused via Tab):
 * - "Skip to content" → focuses #main-content
 * - "Skip to search (⌘K)" → opens the Command Palette
 *
 * The command-palette link dispatches a synthetic Cmd+K keydown event, which
 * the CommandPalette component listens for. This gives keyboard-only users a
 * way to reach the palette without memorizing the shortcut.
 *
 * Styling: uses the existing .skip-to-content CSS class (globals.css) for both
 * links, so they share the same focus-revealed appearance.
 */
import { useEffect, useState } from 'react';

export function SkipLinks() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const openPalette = (e: React.MouseEvent) => {
    e.preventDefault();
    // Dispatch the same shortcut the CommandPalette listens for
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        ctrlKey: !navigator.platform.includes('Mac'),
        bubbles: true,
      })
    );
  };

  if (!mounted) {
    return <a href="#main-content" className="skip-to-content">Skip to content</a>;
  }

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <a
        href="#"
        onClick={openPalette}
        className="skip-to-content"
        style={{ left: '200px' }}
      >
        Skip to search (⌘K)
      </a>
    </>
  );
}
