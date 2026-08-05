import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
        clock:   ['var(--font-clock)', 'monospace'],
      },

      colors: {
        bg:       'var(--color-bg)',
        raised:   'var(--color-bg-raised)',
        subtle:   'var(--color-bg-subtle)',
        border:   'var(--color-border)',
        // Redesign: ink-primary action tokens (T1)
        'primary-action': {
          DEFAULT: 'var(--color-primary-action)',
          fg:      'var(--color-primary-action-fg)',
          hover:   'var(--color-primary-action-hover)',
        },
        // Redesign: unified today + tokenized semantic colors (T2/T5)
        today: {
          DEFAULT: 'var(--color-today)',
          bg:      'var(--color-today-bg)',
          glow:    'var(--color-today-glow)',
        },
        'success-strong': 'var(--color-success-strong)',
        urgent:           'var(--color-urgent)',
        linkedin:         'var(--color-linkedin)',
        whatsapp:         'var(--color-whatsapp)',
        primary: {
          DEFAULT: 'var(--color-text-primary)',
          foreground: 'oklch(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'var(--color-text-secondary)',
          foreground: 'oklch(var(--secondary-foreground))',
        },
        tertiary: 'var(--color-text-tertiary)',
        background: 'oklch(var(--background))',
        foreground: 'oklch(var(--foreground))',
        card: {
          DEFAULT: 'oklch(var(--card))',
          foreground: 'oklch(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover))',
          foreground: 'oklch(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted))',
          foreground: 'oklch(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent))',
          foreground: 'oklch(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive))',
          foreground: 'oklch(var(--destructive-foreground))',
        },
        input: 'oklch(var(--input))',
        ring: 'oklch(var(--ring))',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      // Redesign: expose the design-system shadows + spacing as utilities (T22)
      boxShadow: {
        card:   'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
        float:  'var(--shadow-float)',
        header: 'var(--shadow-header)',
        'pane-r': 'var(--shadow-pane-r)',
      },
      height: {
        '13': '52px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
