import type { Config } from "tailwindcss";

/**
 * PRIVACYOS — Identidad «Serenidad»
 * Marfil / grafito / verde bosque / menta.
 * Los colores viven en variables CSS (app/globals.css) para soportar
 * modo claro y oscuro sin duplicar clases.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--c-canvas)",
        card: "var(--c-card)",
        ink: "var(--c-ink)",
        muted: "var(--c-muted)",
        line: "var(--c-line)",
        "line-soft": "var(--c-line-soft)",
        bosque: "var(--c-bosque)",
        bosqueSoft: "var(--c-bosque-soft)",
        menta: "var(--c-menta)",
        mentaSoft: "var(--c-menta-soft)",
        marfil: "var(--c-marfil)",
        riskLow: "var(--c-risk-low)",
        riskLowSoft: "var(--c-risk-low-soft)",
        riskMed: "var(--c-risk-med)",
        riskMedSoft: "var(--c-risk-med-soft)",
        riskHigh: "var(--c-risk-high)",
        riskHighSoft: "var(--c-risk-high-soft)",
        riskCrit: "var(--c-risk-crit)",
        riskCritSoft: "var(--c-risk-crit-soft)",
      },
      fontFamily: {
        disp: ["\"Instrument Sans\"", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(25,26,32,0.04), 0 10px 30px rgba(25,26,32,0.06)",
        lift: "0 2px 4px rgba(25,26,32,0.05), 0 16px 44px rgba(25,26,32,0.09)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};

export default config;
