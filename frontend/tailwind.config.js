/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          bg: '#07090E',
          card: 'rgba(15, 23, 42, 0.80)',
          elevated: '#1E293B',
          input: 'rgba(255, 255, 255, 0.05)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.05)',
          focus: '#0A84FF',
        },
        accent: {
          DEFAULT: '#0A84FF',
          hover: '#0070E0',
          muted: 'rgba(10, 132, 255, 0.15)',
        },
        semantic: {
          success: '#30D158',
          warning: '#FF9F0A',
          danger: '#FF453A',
          info: '#64D2FF',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 12px 40px 0 rgba(10, 132, 255, 0.2)',
        'neon': '0 0 20px -3px rgba(10, 132, 255, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
      }
    },
  },
  plugins: [],
}
