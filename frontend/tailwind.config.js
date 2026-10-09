/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pata: {
          50: '#edf4f0',
          100: '#dcebe3',
          600: '#176b55',
          700: '#176b55',
          800: '#104c3d',
          900: '#16332f',
          950: '#102622',
        },
        copper: '#176b55',
        ivory: '#f7f8f5',
      },
      boxShadow: { quiet: '0 18px 50px rgba(11, 31, 75, 0.10)' },
    },
  },
  plugins: [],
};
