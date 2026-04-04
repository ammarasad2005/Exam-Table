import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      colors: {
        bg:       'var(--color-bg)',
        raised:   'var(--color-bg-raised)',
        subtle:   'var(--color-bg-subtle)',
        border:   'var(--color-border)',
        primary:  'var(--color-text-primary)',
        secondary:'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      height: {
        '13': '52px',
      },
    },
  },
  plugins: [],
} satisfies Config;
