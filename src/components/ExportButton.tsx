'use client';
import { useState, useRef, useEffect } from 'react';
import { downloadCSV, downloadXLSX, downloadFullICS, downloadTimetableImage } from '@/lib/export';
import type { ExamEntry } from '@/lib/types';

interface Props {
  entries: ExamEntry[];
  variant?: 'header' | 'sidebar';
}

export function ExportButton({ entries, variant = 'header' }: Props) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  if (entries.length === 0) {
    return (
      <button
        disabled
        className={variant === 'header'
          ? "font-mono text-xs px-3 h-8 rounded border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] opacity-40"
          : "w-full h-10 rounded-md border border-[var(--color-border-strong)] font-body text-sm text-[var(--color-text-secondary)] opacity-40"
        }
      >
        Export ↓
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isExporting}
        aria-label="Export options"
        aria-expanded={open}
        className={variant === 'header'
          ? "font-mono text-xs px-3 h-8 rounded border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
          : "w-full h-10 rounded-md border border-[var(--color-border-strong)] font-body text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
        }
      >
        {isExporting ? 'Generating...' : 'Export ↓'}
      </button>

      {open && (
        <div className={`absolute z-50 bg-[var(--color-bg-raised)] border border-[var(--color-border)] shadow-md rounded-md p-1 min-w-[140px] ${
          variant === 'header' ? 'top-full right-0 mt-1' : 'bottom-full left-0 mb-1 w-full'
        }`}>
          <button
            onClick={async () => {
              setOpen(false);
              setIsExporting(true);
              try {
                // @ts-ignore
                await downloadTimetableImage(entries);
              } catch (e) {
                alert('Failed to generate image. Please try again.');
              } finally {
                setIsExporting(false);
              }
            }}
            className="w-full text-left font-mono text-xs text-[var(--color-text-primary)] px-3 py-2 rounded-sm hover:bg-[var(--color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2"
          >
            as Image (PNG)
          </button>
          <button
            onClick={() => { downloadFullICS(entries); setOpen(false); }}
            className="w-full text-left font-mono text-xs text-[var(--color-text-primary)] px-3 py-2 rounded-sm hover:bg-[var(--color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2"
          >
            as Calendar (.ics)
          </button>
          <button
            onClick={() => { downloadXLSX(entries); setOpen(false); }}
            className="w-full text-left font-mono text-xs text-[var(--color-text-primary)] px-3 py-2 rounded-sm hover:bg-[var(--color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2"
          >
            as XLSX
          </button>
          <button
            onClick={() => { downloadCSV(entries); setOpen(false); }}
            className="w-full text-left font-mono text-xs text-[var(--color-text-primary)] px-3 py-2 rounded-sm hover:bg-[var(--color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2"
          >
            as CSV
          </button>
        </div>
      )}
    </div>
  );
}
