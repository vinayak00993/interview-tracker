/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'fade-in-up-delay-1': 'fade-in-up 0.4s ease-out 0.05s both',
        'fade-in-up-delay-2': 'fade-in-up 0.4s ease-out 0.1s both',
        'fade-in-up-delay-3': 'fade-in-up 0.4s ease-out 0.15s both',
        'fade-in-up-delay-4': 'fade-in-up 0.4s ease-out 0.2s both',
        'fade-in-up-delay-5': 'fade-in-up 0.4s ease-out 0.25s both',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(44, 36, 24, 0.06), 0 1px 2px rgba(44, 36, 24, 0.04)',
        'card-hover': '0 4px 12px rgba(44, 36, 24, 0.1), 0 2px 4px rgba(44, 36, 24, 0.06)',
        'elevated': '0 8px 24px rgba(44, 36, 24, 0.12), 0 2px 8px rgba(44, 36, 24, 0.06)',
        'glow': '0 0 20px rgba(179, 58, 58, 0.15)',
      },
      colors: {
        // Warm base palette
        warm: {
          50: "#faf6ef",
          100: "#f5ede0",
          200: "#ebe3d4",
          300: "#d4c9b6",
          400: "#b8a990",
          500: "#8a7d6d",
          600: "#6b5f4f",
          700: "#5c4f3e",
          800: "#3d3428",
          900: "#2c2418",
        },
        // Accent — terracotta red
        terra: {
          DEFAULT: "#b33a3a",
          light: "#c94e4e",
          dark: "#8f2e2e",
          bg: "#fdf2f2",
        },
        // Pipeline status colors (warm-shifted)
        pipeline: {
          saved: { DEFAULT: "#8a7d6d", light: "#a89b8b", bg: "#2a2318" },
          applied: { DEFAULT: "#d4a03c", light: "#e0b85c", bg: "#2d2412" },
          interviewing: { DEFAULT: "#b33a3a", light: "#c94e4e", bg: "#fdf2f2" },
          offer: { DEFAULT: "#6b9e5c", light: "#85b874", bg: "#1e2a16" },
          rejected: { DEFAULT: "#c44848", light: "#d46a6a", bg: "#2d1616" },
          withdrawn: { DEFAULT: "#9b7bb8", light: "#b298ca", bg: "#251e2d" },
        },
        // Sentiment colors
        sentiment: {
          positive: "#6b9e5c",
          neutral: "#d4a03c",
          negative: "#c44848",
        },
      },
    },
  },
  plugins: [],
};
