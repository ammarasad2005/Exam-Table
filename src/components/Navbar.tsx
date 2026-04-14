'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Rooms', path: '/rooms' },
    { name: 'Custom', path: '/timetable/custom' },
  ];

  return (
    <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-1 bg-zinc-900/40 dark:bg-white/40 backdrop-blur-xl backdrop-saturate-150 shadow-float rounded-full flex items-center gap-1 border border-white/20 dark:border-black/10 ${
      pathname === '/' ? 'hidden md:flex' : 'flex'
    }`}>
      {links.map(link => {
        const isActive = pathname === link.path;
        return (
          <Link
            key={link.path}
            href={link.path}
            className={`px-4 h-9 flex items-center rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-all ${
              isActive 
                ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black font-bold shadow-sm' 
                : 'text-white/60 dark:text-black/60 hover:text-white dark:hover:text-black hover:bg-white/5 dark:hover:bg-black/5'
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
