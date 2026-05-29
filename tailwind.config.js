/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light Theme Colors
        light: {
          bg: "#F8F9FA",
          card: "#FFFFFF",
          border: "#E9ECEF",
          text: "#212529",
          subtext: "#6C757D"
        },
        // Dark Theme Colors
        dark: {
          bg: "#08080C",
          card: "#15151F",
          border: "#232335",
          text: "#FFFFFF",
          subtext: "#9A9AB0"
        },
        // Universal Accents
        accent: {
          blue: "#00F0FF",
          purple: "#BF55EC",
          green: "#00FF87",
          red: "#FF3B30"
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
