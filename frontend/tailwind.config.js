/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pata: {
          50: '#eef4ff',
          100: '#dce8ff',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#173ca8',
          900: '#0b1f4b',
          950: '#07132f',
        },
        copper: '#ff5a36',
        ivory: '#f5f7fc',
      },
      boxShadow: { quiet: '0 18px 50px rgba(11, 31, 75, 0.10)' },
    },
  },
  plugins: [],
};
