/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          50: '#f0f0ff',
          100: '#e0e1ff',
          200: '#c7c8fe',
          300: '#a5a6fc',
          400: '#8183f9',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#0f0f23',
        },
        neon: {
          purple: '#a855f7',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          green: '#10b981',
          pink: '#ec4899',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(15, 15, 35, 0.8)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-midnight': 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
        'gradient-glow': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(277, 75%, 30%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 75%, 30%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 75%, 20%, 0.2) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
        'glow-purple': '0 0 30px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 30px rgba(6, 182, 212, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(99, 102, 241, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
