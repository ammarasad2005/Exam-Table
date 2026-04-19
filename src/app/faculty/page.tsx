'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FacultyCard } from '@/components/FacultyCard';
import { FacultyDetail } from '@/components/FacultyDetail';
import {
  flattenFaculty,
  searchFaculty,
  DEPT_LABELS,
  DEPT_ORDER,
  DEPT_ACCENT,
  type FacultyMember,
  type DeptFileKey,
} from '@/lib/faculty';

// eslint-disable-next-line
const rawFacultyData: Record<string, FacultyMember[]> = require('../../../../public/data/faculty/faculty_data.json');

const ALL_MEMBERS = flattenFaculty(rawFacultyData);

type ActiveDept = 'ALL' | DeptFileKey;

export default function FacultyPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeDept, setActiveDept] = useState<ActiveDept>('ALL');
  const [selected, setSelected] = useState<(FacultyMember & { deptKey: DeptFileKey }) | null>(null);

  const filtered = useMemo(() => {
    let list = activeDept === 'ALL'
      ? ALL_MEMBERS
      : ALL_MEMBERS.filter(m => m.deptKey === activeDept);
    return searchFaculty(list, query);
  }, [query, activeDept]);

  // Stats
  const totalByDept = useMemo(() => {
    const map: Record<string, number> = {};
    ALL_MEMBERS.forEach(m => {
      map[m.deptKey] = (map[m.deptKey] ?? 0) + 1;
    });
    return map;
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg)]">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur-sm border-b border-[var(--color-border)] h-14 flex items-center px-4 gap-3"
        style={{ boxShadow: 'var(--shadow-header)' }}
      >
        <button
          onClick={() => router.push('/')}
          aria-label="Back to home"
          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          {/* People icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-tertiary)] shrink-0">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="font-mono text-sm font-medium text-[var(--color-text-primary)] truncate">
            Faculty Directory
          </span>
          <span className="font-mono text-xs text-[var(--color-text-tertiary)] shrink-0">
            {ALL_MEMBERS.length} faculty
          </span>
        </div>

        <ThemeToggle />
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden md:flex md:w-56 lg:w-64 flex-col gap-5 p-6 border-r border-[var(--color-border)] sticky top-14 h-[calc(100dvh-56px)] overflow-y-auto">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
              Departments
            </p>
            <div className="flex flex-col gap-1">
              {/* All */}
              <button
                onClick={() => setActiveDept('ALL')}
                className="flex items-center justify-between h-9 px-3 rounded-lg text-left transition-colors w-full"
                style={activeDept === 'ALL' ? {
                  backgroundColor: 'var(--color-text-primary)',
                  color: 'var(--color-bg)',
                } : {
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span className="font-mono text-xs font-medium">All Faculty</span>
                <span className="font-mono text-[10px] opacity-70">{ALL_MEMBERS.length}</span>
              </button>

              {DEPT_ORDER.map(key => {
                const accent = DEPT_ACCENT[key];
                const isActive = activeDept === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveDept(key)}
                    className="flex items-center justify-between h-9 px-3 rounded-lg text-left transition-colors w-full"
                    style={isActive ? {
                      backgroundColor: `var(--accent-${accent}-bg)`,
                      color: `var(--accent-${accent})`,
                    } : {
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span className="font-mono text-xs font-medium truncate">{key}</span>
                    <span className="font-mono text-[10px] opacity-70">{totalByDept[key] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[var(--color-border)]" />

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Total</p>
            <p className="font-mono text-2xl font-medium">{ALL_MEMBERS.length}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">faculty members</p>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="flex-1 px-4 md:px-8 py-6 max-w-[1200px] mx-auto w-full">

          {/* Search Bar */}
          <div className="relative mb-5">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, title, email, office…"
              className="w-full h-12 pl-11 pr-4 bg-[var(--color-bg-raised)] border border-[var(--color-border-strong)] rounded-xl font-body text-sm placeholder:text-[var(--color-text-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
              style={{ boxShadow: 'var(--shadow-card)' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>

          {/* Mobile dept filter strip */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none -mx-4 px-4">
            <button
              onClick={() => setActiveDept('ALL')}
              className="shrink-0 h-8 px-4 rounded-full font-mono text-[11px] font-bold border transition-all"
              style={activeDept === 'ALL' ? {
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-bg)',
                borderColor: 'var(--color-text-primary)',
              } : {
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-secondary)',
              }}
            >
              All
            </button>
            {DEPT_ORDER.map(key => {
              const accent = DEPT_ACCENT[key];
              const isActive = activeDept === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveDept(key)}
                  className="shrink-0 h-8 px-4 rounded-full font-mono text-[11px] font-bold border transition-all"
                  style={isActive ? {
                    backgroundColor: `var(--accent-${accent}-bg)`,
                    color: `var(--accent-${accent})`,
                    borderColor: `var(--accent-${accent})`,
                  } : {
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {/* Results header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              {activeDept !== 'ALL' ? ` · ${activeDept}` : ''}
              {query ? ` · "${query}"` : ''}
            </span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          {/* Faculty grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="font-mono text-4xl text-[var(--color-text-tertiary)] mb-4">∅</div>
              <p className="font-body text-sm text-[var(--color-text-secondary)] max-w-xs">
                No faculty found matching your search. Try a different name, title, or office number.
              </p>
              <button
                onClick={() => { setQuery(''); setActiveDept('ALL'); }}
                className="mt-4 font-mono text-xs text-[var(--color-text-tertiary)] underline hover:text-[var(--color-text-primary)] transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((member, i) => (
                <FacultyCard
                  key={`${member.deptKey}-${i}`}
                  member={member}
                  onClick={() => setSelected(member)}
                />
              ))}
            </div>
          )}

          {/* Bottom padding for mobile navbar */}
          <div className="h-20 md:h-8" />
        </div>
      </div>

      {/* ── Detail Sheet ────────────────────────────────────────────────────── */}
      {selected && (
        <FacultyDetail
          member={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
