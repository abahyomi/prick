/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--c-surface)',
        ink:     'var(--c-ink)',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '10xl': ['10rem', { lineHeight: '1' }],
        '11xl': ['12rem', { lineHeight: '1' }],
        '12xl': ['14rem', { lineHeight: '0.9' }],
      },
      letterSpacing: {
        tightest: '-0.06em',
        widest2:  '0.3em',
        widest3:  '0.5em',
      },
      gridTemplateColumns: {
        gallery: 'repeat(12, 1fr)',
      },
    },
  },
  plugins: [],
}
