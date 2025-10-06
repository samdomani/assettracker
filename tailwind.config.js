/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1f2937',
          accent: '#fb923c'
        }
      }
    }
  },
  plugins: []
};



