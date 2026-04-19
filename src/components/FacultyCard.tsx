'use client';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { FacultyMember, DeptFileKey } from '@/lib/faculty';
import { DEPT_LABELS, DEPT_ACCENT, getFacultyRank } from '@/lib/faculty';

interface Props {
  member: FacultyMember & { deptKey: DeptFileKey };
  priority?: boolean;   // true → eager load (above fold); false → lazy
  onClick: () => void;
}

export function FacultyCard({ member, priority = false, onClick }: Props) {
  const accent = DEPT_ACCENT[member.deptKey];
  const accentColor = `var(--accent-${accent})`;
  const accentBg = `var(--accent-${accent}-bg)`;
  const [imgError, setImgError] = useState(false);

  // Extract initials for photo fallback
  const initials = member.name
    .replace(/^(Dr\.|Mr\.|Ms\.|Prof\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  const isLeadership = getFacultyRank(member.status) <= 2;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-[var(--color-bg-raised)] border rounded-xl overflow-hidden flex flex-col transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98] group`}
      style={{ 
        boxShadow: isLeadership ? `0 0 0 1px ${accentColor}, var(--shadow-card), var(--border-inset)` : 'var(--shadow-card), var(--border-inset)',
        borderColor: isLeadership ? accentColor : 'var(--color-border)'
      }}
      onMouseOver={e => (e.currentTarget.style.boxShadow = isLeadership ? `0 0 0 1px ${accentColor}, var(--shadow-raised), var(--border-inset)` : 'var(--shadow-raised), var(--border-inset)')}
      onMouseOut={e => (e.currentTarget.style.boxShadow = isLeadership ? `0 0 0 1px ${accentColor}, var(--shadow-card), var(--border-inset)` : 'var(--shadow-card), var(--border-inset)')}
    >
      {/* Photo area */}
      <div className="relative w-full aspect-[4/3] bg-[var(--color-bg-subtle)] overflow-hidden">
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.image_url}
            alt={member.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-display text-4xl font-bold"
            style={{ backgroundColor: accentBg, color: accentColor }}
          >
            {initials}
          </div>
        )}

        {/* Dept badge — floated top-right */}
        <div className="absolute top-3 right-3">
          <span
            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm"
            style={{ backgroundColor: accentBg, color: accentColor }}
          >
            {member.deptKey}
          </span>
        </div>

        {/* LinkedIn badge — top-left, only if available */}
        {member.linkedin_profile && (
          <div className="absolute top-3 left-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-md bg-[#0A66C2] text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Name */}
        <h3 className="font-display text-lg leading-tight text-[var(--color-text-primary)] line-clamp-2 flex items-start gap-1.5">
          <span className="line-clamp-2">{member.name}</span>
          {isLeadership && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 translate-y-[2px]" style={{ color: accentColor }} aria-label="Head of Department">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          )}
        </h3>

        {/* Status/title */}
        <p className="font-body text-xs text-[var(--color-text-secondary)] leading-snug line-clamp-2">
          {member.status}
        </p>

        {/* Bottom meta row */}
        <div className="mt-auto pt-2 border-t border-[var(--color-border)] flex items-center gap-3">
          {/* Office */}
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] truncate">{member.office_room || 'N/A'}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
