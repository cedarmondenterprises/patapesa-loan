/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pata: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          600: '#F97316',
          700: '#EA580C',
          800: '#C2410C',
          900: '#2A211C',
          950: '#1F2937',
        },
        copper: '#F97316',
        ivory: '#FFF9F5',
      },
      boxShadow: { quiet: '0 18px 50px rgba(11, 31, 75, 0.10)' },
    },
  },
  plugins: [],
};
