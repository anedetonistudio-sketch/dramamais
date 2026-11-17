import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#ff2e63", dark: "#d6194c", gold: "#ffc94a" },
        ink: { DEFAULT: "#0b0b10", 2: "#14141c", 3: "#1e1e29" },
      },
    },
  },
  plugins: [],
};
export default config;
