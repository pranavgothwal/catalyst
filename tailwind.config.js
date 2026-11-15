/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFCFB',
          100: '#FAF8F5',
          200: '#F4EFEA',
          300: '#EDE4DC',
        },
        forest: {
          800: '#152A22',
          900: '#1E3A2F',
          950: '#10201A',
        },
        sage: {
          100: '#E8F0EA',
          200: '#D1E1D5',
          500: '#6B8F71',
          600: '#547259',
          700: '#3D5541',
        },
        terracotta: {
          50: '#FDF6F3',
          100: '#F9ECE6',
          500: '#C96E4B',
          600: '#B05937',
        },
        amber: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
