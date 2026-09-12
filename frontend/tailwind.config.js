/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pata: {
          50: '#f2f6f4',
          100: '#dfeae6',
          600: '#1f6654',
          700: '#185445',
          800: '#16463b',
          900: '#123c32',
          950: '#0b2d26',
        },
        copper: '#c88952',
        ivory: '#f7f4ec',
      },
      boxShadow: { quiet: '0 18px 50px rgba(24, 45, 38, 0.08)' },
    },
  },
  plugins: [],
};
