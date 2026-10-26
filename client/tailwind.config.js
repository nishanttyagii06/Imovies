/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48', // primary cinema red
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        cinema: {
          darkest: '#090b10',
          dark: '#0f141f',
          card: '#161c2b',
          border: '#232c42',
          accent: '#38bdf8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
