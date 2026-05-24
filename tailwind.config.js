/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        bento: '24px',
        inner: '14px',
        pill: '999px',
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce8ff',
          200: '#b8cfff',
          400: '#6b8fff',
          500: '#4F6EF7',
          600: '#3B58E8',
          700: '#2d44c9',
          800: '#1e2e8a',
          900: '#111d5e',
        },
        surface: {
          DEFAULT: '#FAFAF8',
          card: '#FFFFFF',
          subtle: '#F4F3EF',
          muted: '#ECEAE4',
        },
        ink: {
          DEFAULT: '#1A1917',
          secondary: '#4A4845',
          tertiary: '#8A8783',
          disabled: '#B8B6B0',
        },
        accent: {
          DEFAULT: '#F97316',
          light: '#FFF3E8',
          dark: '#c2570c',
        },
        success: { DEFAULT: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
        warning: { DEFAULT: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
        danger: { DEFAULT: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        fab: '0 8px 32px rgba(249,115,22,0.45)',
        'fab-hover': '0 12px 40px rgba(249,115,22,0.55)',
        modal: '0 24px 64px rgba(0,0,0,0.18)',
        glow: '0 0 0 4px rgba(79,110,247,0.18)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
        'fade-in': 'fadeIn 0.3s ease both',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'spin-slow': 'spin 2s linear infinite',
        'tag-pop': 'tagPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.92)' }, to: { opacity: 1, transform: 'scale(1)' } },
        pulseDot: { '0%,100%': { transform: 'scale(1)', opacity: 1 }, '50%': { transform: 'scale(1.4)', opacity: 0.7 } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        tagPop: { from: { opacity: 0, transform: 'scale(0.7)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
