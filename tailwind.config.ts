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
          primary: "#09B14B",
          accent: "#C5D92D",
          light: "#F4F3EB"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(29, 63, 31, 0.08)",
        premium: "0 20px 60px rgba(29, 63, 31, 0.14)"
      },
      borderRadius: {
        premium: "1rem"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top, rgba(197, 217, 45, 0.36), rgba(244, 243, 235, 0.9) 40%, #ffffff 100%)",
        "cta-gradient": "linear-gradient(130deg, #1D3F1F, #09B14B 65%, #C5D92D)"
      }
    }
  },
  plugins: []
};

export default config;
