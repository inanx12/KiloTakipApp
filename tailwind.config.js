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
        // Light theme — katmanlı yüzeyler
        light: {
          bg: "#F2F3F5",
          card: "#FFFFFF",
          elevated: "#FFFFFF",
          border: "rgba(10,10,11,0.08)",
          text: "#0A0A0B",                 // başlık %100
          subtext: "rgba(10,10,11,0.55)",  // değer %~60
          muted: "rgba(10,10,11,0.40)"     // etiket %40
        },
        // Dark theme — katmanlı yüzeyler (gölge yok, ince kenarlık)
        dark: {
          bg: "#0A0A0B",
          card: "#16161A",
          elevated: "#1F1F25",
          border: "rgba(255,255,255,0.06)",
          text: "#FFFFFF",                  // başlık %100
          subtext: "rgba(255,255,255,0.60)", // değer %60
          muted: "rgba(255,255,255,0.40)"  // etiket %40
        },
        // Tek vurgu rengi + grafik/durum renkleri (AZ kullan)
        accent: {
          blue: "#00F0FF",
          purple: "#BF55EC",
          green: "#22D17E",
          red: "#FF5C5C"
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 8px 24px -6px rgba(10, 10, 11, 0.08)',
      }
    },
  },
  plugins: [],
}
