/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#171717',
        'bg-glass': 'rgba(23, 23, 23, 0.6)',
        'bg-glass-hover': 'rgba(38, 38, 38, 0.7)',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'accent-primary': '#3b82f6',
        'accent-hover': '#2563eb',
        'accent-glow': 'rgba(59, 130, 246, 0.4)',
        'border-color': 'rgba(255, 255, 255, 0.08)',
        'border-highlight': 'rgba(255, 255, 255, 0.15)',
        'danger': '#ef4444',
        'success': '#10b981',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
