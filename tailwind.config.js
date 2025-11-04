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
          'primary': '#dc2626', // red-600
          'secondary': '#ea580c', // orange-600
          'accent': '#f87171', // red-400
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in',
      },
    },
  },
  plugins: [],
}

