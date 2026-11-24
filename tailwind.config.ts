import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        paper: {
          50: "#FDFCF8",
          100: "#FAF8F3",
          200: "#F2EDE3",
          300: "#E4DDD0",
        },
        ink: {
          900: "#1C1917",
          800: "#292524",
          700: "#44403C",
          600: "#57534E",
          500: "#78716C",
        },
        blueprint: {
          950: "#0B1220",
          900: "#111A2E",
          800: "#182540",
          700: "#24375C",
        },
        pv: {
          DEFAULT: "#C94032",
          light: "#FBEAE8",
          dark: "#9B2C20",
        },
        ph: {
          DEFAULT: "#1E56A0",
          light: "#E7F0FA",
          dark: "#153D75",
        },
        lt: {
          DEFAULT: "#0F766E",
          light: "#E6F5F3",
        },
        bisector: {
          DEFAULT: "#B45309",
          light: "#FEF3C7",
        },
      },
      boxShadow: {
        draft: "0 1px 2px rgba(28, 25, 23, 0.05), 0 8px 24px -10px rgba(28, 25, 23, 0.08)",
        sheet: "0 -10px 30px -10px rgba(28, 25, 23, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
