import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fff8ec",
        ink: "#2b241c",
        leaf: "#557a46",
        peach: "#f2a36b",
        skywash: "#d8eef2",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 18px 45px rgba(43, 36, 28, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
