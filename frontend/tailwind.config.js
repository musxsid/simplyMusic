/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        dark: {
          bg: '#020617',
          card: '#0f172a',
          border: '#1e293b',
          text: '#e2e8f0',
          muted: '#94a3b8'
        }
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(244, 63, 94, 0.5)',
        'neumorphic': '10px 10px 20px #d1d9e6, -10px -10px 20px #ffffff',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'jelly-popup': 'jelly-popup 0.65s cubic-bezier(0.25, 1.1, 0.5, 1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'jelly-popup': {
          '0%': { transform: 'translateY(40px) scale(0.95)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-150%) skewX(-12deg)' },
          '100%': { transform: 'translateX(200%) skewX(-12deg)' },
        }
      }
    },
  },
  plugins: [],
}
