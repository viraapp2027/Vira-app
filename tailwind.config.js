/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        vira: {
          purple: '#6414C8',
          pink: '#E31A92',
          cyan: '#08BCD2',
          ink: '#24133F',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 24px 70px rgba(54, 23, 96, 0.12)',
      },
    },
  },
  plugins: [],
};
