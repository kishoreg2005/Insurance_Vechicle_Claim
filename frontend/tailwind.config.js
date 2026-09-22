/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy primary (kept for any remaining references)
        primary: {
          50: '#EAF4FF',
          100: '#D6EAFF',
          200: '#ADCFFF',
          300: '#6AABFF',
          400: '#3B8BFF',
          500: '#1268E8',
          600: '#0F58D4',
          700: '#0C47B5',
          800: '#082B5C',
          900: '#06244F',
          950: '#040E25',
        },
        // AutoSure design system
        navy: {
          DEFAULT: '#06244F',
          light: '#082B5C',
          dark: '#040E25',
        },
        brand: {
          blue: '#1268E8',
          'blue-light': '#EAF4FF',
          bg: '#F7FAFD',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
};
