import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";

/* Fuentes autoalojadas (SIL Open Font License). Evitan peticiones a
   Google Fonts: mejor privacidad del visitante, sin dependencia externa
   y compatibles con la CSP `font-src 'self'`. */
const instrumentSans = localFont({
  src: "./fonts/InstrumentSans-Variable.ttf",
  variable: "--font-instrument",
  display: "swap",
  weight: "100 900",
});

const inter = localFont({
  src: "./fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

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
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#121417" },
  ],
};

/** Evita parpadeo de tema: aplica dark antes del primer paint. */
const themeInitScript = `(function(){try{var p=JSON.parse(localStorage.getItem("privacyos.prefs.v1"))||{};var t=p.theme||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.classList.toggle("contrast-high",p.contrast==="alto");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${instrumentSans.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
