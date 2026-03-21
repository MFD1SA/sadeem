import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1a1f36',
          hover: '#242b4a',
          active: '#2d365e',
          text: '#9ca3c4',
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
          secondary: '#f8f9fb',
          tertiary: '#f1f3f5',
        },
        content: {
          primary: '#1a1d2e',
          secondary: '#5f6580',
          tertiary: '#8b90a8',
          inverse: '#ffffff',
        },
        state: {
          success: '#12b886',
          'success-light': '#e6fcf5',
          warning: '#f59f00',
          'warning-light': '#fff9db',
          danger: '#e03131',
          'danger-light': '#fff5f5',
          info: '#339af0',
          'info-light': '#e7f5ff',
        },
        border: {
          DEFAULT: '#e5e7ed',
          light: '#f1f3f5',
          dark: '#ced4da',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04)',
        dropdown: '0 4px 16px rgba(0,0,0,0.1)',
        modal: '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
