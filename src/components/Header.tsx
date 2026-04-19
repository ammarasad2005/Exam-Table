'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ReactNode } from 'react';

interface HeaderProps {
  children?: ReactNode;
  rightActions?: ReactNode;
}

export function Header({ children, rightActions }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between h-[3.75rem] flex-shrink-0 glass-header-laser px-5 md:px-10"
      style={{ boxShadow: 'var(--shadow-header)' }}
    >
      {/* Left: Logo */}
      <div className="flex items-center min-w-[60px] md:min-w-[100px]">
        <Link href="/" className="flex items-center cursor-pointer group">
          <div 
            className="h-6 w-[72px] transition-colors duration-300 group-hover:scale-105 active:scale-95 bg-[var(--color-text-primary)] group-hover:bg-[var(--laser-rail-mid)]"
            style={{
              maskImage: 'url(/logo/logo.png)',
              WebkitMaskImage: 'url(/logo/logo.png)',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'left center',
              WebkitMaskPosition: 'left center',
            }}
          />
        </Link>
      </div>

      {/* Center: Dynamic Content */}
      <div className="flex-1 flex justify-center mx-2 md:mx-4 overflow-hidden min-w-0">
        {children}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end min-w-[60px] md:min-w-[100px] gap-3 md:gap-4">
        {rightActions}
        <a 
          href="https://linkedin.com/in/ammar-asad-563047289" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="md:hidden text-[var(--color-text-secondary)] hover:text-[#0a66c2] transition-colors dark:hover:text-[#3b82f6]" 
          aria-label="LinkedIn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
