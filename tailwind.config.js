/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        paw: {
          bg: '#f8faf9',
          border: '#e2ede9',
        },
      },
      boxShadow: {
        card: '0 4px 24px 0 rgba(0,0,0,0.07)',
        soft: '0 2px 16px 0 rgba(42,157,143,0.08)',
        hover: '0 8px 32px 0 rgba(42,157,143,0.15)',
      },
    },
  },
  plugins: [],
}
