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
          50: '#F5F3FF',   // Primary text
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#C4B5FD',  // Lavender
          400: '#A78BFA',  // Hover violet
          500: '#8B5CF6',  // Primary violet
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          DEFAULT: '#8B5CF6',
          hover: '#A78BFA',
          lavender: '#C4B5FD',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        cinema: {
          darkest: '#0B0814',  // Main background
          dark: '#120D20',
          card: '#171126',     // Card background
          elevated: '#201735', // Elevated background
          border: '#302343',   // Subtle violet border
          accent: '#A78BFA',   // Hover violet
          primary: '#8B5CF6',  // Primary violet
          lavender: '#C4B5FD', // Lavender
          text: '#F5F3FF',     // Primary text
        }
      },
      boxShadow: {
        'violet-glow': '0 0 20px -3px rgba(139, 92, 246, 0.35)',
        'violet-sm': '0 0 10px -2px rgba(139, 92, 246, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
