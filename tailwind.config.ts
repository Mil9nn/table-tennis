import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#353535",      // Dark gray
          teal: "#3c6e71",      // Primary accent
          light: "#d9d9d9",     // Light gray
          blue: "#284b63",      // Secondary accent/hover
        },
      },
    },
  },
  plugins: [],
};

export default config;
