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
          50: '#E3F2FD',
          100: '#BBDEFB',
          500: '#1976D2',
          600: '#1E88E5',
          700: '#1565C0',
          800: '#0D47A1',
          900: '#0A2540',
        },
        accent: {
          500: '#00C853',
          600: '#00E676',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(13, 71, 161, 0.15)',
      }
    },
  },
  plugins: [],
}
