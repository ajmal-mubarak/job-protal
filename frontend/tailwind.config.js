/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#ffffff',
        surface: 'rgba(255,255,255,0.70)',
        'surface-2': 'rgba(0,0,0,0.03)',
        'surface-3': 'rgba(0,0,0,0.06)',
        border: 'rgba(99,102,241,0.08)',
        'border-light': 'rgba(99,102,241,0.15)',
        primary: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
          muted: 'rgba(99,102,241,0.08)',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        muted: '#64748b',
        'text-primary': '#0f172a',
        'text-secondary': '#475569',
        'text-muted': '#64748b',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.35), transparent)',
        'mesh': 'radial-gradient(at 40% 20%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(139,92,246,0.10) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(99,102,241,0.08) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(99,102,241,0.25)',
        'glow': '0 0 40px rgba(99,102,241,0.30)',
        'glow-lg': '0 0 80px rgba(99,102,241,0.35)',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(99,102,241,0.25)',
        'glass': '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-hover': '0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        'nav': '0 4px 32px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.08)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
