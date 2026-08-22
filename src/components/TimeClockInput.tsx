'use client';

import { useState, useRef, useEffect } from 'react';

interface TimeClockInputProps {
  value: string; // "HH:MM" format (24h)
  onChange: (value: string) => void;
  label?: string;
}

/**
 * A digital clock-style time input.
 * Shows HH:MM in a monospace digital format with up/down scroll arrows
 * for hours and minutes independently.
 *
 * Not a dropdown — a real interactive time picker.
 */
export function TimeClockInput({ value, onChange, label }: TimeClockInputProps) {
  const parts = value.split(':');
  const hours = parseInt(parts[0] || '8', 10);
  const minutes = parseInt(parts[1] || '0', 10);

  const displayHours = hours === 0 ? 12 : hours <= 12 ? hours : hours - 12;
  const period = hours < 12 ? 'AM' : 'PM';

  function adjust(field: 'h' | 'm', delta: number) {
    let h = hours;
    let m = minutes;
    if (field === 'h') {
      h = (h + delta + 24) % 24;
    } else {
      m = (m + delta + 60) % 60;
      // Snap to 5-minute increments
      m = Math.round(m / 5) * 5 % 60;
    }
    const newH = String(h).padStart(2, '0');
    const newM = String(m).padStart(2, '0');
    onChange(`${newH}:${newM}`);
  }

  function setPeriod(p: 'AM' | 'PM') {
    let h = hours;
    if (p === 'AM' && h >= 12) h -= 12;
    if (p === 'PM' && h < 12) h += 12;
    onChange(`${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '24px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-subtle)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    fontSize: '10px',
    transition: 'all 0.15s',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {label}
        </span>
      )}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl border"
        style={{ borderColor: 'var(--color-border-strong)', backgroundColor: 'var(--color-bg-raised)' }}
      >
        {/* Hours column */}
        <div className="flex flex-col items-center gap-1">
          <button type="button" style={btnStyle} onClick={() => adjust('h', 1)} aria-label="Hour up">
            <svg width="10" height="6" viewBox="0 0 12 7" fill="none"><path d="M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)', minWidth: '2ch', textAlign: 'center' }}>
            {String(displayHours).padStart(2, '0')}
          </span>
          <button type="button" style={btnStyle} onClick={() => adjust('h', -1)} aria-label="Hour down">
            <svg width="10" height="6" viewBox="0 0 12 7" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        <span className="font-mono text-2xl font-bold" style={{ color: 'var(--color-text-tertiary)' }}>:</span>

        {/* Minutes column */}
        <div className="flex flex-col items-center gap-1">
          <button type="button" style={btnStyle} onClick={() => adjust('m', 5)} aria-label="Minute up">
            <svg width="10" height="6" viewBox="0 0 12 7" fill="none"><path d="M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)', minWidth: '2ch', textAlign: 'center' }}>
            {String(minutes).padStart(2, '0')}
          </span>
          <button type="button" style={btnStyle} onClick={() => adjust('m', -5)} aria-label="Minute down">
            <svg width="10" height="6" viewBox="0 0 12 7" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* AM/PM toggle */}
        <div className="flex flex-col gap-1 ml-1">
          <button
            type="button"
            onClick={() => setPeriod('AM')}
            className="px-2 py-1 rounded text-[10px] font-bold font-mono transition-all"
            style={{
              backgroundColor: period === 'AM' ? 'var(--color-text-primary)' : 'var(--color-bg-subtle)',
              color: period === 'AM' ? 'var(--color-bg)' : 'var(--color-text-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => setPeriod('PM')}
            className="px-2 py-1 rounded text-[10px] font-bold font-mono transition-all"
            style={{
              backgroundColor: period === 'PM' ? 'var(--color-text-primary)' : 'var(--color-bg-subtle)',
              color: period === 'PM' ? 'var(--color-bg)' : 'var(--color-text-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}
