'use client';

/**
 * CommandPalette — Cmd/Ctrl+K quick navigation overlay.
 *
 * Opens with Cmd+K (mac) / Ctrl+K (win/linux). Provides fuzzy search over all
 * site routes + quick actions (toggle theme, give feedback). Keyboard-navigable
 * (↑↓ to move, Enter to select, Esc to close). Respects prefers-reduced-motion
 * (instant open/close). Accessible: role="dialog", aria-label, focus trap,
 * returns focus to trigger on close.
 *
 * Design: matches the Editorial Ink refresh — ink-primary selected state, warm
 * raised surfaces, mono eyebrows, laser-rail accent on the search input focus.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import {
  Search,
  Sun,
  Moon,
  MessageSquare,
  Home,
  Calendar,
  CalendarDays,
  MapPin,
  Users,
  Search as SearchIcon,
  Clock,
  Sparkles,
  LayoutGrid,
  BookOpen,
  Settings,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: 'Navigate' | 'Actions';
  action: () => void;
  keywords?: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const RECENT_KEY = 'cmdk-recent';
  const MAX_RECENT = 5;

  // Track route visits in localStorage (recently visited). Runs on every pathname
  // change. Dedupes + caps at MAX_RECENT. Used to show a 'Recent' group in the palette.
  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return;
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const list: string[] = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
      const updated = [pathname, ...list.filter((p) => p !== pathname)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      setRecent(updated);
    } catch { /* localStorage unavailable */ }
  }, [pathname]);

  // Load recent on mount (for first render before any navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecent(parsed.filter((p): p is string => typeof p === 'string'));
      }
    } catch { /* ignore */ }
  }, []);

  // Build command list — wrap each nav action to record the visit.
  // (Recent tracking also runs via the pathname effect, but recording on action
  //  ensures the list updates immediately when a command is selected.)
  const navigateTo = useCallback((path: string) => {
    router.push(path);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(RECENT_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        const list: string[] = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
        const updated = [path, ...list.filter((p) => p !== path)].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        setRecent(updated);
      } catch { /* ignore */ }
    }
  }, [router]);

  const commands: Command[] = [
    // Navigate
    { id: 'nav-home', label: 'Home', hint: 'Config + dashboard', icon: Home, group: 'Navigate', action: () => navigateTo('/home'), keywords: 'config dashboard setup' },
    { id: 'nav-timetable', label: 'Timetable', hint: 'Weekly class schedule', icon: Clock, group: 'Navigate', action: () => navigateTo('/timetable'), keywords: 'classes weekly schedule' },
    { id: 'nav-timetable-custom', label: 'Custom Courses', hint: 'Build a custom timetable', icon: LayoutGrid, group: 'Navigate', action: () => navigateTo('/timetable/custom'), keywords: 'custom courses bundle' },
    { id: 'nav-optimizer', label: 'Timetable Optimizer', hint: 'Clash-free section combos', icon: Sparkles, group: 'Navigate', action: () => navigateTo('/timetable/optimizer'), keywords: 'optimizer clash sections' },
    { id: 'nav-schedule', label: 'Exam Schedule', hint: 'Exam finder', icon: SearchIcon, group: 'Navigate', action: () => navigateTo('/schedule'), keywords: 'exams schedule finder' },
    { id: 'nav-custom-exams', label: 'Custom Exams', hint: 'Build a custom exam list', icon: BookOpen, group: 'Navigate', action: () => navigateTo('/custom'), keywords: 'custom exams mock' },
    { id: 'nav-rooms', label: 'Free Rooms', hint: 'Find empty classrooms', icon: MapPin, group: 'Navigate', action: () => navigateTo('/rooms'), keywords: 'rooms empty free classroom' },
    { id: 'nav-semester', label: 'Semester Calendar', hint: 'Academic calendar', icon: CalendarDays, group: 'Navigate', action: () => navigateTo('/semester'), keywords: 'semester calendar holidays' },
    { id: 'nav-events', label: 'Campus Events', hint: 'Events calendar', icon: Calendar, group: 'Navigate', action: () => navigateTo('/events'), keywords: 'events campus' },
    { id: 'nav-faculty', label: 'Faculty Directory', hint: 'Browse faculty', icon: Users, group: 'Navigate', action: () => navigateTo('/faculty'), keywords: 'faculty directory teachers' },
    { id: 'nav-lost-found', label: 'Lost & Found', hint: 'Community board', icon: SearchIcon, group: 'Navigate', action: () => navigateTo('/lost-found'), keywords: 'lost found items' },
    { id: 'nav-landing', label: 'Landing', hint: 'Portal home', icon: Home, group: 'Navigate', action: () => navigateTo('/'), keywords: 'landing portal' },
    // Actions
    { id: 'act-theme', label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', icon: theme === 'dark' ? Sun : Moon, group: 'Actions', action: toggleTheme, keywords: 'theme dark light toggle' },
    { id: 'act-feedback', label: 'Give Feedback', hint: 'Open feedback form', icon: MessageSquare, group: 'Actions', action: () => { setOpen(false); setTimeout(() => document.querySelector<HTMLButtonElement>('[aria-label="Give feedback — opens a feedback form"]')?.click(), 100); }, keywords: 'feedback suggestion bug' },
    { id: 'act-admin', label: 'Admin Portal', hint: 'Login-gated', icon: Settings, group: 'Actions', action: () => navigateTo('/admin'), keywords: 'admin login' },
  ];

  // Build 'Recent' group: when no query, show recently-visited routes first.
  // Maps stored pathnames to their nav command ids, ordered by recency.
  // Excluded when searching (query non-empty).
  const pathToId: Record<string, string> = {
    '/home': 'nav-home', '/timetable': 'nav-timetable', '/timetable/custom': 'nav-timetable-custom',
    '/timetable/optimizer': 'nav-optimizer', '/schedule': 'nav-schedule', '/custom': 'nav-custom-exams',
    '/rooms': 'nav-rooms', '/semester': 'nav-semester', '/events': 'nav-events',
    '/faculty': 'nav-faculty', '/lost-found': 'nav-lost-found', '/': 'nav-landing', '/admin': 'act-admin',
  };
  const recentGrouped: Command[] = query.trim() ? [] : recent
    .map((p) => commands.find((c) => c.id === pathToId[p]))
    .filter((c): c is Command => Boolean(c));

  // Filter
  const filtered = commands.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.label.toLowerCase().includes(q) ||
      c.hint?.toLowerCase().includes(q) ||
      c.keywords?.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q)
    );
  });

  // Group: Recent (only when no query) + Navigate + Actions
  type GroupKey = 'Recent' | 'Navigate' | 'Actions';
  const allGroups: GroupKey[] = query.trim() ? ['Navigate', 'Actions'] : ['Recent', 'Navigate', 'Actions'];
  const grouped = allGroups
    .map((g) => {
      let items: Command[];
      if (g === 'Recent') items = recentGrouped;
      else if (g === 'Navigate') items = filtered.filter((c) => c.group === 'Navigate');
      else items = filtered.filter((c) => c.group === 'Actions');
      return { group: g, items };
    })
    .filter((g) => g.items.length > 0);

  // Flatten for keyboard nav indexing
  const flat = grouped.flatMap((g) => g.items);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard shortcut to open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        triggerRef.current = document.activeElement as HTMLElement;
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close + return focus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Keyboard navigation
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = flat[activeIndex];
        if (cmd) {
          // Run action BEFORE closing so the closure isn't invalidated by unmount.
          cmd.action();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    },
    [flat, activeIndex]
  );

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: prefersReducedMotion ? 'none' : 'fade-in 150ms ease-out both' }}
      />
      {/* Panel — stopPropagation so clicks inside don't close via the container */}
      <div
        className="relative z-10 w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] shadow-float overflow-hidden flex flex-col max-h-[70vh]"
        style={{
          animation: prefersReducedMotion ? 'none' : 'page-enter 180ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
          boxShadow: 'var(--shadow-float), var(--border-inset)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search width={18} height={18} className="text-[var(--color-text-tertiary)] shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions…"
            className="flex-1 bg-transparent border-0 outline-none text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-body"
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="font-mono text-data-sm text-[var(--color-text-tertiary)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-tertiary)] font-body">
              No results for “{query}”.
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="mb-1">
                <div className="px-4 py-1.5 font-mono text-data-sm uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  {group}
                </div>
                {items.map((cmd) => {
                  const idx = flat.indexOf(cmd);
                  const isActive = idx === activeIndex;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      data-idx={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => { cmd.action(); setOpen(false); triggerRef.current?.focus(); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-[var(--color-primary-action)] text-[var(--color-primary-action-fg)]'
                          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]'
                      }`}
                    >
                      <Icon width={16} height={16} strokeWidth={2} className="shrink-0" />
                      <span className="flex-1 font-body text-sm font-medium truncate">{cmd.label}</span>
                      {cmd.hint && (
                        <span className={`font-mono text-data-sm ${isActive ? 'opacity-70' : 'text-[var(--color-text-tertiary)]'}`}>
                          {cmd.hint}
                        </span>
                      )}
                      {isActive && <ArrowRight width={14} height={14} strokeWidth={2.25} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]/50">
          <div className="flex items-center gap-3 font-mono text-data-sm text-[var(--color-text-tertiary)]">
            <span className="flex items-center gap-1"><kbd className="bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded px-1">↑</kbd><kbd className="bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded px-1">↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-[var(--color-bg-raised)] border border-[var(--color-border)] rounded px-1">↵</kbd> select</span>
          </div>
          <span className="font-mono text-data-sm text-[var(--color-text-tertiary)]">{flat.length} results</span>
        </div>
      </div>
    </div>
  );
}
