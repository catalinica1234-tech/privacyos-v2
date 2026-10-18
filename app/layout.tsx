import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";

export const metadata: Metadata = {
  title: {
    default: "PRIVACYOS — Inteligencia práctica para la privacidad digital",
    template: "%s · PRIVACYOS",
  },
  description:
    "Analiza la privacidad de sitios web frente a la Ley 19.628, la próxima Ley 21.719 y el RGPD: evidencia técnica observada, score explicable y plan de acción priorizado.",
  applicationName: "PRIVACYOS",
  keywords: ["privacidad", "protección de datos", "Ley 21.719", "Ley 19.628", "RGPD", "análisis de seguridad web"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#121417" },
  ],
};

/** Evita parpadeo de tema: aplica dark antes del primer paint. */
const themeInitScript = `(function(){try{var p=JSON.parse(localStorage.getItem("privacyos.prefs.v1"))||{};var t=p.theme||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
