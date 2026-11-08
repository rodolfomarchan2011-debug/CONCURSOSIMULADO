import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f7fa",
          100: "#e9edf3",
          200: "#cfd8e5",
          300: "#a7b6ca",
          400: "#7689a5",
          500: "#556a86",
          600: "#41526a",
          700: "#354256",
          800: "#2b3547",
          900: "#1f2733",
        },
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#b6d9ff",
          300: "#85bdff",
          400: "#4d9bff",
          500: "#2678f2",
          600: "#175bc7",
          700: "#14479c",
          800: "#163d7d",
          900: "#163664",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.06), 0 8px 24px -12px rgba(16, 24, 40, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
