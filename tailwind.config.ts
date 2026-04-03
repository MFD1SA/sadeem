import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#161b2e',
          hover: '#1e2544',
          active: '#252e54',
          text: '#8b90a8',
          'text-active': '#ffffff',
          accent: '#4c6ef5',
        },
        brand: {
          50: '#edf2ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#4c6ef5',
          600: '#3b5bdb',
          700: '#364fc7',
          800: '#2b44a8',
          900: '#1e3a8a',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#f4f5f7',
          tertiary: '#eef0f2',
        },
        content: {
          primary: '#111827',
          secondary: '#4b5563',
          tertiary: '#9ca3af',
          inverse: '#ffffff',
        },
        state: {
          success: '#059669',
          'success-light': '#ecfdf5',
          warning: '#d97706',
          'warning-light': '#fffbeb',
          danger: '#dc2626',
          'danger-light': '#fef2f2',
          info: '#2563eb',
          'info-light': '#eff6ff',
        },
        border: {
          DEFAULT: '#e5e7eb',
          light: '#f3f4f6',
          dark: '#d1d5db',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        dropdown: '0 4px 24px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
        modal: '0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
