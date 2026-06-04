import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
        display: ['Orbitron', 'monospace']
      },
      colors: {
        bg: {
          0: '#030508',
          1: '#080c14',
          2: '#0d1420',
          3: '#111826'
        },
        cyan: { DEFAULT: '#38bdf8', dim: 'rgba(56,189,248,0.15)' },
        green: { DEFAULT: '#22d3a5', dim: 'rgba(34,211,165,0.15)' },
        red: { DEFAULT: '#f43f5e', dim: 'rgba(244,63,94,0.15)' },
        amber: { DEFAULT: '#fbbf24', dim: 'rgba(251,191,36,0.15)' },
        purple: { DEFAULT: '#a78bfa' },
        border: {
          DEFAULT: 'rgba(56,189,248,0.12)',
          bright: 'rgba(56,189,248,0.3)'
        }
      },
      animation: {
        'ticker': 'ticker-scroll 40s linear infinite',
        'fade-up': 'fade-in-up 0.4s ease both',
        'blink': 'blink 1.2s infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'spin-slow': 'spin 8s linear infinite'
      },
      keyframes: {
        'ticker-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'blink': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' }
        }
      },
      backdropBlur: { glass: '20px' }
    }
  },
  plugins: []
}

export default config
