/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.08em',
      },
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
        'fade-in': 'fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up-delay-1': 'fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.05s both',
        'fade-in-up-delay-2': 'fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both',
        'fade-in-up-delay-3': 'fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both',
        'fade-in-up-delay-4': 'fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both',
        'fade-in-up-delay-5': 'fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        // Warm terracotta-tinted shadows — "ambient tonal depth"
        'card': '0 1px 2px rgba(44, 36, 24, 0.04)',
        'card-hover': '0 8px 24px rgba(162, 78, 61, 0.06), 0 2px 4px rgba(44, 36, 24, 0.04)',
        'elevated': '0 12px 32px rgba(162, 78, 61, 0.06), 0 2px 8px rgba(44, 36, 24, 0.04)',
        'glow': '0 0 20px rgba(162, 78, 61, 0.12)',
        'lift': '0 12px 32px rgba(162, 78, 61, 0.08), 0 4px 12px rgba(44, 36, 24, 0.04)',
      },
      colors: {
        // ==== Earthen Manuscript palette (primary) ====
        ink: {
          DEFAULT: '#1c1c19',     // on-surface
          50: '#fcf9f4',          // surface / background
          100: '#f6f3ee',         // surface-container-low
          200: '#f0ede8',         // surface-container
          300: '#ebe8e3',         // surface-container-high
          400: '#e5e2dd',         // surface-container-highest / surface-variant
          500: '#dcdad5',         // surface-dim
          600: '#88726e',         // outline
          700: '#55433f',         // on-surface-variant
          800: '#31302d',         // inverse-surface
          900: '#1c1c19',         // on-surface
        },
        terracotta: {
          DEFAULT: '#843728',     // primary
          soft: '#a24e3d',        // primary-container
          deep: '#792f21',        // on-primary-fixed-variant
          pale: '#ffdfd9',        // on-primary-container tint
        },
        umber: {
          DEFAULT: '#695c4c',     // secondary
          soft: '#efddc8',        // secondary-container
        },
        sage: {
          DEFAULT: '#4c513e',     // tertiary
          soft: '#e0e5cc',        // tertiary-fixed
        },
        vellum: {
          DEFAULT: '#fcf9f4',     // surface
          low: '#f6f3ee',         // surface-container-low
          mid: '#f0ede8',         // surface-container
          high: '#ebe8e3',        // surface-container-high
          highest: '#e5e2dd',     // surface-container-highest
          lowest: '#ffffff',      // surface-container-lowest
        },
        outlineSoft: '#dbc1bc',   // outline-variant

        // ==== Legacy warm/terra palette — kept so existing classes still compile ====
        warm: {
          50: "#fcf9f4",
          100: "#f6f3ee",
          200: "#f0ede8",
          300: "#e5e2dd",
          400: "#b8a990",
          500: "#88726e",
          600: "#55433f",
          700: "#55433f",
          800: "#31302d",
          900: "#1c1c19",
        },
        terra: {
          DEFAULT: "#843728",
          light: "#a24e3d",
          dark: "#792f21",
          bg: "#fdf2f2",
        },
        pipeline: {
          saved:        { DEFAULT: "#88726e", light: "#a8968f", bg: "#ebe8e3" },
          applied:      { DEFAULT: "#b98a3c", light: "#d4a366", bg: "#f5ecd9" },
          interviewing: { DEFAULT: "#843728", light: "#a24e3d", bg: "#f6e8e4" },
          offer:        { DEFAULT: "#4c513e", light: "#6b705c", bg: "#e4e8d0" },
          rejected:     { DEFAULT: "#a24e3d", light: "#b86d5e", bg: "#f0d8d2" },
          withdrawn:    { DEFAULT: "#7a6e85", light: "#958aa1", bg: "#e5e0ea" },
        },
        sentiment: {
          positive: "#4c513e",
          neutral:  "#b98a3c",
          negative: "#a24e3d",
        },
      },
      borderRadius: {
        // Roundedness: 1 — small, structured
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};
