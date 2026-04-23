import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cozy clubhouse base
        cream: {
          50: '#FFFBF4',
          100: '#FFF4E0',
          200: '#FDEBC8',
        },
        // Primary brand - warm sunrise coral
        coral: {
          300: '#FFB3A7',
          400: '#FF8E80',
          500: '#FF6B5B',
          600: '#E85545',
        },
        // Secondary - soft berry
        berry: {
          300: '#E8A5D1',
          400: '#D67FBA',
          500: '#B85CA0',
        },
        // Magic accent - sky lavender
        sky: {
          300: '#B8D4F5',
          400: '#8FB8E8',
          500: '#6B98D6',
        },
        // Nature accent - meadow
        meadow: {
          300: '#B7E4B7',
          400: '#8BCE8B',
          500: '#5FB85F',
        },
        // Sparkle - soft gold
        sparkle: {
          300: '#FFE59A',
          400: '#FFD166',
          500: '#F5B82E',
        },
        ink: {
          900: '#2A1B3D', // deep plum for text
          700: '#5B4A6E',
          500: '#8B7D9E',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'cursive'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        blob: '40% 60% 55% 45% / 50% 45% 55% 50%',
        squircle: '2rem',
      },
      boxShadow: {
        chunky: '0 6px 0 0 rgba(42, 27, 61, 0.15)',
        chunkyCoral: '0 6px 0 0 rgba(232, 85, 69, 0.4)',
        float: '0 10px 30px -10px rgba(42, 27, 61, 0.25)',
        inner: 'inset 0 2px 4px rgba(42, 27, 61, 0.1)',
      },
      animation: {
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'wiggle': 'wiggle 0.6s ease-in-out',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'sparkle': 'sparkle 1.2s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-4deg)' },
          '75%': { transform: 'rotate(4deg)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'sparkle': {
          '0%, 100%': { transform: 'scale(0.8) rotate(0deg)', opacity: '0.6' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
