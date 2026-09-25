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
      },
      keyframes: {
        "send-fly": {
          "0%": { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: "1" },
          "40%": { transform: "translate(6px,-3px) scale(1.25) rotate(12deg)", opacity: "0.85" },
          "100%": { transform: "translate(18px,-10px) scale(0.7) rotate(35deg)", opacity: "0" }
        },
        "send-fly-rtl": {
          "0%": { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: "1" },
          "40%": { transform: "translate(-6px,-3px) scale(1.25) rotate(-12deg)", opacity: "0.85" },
          "100%": { transform: "translate(-18px,-10px) scale(0.7) rotate(-35deg)", opacity: "0" }
        },
        "success-pop": {
          "0%": { transform: "scale(0.3) rotate(-20deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" }
        },
        "success-ring": {
          "0%": { transform: "scale(0.5)", opacity: "0.8" },
          "100%": { transform: "scale(1.8)", opacity: "0" }
        }
      },
      animation: {
        "send-fly": "send-fly 550ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "send-fly-rtl": "send-fly-rtl 550ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "success-pop": "success-pop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "success-ring": "success-ring 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards"
      }
    }
  },
  plugins: []
};

export default config;
