'use client';
import { useTheme } from '@/lib/theme';

/**
 * ThemeToggle — light/dark switch.
 *
 * Redesign T28: the visual toggle is 52×26px (below the 44px touch minimum).
 * We wrap it in a 44×44px hit area (<button>) so the tap target is accessible
 * while keeping the compact visual. The original CSS-styled checkbox/slider is
 * preserved (globals.css `.toggle-switch`).
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex items-center justify-center w-11 h-11 -mr-1 rounded-md transition-colors hover:bg-[var(--color-bg-subtle)]"
    >
      <div className="toggle-switch">
        <label className="switch-label" title={label}>
          <input
            type="checkbox"
            className="checkbox"
            checked={!isDark}
            onChange={toggleTheme}
            aria-label={label}
          />
          <span className="slider"></span>
        </label>
      </div>
    </button>
  );
}
