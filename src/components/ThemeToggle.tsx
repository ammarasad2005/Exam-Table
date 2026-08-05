'use client';
import { useTheme } from '@/lib/theme';

/**
 * ThemeToggle — light/dark switch.
 *
 * Redesign T28: the visual toggle is 52×26px (below the 44px touch minimum).
 * We wrap it in a 44×44px hit area (<button>) so the tap target is accessible
 * while keeping the compact visual. The original CSS-styled checkbox/slider is
 * preserved (globals.css `.toggle-switch`).
 *
 * Round 8: added a small "auto" indicator dot when the theme is system-set
 * (not user-persisted). Shows whether the current theme is automatic (time-of-day)
 * or manually chosen. Hovering the wrapper reveals a tooltip.
 */
export function ThemeToggle() {
  const { theme, toggleTheme, isUserSet } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={isUserSet ? `${label} (manually set)` : `${label} (auto — set by time of day)`}
      className="relative flex items-center justify-center w-11 h-11 -mr-1 rounded-md transition-colors hover:bg-[var(--color-bg-subtle)]"
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
      {/* Auto/system indicator: small dot in the corner when theme is not user-set */}
      {!isUserSet && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-today)] opacity-70"
          title="Theme is auto-set by time of day"
        />
      )}
    </button>
  );
}
