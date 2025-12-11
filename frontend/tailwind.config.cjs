/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'triage-low': '#16a34a',
        'triage-medium': '#eab308',
        'triage-high': '#dc2626',
      },
    },
  },
  plugins: [],
};
