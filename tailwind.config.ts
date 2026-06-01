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
          dark: "#0F110E",
          primary: "#F4B324", // Premium Amber/Orange from build.sa
          accent: "#C5D92D",
          light: "#F8F9F7",
          surface: "#FDFDFD"
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
