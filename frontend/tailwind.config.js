/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        forest: {
          DEFAULT: '#1b4332',
          light: '#2d6a4f',
          dark: '#081c15',
          accent: '#52b788',
        },
        earth: {
          50: '#fdfbf7',
          100: '#f7f2ea',
          200: '#efe6d5',
          300: '#e3d2b7',
          400: '#d2b691',
          500: '#b08968',
          600: '#9c6f50',
          700: '#7f5539',
          800: '#69462f',
          900: '#43281c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
