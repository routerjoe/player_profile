/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "var(--brand-green)", dark: "var(--brand-green-dark)" },
        accent: { warm: "var(--accent-warm)", cool: "var(--accent-cool)", coolDark: "var(--accent-cool-dark)" },
        bg: "var(--bg)",
        fg: "var(--fg)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-bebas)", "Bebas Neue", "sans-serif"]
      },
      container: {
        center: true,
        padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }
      }
    }
  },
  plugins: []
};