import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf6",
          100: "#d6f7e8",
          200: "#aeeed4",
          300: "#78e0ba",
          400: "#3fc99a",
          500: "#1aad7d",
          600: "#0c7756",
          700: "#0a6348",
          800: "#08503b",
          900: "#073f2f",
          950: "#04241b",
        },
        ink: {
          50: "#f6f7f8",
          100: "#eceef0",
          200: "#cfd6dd",
          300: "#9aa5b1",
          400: "#52606d",
          500: "#47535e",
          600: "#3b454e",
          700: "#2d353c",
          800: "#242b32",
          900: "#151a1f",
          950: "#0c0f12",
        },
        accent: {
          400: "#ffb84d",
          500: "#ff9f1c",
          600: "#e8850a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
