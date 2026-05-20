/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        surface: {
          page: '#F0F5FF',
          card: '#FFFFFF',
          sheet: '#F8FBFF',
        },
        ink: {
          primary: '#1A1A2E',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
        border: {
          soft: 'rgba(37, 99, 235, 0.12)',
          medium: 'rgba(37, 99, 235, 0.22)',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
