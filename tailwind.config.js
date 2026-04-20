/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#1a1a1a", // Deep Space Grey
        foreground: "#ffffff",
        primary: {
          DEFAULT: "#00d4aa", // Aurora Green
          foreground: "#1a1a1a",
          hover: "#00b38f",
        },
        card: {
          DEFAULT: "#252525",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#404040",
          foreground: "#a0a0a0",
        },
        accent: {
          DEFAULT: "#00d4aa",
          foreground: "#1a1a1a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      fontFamily: {
        sans: ['"SF Pro"', "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
