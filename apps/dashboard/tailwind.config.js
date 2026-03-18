const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src', '**', '*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
