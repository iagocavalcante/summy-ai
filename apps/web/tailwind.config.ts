import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          50: "rgb(var(--color-primary-50) / <alpha-value>)",
          100: "rgb(var(--color-primary-100) / <alpha-value>)",
          200: "rgb(var(--color-primary-200) / <alpha-value>)",
          300: "rgb(var(--color-primary-300) / <alpha-value>)",
          400: "rgb(var(--color-primary-400) / <alpha-value>)",
          500: "rgb(var(--color-primary-500) / <alpha-value>)",
          600: "rgb(var(--color-primary-600) / <alpha-value>)",
          700: "rgb(var(--color-primary-700) / <alpha-value>)",
          800: "rgb(var(--color-primary-800) / <alpha-value>)",
          900: "rgb(var(--color-primary-900) / <alpha-value>)",
          950: "rgb(var(--color-primary-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-primary-600) / <alpha-value>)",
        },
        accent: {
          50: "rgb(var(--color-accent-50) / <alpha-value>)",
          100: "rgb(var(--color-accent-100) / <alpha-value>)",
          200: "rgb(var(--color-accent-200) / <alpha-value>)",
          300: "rgb(var(--color-accent-300) / <alpha-value>)",
          400: "rgb(var(--color-accent-400) / <alpha-value>)",
          500: "rgb(var(--color-accent-500) / <alpha-value>)",
          600: "rgb(var(--color-accent-600) / <alpha-value>)",
          700: "rgb(var(--color-accent-700) / <alpha-value>)",
          800: "rgb(var(--color-accent-800) / <alpha-value>)",
          900: "rgb(var(--color-accent-900) / <alpha-value>)",
          950: "rgb(var(--color-accent-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-accent-500) / <alpha-value>)",
        },
        success: {
          50: "rgb(var(--color-success-50) / <alpha-value>)",
          100: "rgb(var(--color-success-100) / <alpha-value>)",
          200: "rgb(var(--color-success-200) / <alpha-value>)",
          300: "rgb(var(--color-success-300) / <alpha-value>)",
          400: "rgb(var(--color-success-400) / <alpha-value>)",
          500: "rgb(var(--color-success-500) / <alpha-value>)",
          600: "rgb(var(--color-success-600) / <alpha-value>)",
          700: "rgb(var(--color-success-700) / <alpha-value>)",
          800: "rgb(var(--color-success-800) / <alpha-value>)",
          900: "rgb(var(--color-success-900) / <alpha-value>)",
          950: "rgb(var(--color-success-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-success-600) / <alpha-value>)",
        },
        warning: {
          50: "rgb(var(--color-warning-50) / <alpha-value>)",
          100: "rgb(var(--color-warning-100) / <alpha-value>)",
          200: "rgb(var(--color-warning-200) / <alpha-value>)",
          300: "rgb(var(--color-warning-300) / <alpha-value>)",
          400: "rgb(var(--color-warning-400) / <alpha-value>)",
          500: "rgb(var(--color-warning-500) / <alpha-value>)",
          600: "rgb(var(--color-warning-600) / <alpha-value>)",
          700: "rgb(var(--color-warning-700) / <alpha-value>)",
          800: "rgb(var(--color-warning-800) / <alpha-value>)",
          900: "rgb(var(--color-warning-900) / <alpha-value>)",
          950: "rgb(var(--color-warning-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-warning-500) / <alpha-value>)",
        },
        error: {
          50: "rgb(var(--color-error-50) / <alpha-value>)",
          100: "rgb(var(--color-error-100) / <alpha-value>)",
          200: "rgb(var(--color-error-200) / <alpha-value>)",
          300: "rgb(var(--color-error-300) / <alpha-value>)",
          400: "rgb(var(--color-error-400) / <alpha-value>)",
          500: "rgb(var(--color-error-500) / <alpha-value>)",
          600: "rgb(var(--color-error-600) / <alpha-value>)",
          700: "rgb(var(--color-error-700) / <alpha-value>)",
          800: "rgb(var(--color-error-800) / <alpha-value>)",
          900: "rgb(var(--color-error-900) / <alpha-value>)",
          950: "rgb(var(--color-error-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-error-600) / <alpha-value>)",
        },
        info: {
          50: "rgb(var(--color-info-50) / <alpha-value>)",
          100: "rgb(var(--color-info-100) / <alpha-value>)",
          200: "rgb(var(--color-info-200) / <alpha-value>)",
          300: "rgb(var(--color-info-300) / <alpha-value>)",
          400: "rgb(var(--color-info-400) / <alpha-value>)",
          500: "rgb(var(--color-info-500) / <alpha-value>)",
          600: "rgb(var(--color-info-600) / <alpha-value>)",
          700: "rgb(var(--color-info-700) / <alpha-value>)",
          800: "rgb(var(--color-info-800) / <alpha-value>)",
          900: "rgb(var(--color-info-900) / <alpha-value>)",
          950: "rgb(var(--color-info-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-info-600) / <alpha-value>)",
        },
        neutral: {
          50: "rgb(var(--color-neutral-50) / <alpha-value>)",
          100: "rgb(var(--color-neutral-100) / <alpha-value>)",
          200: "rgb(var(--color-neutral-200) / <alpha-value>)",
          300: "rgb(var(--color-neutral-300) / <alpha-value>)",
          400: "rgb(var(--color-neutral-400) / <alpha-value>)",
          500: "rgb(var(--color-neutral-500) / <alpha-value>)",
          600: "rgb(var(--color-neutral-600) / <alpha-value>)",
          700: "rgb(var(--color-neutral-700) / <alpha-value>)",
          800: "rgb(var(--color-neutral-800) / <alpha-value>)",
          900: "rgb(var(--color-neutral-900) / <alpha-value>)",
          950: "rgb(var(--color-neutral-950) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        DEFAULT: "var(--transition-base)",
        slow: "var(--transition-slow)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "draw-checkmark": {
          from: {
            strokeDasharray: "0 50",
            strokeDashoffset: "0"
          },
          to: {
            strokeDasharray: "50 0",
            strokeDashoffset: "0"
          },
        },
        "shimmer": {
          "0%": {
            backgroundPosition: "-200% 0"
          },
          "100%": {
            backgroundPosition: "200% 0"
          },
        },
        "bounce-subtle": {
          "0%, 100%": {
            transform: "translateY(0)"
          },
          "50%": {
            transform: "translateY(-5%)"
          },
        },
        "scale-in": {
          from: {
            transform: "scale(0.95)",
            opacity: "0"
          },
          to: {
            transform: "scale(1)",
            opacity: "1"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.4s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "draw-checkmark": "draw-checkmark 0.5s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
