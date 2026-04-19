'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// ── Icons ──────────────────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 21 9 12 15 12 15 21" />
    </svg>
  );
}

function RoomsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function FacultyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a7 7 0 0 1 13 0" />
    </svg>
  );
}

function CustomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { name: 'Home',    path: '/',                 icon: <HomeIcon />,    label: 'Go to Home'    },
  { name: 'Rooms',   path: '/rooms',             icon: <RoomsIcon />,   label: 'View Rooms'    },
  { name: 'Faculty', path: '/faculty',           icon: <FacultyIcon />, label: 'View Faculty'  },
  { name: 'Custom',  path: '/timetable/custom',  icon: <CustomIcon />,  label: 'Custom Search' },
];

// Spread items across a 90° arc, opening upward-left from the button.
// 0° = left, 90° = up.
const ARC_START_DEG = 0;
const ARC_SPAN_DEG  = 90;
const RADIUS        = 125; // increased to prevent overlap and elevate from button

function getPosition(index: number, total: number) {
  const step  = total > 1 ? ARC_SPAN_DEG / (total - 1) : 0;
  const angle = ARC_START_DEG + index * step;
  const rad   = (angle * Math.PI) / 180;
  return {
    x: -Math.cos(rad) * RADIUS,  // negative = moves left
    y: -Math.sin(rad) * RADIUS,  // negative = moves up
  };
}

// ── Main Component ─────────────────────────────────────────────────────────
export function FloatingMenu() {
  const [open, setOpen]     = useState(false);
  const pathname            = usePathname();
  const router              = useRouter();
  const containerRef        = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [close]);

  function handleNavigate(path: string) {
    close();
    router.push(path);
  }

  return (
    /* Only render on mobile — hidden on md+ */
    <div
      ref={containerRef}
      className="md:hidden fixed bottom-6 right-5 z-50"
      aria-label="Navigation menu"
    >
      {/* ── Backdrop blur overlay ──────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-300"
        style={{
          backdropFilter: open ? 'blur(2px)' : 'none',
          WebkitBackdropFilter: open ? 'blur(2px)' : 'none',
          opacity: open ? 1 : 0,
          background: open ? 'rgba(0,0,0,0.12)' : 'transparent',
          zIndex: -1,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={close}
      />

      {/* ── Arc menu items ─────────────────────────────────────────────────── */}
      {MENU_ITEMS.map((item, i) => {
        const { x, y } = getPosition(i, MENU_ITEMS.length);
        const isActive  = pathname === item.path;
        const delay     = open ? i * 45 : (MENU_ITEMS.length - 1 - i) * 30;

        return (
          <button
            key={item.path}
            aria-label={item.label}
            onClick={() => handleNavigate(item.path)}
            className="absolute bottom-0 right-0 flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: isActive ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border)',
              background: isActive
                ? 'var(--color-text-primary)'
                : 'var(--color-bg-raised)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: 'var(--shadow-float)',
              color: isActive ? 'var(--color-bg)' : 'var(--color-text-secondary)',
              transform: open
                ? `translate(${x}px, ${y}px) scale(1)`
                : 'translate(0,0) scale(0.4)',
              opacity: open ? 1 : 0,
              transition: `transform 380ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms,
                           opacity  240ms ease ${delay}ms`,
              pointerEvents: open ? 'auto' : 'none',
              zIndex: 51,
            }}
          >
            {item.icon}
            <span
              style={{
                fontSize: 8,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1,
                marginTop: -2,
              }}
            >
              {item.name}
            </span>
          </button>
        );
      })}

      {/* ── Trigger Button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        className="relative z-[52] flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{
          width: 52,
          height: 52,
          background: open
            ? 'var(--color-bg-subtle)'
            : 'color-mix(in srgb, var(--color-text-primary) 70%, transparent)',
          border: open ? '1px solid var(--color-border)' : '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)',
          backdropFilter: open ? 'none' : 'blur(16px)',
          WebkitBackdropFilter: open ? 'none' : 'blur(16px)',
          boxShadow: 'var(--shadow-float)',
          transition: 'box-shadow 200ms ease, background 200ms ease, color 200ms ease',
        }}
      >
        {/* Animated hamburger → X */}
        <span
          aria-hidden="true"
          style={{
            display: 'grid',
            placeItems: 'center',
            color: open ? 'var(--color-text-primary)' : 'var(--color-bg)',
            transition: 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          {open ? (
            /* X icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* Grid / dots icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5"  cy="5"  r="2" />
              <circle cx="12" cy="5"  r="2" />
              <circle cx="19" cy="5"  r="2" />
              <circle cx="5"  cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
              <circle cx="5"  cy="19" r="2" />
              <circle cx="12" cy="19" r="2" />
              <circle cx="19" cy="19" r="2" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}
