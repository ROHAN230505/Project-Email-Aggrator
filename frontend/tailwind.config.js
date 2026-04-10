/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          card: "rgba(255,255,255,0.04)",
          hover: "rgba(255,255,255,0.07)",
        },
        accent: {
          purple: "#7c3aed",
          blue: "#3b82f6",
          cyan: "#06b6d4",
        },
      },
      boxShadow: {
        glow: "0 0 30px rgba(124,58,237,0.35)",
        "glow-blue": "0 0 30px rgba(59,130,246,0.35)",
        "glow-cyan": "0 0 30px rgba(6,182,212,0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease both",
        "slide-up": "slideUp 0.4s ease both",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
}

