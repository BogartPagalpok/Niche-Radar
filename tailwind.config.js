/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yt: {
          red: '#FF0000',
          'red-hover': '#CC0000',
          'red-light': '#FF3333',
          dark: '#0F0F0F',
          'dark-panel': '#1F1F1F',
          'dark-border': '#2D2D2D',
          'dark-surface': '#282828',
          'dark-elevated': '#3A3A3A',
          light: '#FFFFFF',
          'light-panel': '#F9F9F9',
          'light-border': '#E5E5E5',
          'light-surface': '#F2F2F2',
          'light-elevated': '#EBEBEB',
        },
        mint: {
          50: '#F0FFF8',
          100: '#C6F6E4',
          200: '#9AEFD0',
          300: '#6DE8BB',
          400: '#40E0A5',
          500: '#22C78A',
          600: '#17A371',
        },
        success: {
          50: '#F0FDF4',
          500: '#22C55E',
          600: '#16A34A',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        error: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
      },
      boxShadow: {
        'clay-sm': '4px 4px 8px rgba(0,0,0,0.12), -2px -2px 6px rgba(255,255,255,0.8), inset 1px 1px 2px rgba(255,255,255,0.9)',
        'clay': '6px 6px 14px rgba(0,0,0,0.15), -3px -3px 10px rgba(255,255,255,0.85), inset 2px 2px 4px rgba(255,255,255,0.95)',
        'clay-lg': '10px 10px 20px rgba(0,0,0,0.18), -5px -5px 14px rgba(255,255,255,0.88), inset 3px 3px 6px rgba(255,255,255,1)',
        'clay-dark-sm': '4px 4px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.04)',
        'clay-dark': '6px 6px 14px rgba(0,0,0,0.6), -3px -3px 10px rgba(255,255,255,0.05), inset 2px 2px 4px rgba(255,255,255,0.06)',
        'clay-dark-lg': '10px 10px 24px rgba(0,0,0,0.7), -4px -4px 12px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(255,255,255,0.05)',
        'clay-inset': 'inset 4px 4px 8px rgba(0,0,0,0.12), inset -2px -2px 6px rgba(255,255,255,0.8)',
        'clay-dark-inset': 'inset 4px 4px 10px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.04)',
        'clay-red': '6px 6px 14px rgba(255,0,0,0.25), -3px -3px 10px rgba(255,255,255,0.85), inset 2px 2px 4px rgba(255,255,255,0.9)',
        'clay-red-dark': '6px 6px 16px rgba(255,0,0,0.35), -2px -2px 8px rgba(255,255,255,0.05)',
        'clay-mint': '6px 6px 14px rgba(34,199,138,0.2), -3px -3px 10px rgba(255,255,255,0.85), inset 2px 2px 4px rgba(255,255,255,0.9)',
        'pill-active': '0 4px 16px rgba(34,199,138,0.3), inset 2px 2px 6px rgba(255,255,255,0.6), inset -1px -1px 3px rgba(0,0,0,0.05)',
        'pill-active-dark': '0 4px 20px rgba(34,199,138,0.25), inset 2px 2px 4px rgba(255,255,255,0.08), inset -2px -2px 6px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        'clay': '18px',
        'clay-sm': '12px',
        'clay-lg': '24px',
        'clay-xl': '32px',
        'pill': '9999px',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'mint-gradient': 'linear-gradient(135deg, #C6F6E4 0%, #9AEFD0 50%, #6DE8BB 100%)',
        'mint-gradient-dark': 'linear-gradient(135deg, rgba(34,199,138,0.15) 0%, rgba(22,199,138,0.08) 100%)',
        'red-gradient': 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
        'panel-light': 'linear-gradient(145deg, #FFFFFF 0%, #F9F9F9 100%)',
        'panel-dark': 'linear-gradient(145deg, #232323 0%, #1A1A1A 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-red': 'pulseRed 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,0,0,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255,0,0,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
