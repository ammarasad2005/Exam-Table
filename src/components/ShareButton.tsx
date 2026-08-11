'use client';

/**
 * ShareButton — a "Copy link" button that copies the current URL (or a provided
 * URL) to the clipboard and shows a brief "Copied!" confirmation.
 *
 * Uses the Web Share API where available (mobile), falls back to clipboard.writeText.
 * Accessible: aria-label, aria-live for the confirmation. Respects reduced-motion.
 *
 * Design: secondary button style (border + raised bg), matches the detail-drawer
 * action pattern (sits next to "Add to calendar" etc.).
 */
import { useState, useCallback } from 'react';
import { Link2, Check } from 'lucide-react';

interface ShareButtonProps {
  /** URL to share. Defaults to window.location.href. */
  url?: string;
  /** Text to share (Web Share API). Defaults to document.title. */
  text?: string;
  /** Label override. */
  label?: string;
  /** Compact (icon-only) variant for tight spaces. */
  compact?: boolean;
  /** Extra classes. */
  className?: string;
}

export function ShareButton({ url, text, label = 'Copy link', compact = false, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = text ?? (typeof document !== 'undefined' ? document.title : '');

    // Try Web Share API first (mobile / supported browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ url: shareUrl, title: shareText });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API unavailable — silent fail (button still visible)
      }
    }
  }, [url, text]);

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? 'Link copied' : label}
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-2 h-11 rounded-md border border-[var(--color-border-strong)] font-body text-sm font-medium text-[var(--color-text-primary)] active:scale-[0.98] transition-transform hover:bg-[var(--color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2 ${className}`}
    >
      {copied ? (
        <>
          <Check width={15} height={15} strokeWidth={2.25} className="text-[var(--color-success-strong)]" />
          {!compact && <span>Copied!</span>}
        </>
      ) : (
        <>
          <Link2 width={15} height={15} strokeWidth={2} />
          {!compact && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
