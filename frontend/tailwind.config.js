/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pata: {
          50: '#eef4f8',
          100: '#dce8f0',
          600: '#315d7d',
          700: '#244b69',
          800: '#1b3d58',
          900: '#17324d',
          950: '#111f2d',
        },
        copper: '#df4f2f',
        ivory: '#f4f1e9',
      },
      boxShadow: { quiet: '0 18px 50px rgba(17, 31, 45, 0.08)' },
    },
  },
  plugins: [],
};
