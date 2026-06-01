import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#1D3F1F",
          primary: "#05B04C",
          accent: "#C5D92D",
          light: "#F4F3EB"
        }
      },
      borderRadius: {
        premium: "1rem"
      }
    }
  },
  plugins: []
};

export default config;
