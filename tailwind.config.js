/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Raleway', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#181856',
          red: '#D2312C',
          blue: '#599BE4',
          green: '#89BF52',
          'green-dark': '#469C6A',
          lime: '#B3DB4D',
          magenta: '#C042B6',
          orange: '#EF7145',
          yellow: '#FBD94B',
          bg: '#F1F8FF',
          white: '#FFFFFF',
          border: '#E1E8F0',
          'text-secondary': '#5F6378',
          'text-muted': '#9A9DB0',
        },
        alert: {
          critical: '#D2312C',
          warning: '#EF7145',
          neutral: '#FBD94B',
          positive: '#599BE4',
          strong: '#469C6A',
          nodata: '#9A9DB0',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(24,24,86,0.08)',
        'card-hover': '0 4px 12px rgba(24,24,86,0.12)',
      },
    },
  },
  plugins: [],
};
