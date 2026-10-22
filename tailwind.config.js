/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fluent: {
          bg: {
            light: '#f3f3f3',
            dark: '#1c1c1c',
            subtle: '#202020',
            card: '#2b2b2b',
            hover: '#323232',
          },
          border: {
            light: '#e5e5e5',
            dark: '#3b3b3b',
          },
          accent: {
            DEFAULT: '#0078d4',
            hover: '#1084d9',
            active: '#0067b8',
            subtle: 'rgba(0, 120, 212, 0.15)',
          },
        },
      },
      fontFamily: {
        sans: [
          '"Segoe UI Variable Text"',
          '"Segoe UI"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"Cascadia Code"',
          'Consolas',
          '"Fira Code"',
          'monospace',
        ],
      },
      boxShadow: {
        'fluent-dialog': '0 8px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25)',
        'fluent-card': '0 2px 8px rgba(0, 0, 0, 0.25)',
        'fluent-elevated': '0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s cubic-bezier(0.1, 0.9, 0.2, 1)',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)',
        'scale-in': 'scaleIn 0.15s cubic-bezier(0.1, 0.9, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
