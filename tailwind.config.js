/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
