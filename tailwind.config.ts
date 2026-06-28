import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        safety: {
          green: "#16803c",
          amber: "#f59e0b",
          red: "#dc2626",
          ink: "#172033",
          soft: "#f5f7fb"
        }
      },
      boxShadow: {
        card: "0 18px 45px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
