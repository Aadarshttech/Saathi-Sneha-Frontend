/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red:        "#2a9d8f",  // teal primary — from logo
          "red-dark": "#1e7a6d",  // teal dark — hover states
          blue:       "#2980B9",
          green:      "#6aab5e",  // leaf green — from logo
          gold:       "#D4A017",
          forest:     "#4a7c6b",  // forest green — Sneha Care tone
          dark:       "#1a2e2b",  // deep teal-dark — headings
          muted:      "#5a7a75",  // teal-muted — secondary text
          surface:    "#f0f7f5",  // light teal tint — page backgrounds
          border:     "#c8ddd9",  // teal-tinted border
        },
        sahayata: {
          red: "#2a9d8f",
          blue: "#2980B9",
          green: "#6aab5e",
          gold: "#D4A017"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        nepali: ["Noto Sans Devanagari", "sans-serif"]
      }
    }
  },
  plugins: []
}
