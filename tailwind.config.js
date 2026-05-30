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
        // ---- Light theme (token eşi dark ile birebir, sadece değerler değişir) ----
        light: {
          bg: "#F4F5F7",        // arka plan
          card: "#FFFFFF",      // kart
          elevated: "#FFFFFF",  // vurgulu katman
          border: "rgba(0,0,0,0.08)",
          text: "#0A0A0B",                 // %100 başlık
          value: "rgba(10,10,11,0.62)",    // %60 değer
          subtext: "rgba(10,10,11,0.42)"   // %40 etiket
        },
        // ---- Dark theme (önce mükemmelleştirilen) ----
        dark: {
          bg: "#0A0A0B",        // arka plan
          card: "#16161A",      // kart
          elevated: "#1F1F25",  // vurgulu katman
          border: "rgba(255,255,255,0.06)",
          text: "#FFFFFF",                  // %100 başlık
          value: "rgba(255,255,255,0.60)",  // %60 değer
          subtext: "rgba(255,255,255,0.40)" // %40 etiket
        },
        // ---- Tek vurgu rengi + durum renkleri (az kullanılır) ----
        accent: {
          blue: "#00F0FF",   // birincil vurgu
          purple: "#BF55EC", // 7 günlük ortalama
          green: "#30E0A1",  // kilo verme (-)
          red: "#FF5A5F"     // kilo alma (+)
        }
      },
      borderRadius: {
        'xl': '0.875rem',  // 14px
        '2xl': '1rem',     // 16px
        '3xl': '1.5rem',   // 24px
      },
      spacing: {
        '4.5': '1.125rem', // 18px
        '5.5': '1.375rem', // 22px
      }
    },
  },
  plugins: [],
}
