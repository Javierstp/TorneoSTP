/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#f0c94b',
          500: '#d4a82a',
        },
        surface: {
          DEFAULT: '#0f1729',
          light: '#1a243b',
          lighter: '#243252',
        }
      }
    },
  },
  plugins: [],
}
