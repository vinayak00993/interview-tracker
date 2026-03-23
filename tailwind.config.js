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
        // Pipeline status colors
        pipeline: {
          saved: { DEFAULT: "#6b7280", light: "#374151", bg: "#1f2937" },
          applied: { DEFAULT: "#f59e0b", light: "#fbbf24", bg: "#451a03" },
          interviewing: { DEFAULT: "#3b82f6", light: "#60a5fa", bg: "#172554" },
          offer: { DEFAULT: "#22c55e", light: "#4ade80", bg: "#052e16" },
          rejected: { DEFAULT: "#ef4444", light: "#f87171", bg: "#450a0a" },
          withdrawn: { DEFAULT: "#8b5cf6", light: "#a78bfa", bg: "#2e1065" },
        },
        // Sentiment colors
        sentiment: {
          positive: "#22c55e",
          neutral: "#f59e0b",
          negative: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
