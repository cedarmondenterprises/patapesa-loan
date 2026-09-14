/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pata: {
          50: '#edf5f8',
          100: '#d9e9ef',
          600: '#28627f',
          700: '#1e526f',
          800: '#16405c',
          900: '#102a43',
          950: '#0a1c2c',
        },
        copper: '#0a7a62',
        ivory: '#f5f7f8',
      },
      boxShadow: { quiet: '0 18px 50px rgba(17, 31, 45, 0.08)' },
    },
  },
  plugins: [],
};
