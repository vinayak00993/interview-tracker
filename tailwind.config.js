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
          50: "#faf6f0",
          100: "#f0e6d6",
          200: "#d9c9ae",
          300: "#b8a990",
          400: "#7d6f5e",
          500: "#5c5044",
          600: "#3d3428",
          700: "#2a2318",
          800: "#211c16",
          900: "#1a1410",
        },
        // Accent — terracotta red
        terra: {
          DEFAULT: "#c45a3c",
          light: "#d4715a",
          dark: "#a44830",
          bg: "#2d1f18",
        },
        // Pipeline status colors (warm-shifted)
        pipeline: {
          saved: { DEFAULT: "#8a7d6d", light: "#a89b8b", bg: "#2a2318" },
          applied: { DEFAULT: "#d4a03c", light: "#e0b85c", bg: "#2d2412" },
          interviewing: { DEFAULT: "#c45a3c", light: "#d4715a", bg: "#2d1f18" },
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
