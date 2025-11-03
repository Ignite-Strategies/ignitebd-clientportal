/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ignite': {
          'primary': '#1e40af',
          'secondary': '#3b82f6',
          'accent': '#60a5fa',
        },
      },
    },
  },
  plugins: [],
}

