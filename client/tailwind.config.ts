import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-muted': 'var(--accent-muted)',
        border: 'var(--border)',
        /* Rainbow secondary palette */
        'c-pink':          'var(--c-pink)',
        'c-pink-muted':    'var(--c-pink-muted)',
        'c-purple':        'var(--c-purple)',
        'c-purple-muted':  'var(--c-purple-muted)',
        'c-orange':        'var(--c-orange)',
        'c-orange-muted':  'var(--c-orange-muted)',
        'c-teal':          'var(--c-teal)',
        'c-teal-muted':    'var(--c-teal-muted)',
        'c-yellow':        'var(--c-yellow)',
        'c-yellow-muted':  'var(--c-yellow-muted)',
        'c-red':           'var(--c-red)',
        'c-red-muted':     'var(--c-red-muted)',
        'c-blue':          'var(--c-blue)',
        'c-blue-muted':    'var(--c-blue-muted)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        display: ['Clash Display', 'system-ui', 'sans-serif'],
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
} satisfies Config
