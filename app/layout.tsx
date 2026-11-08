import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E9E4D8" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "ESPACIO Q · Salón de Belleza en Madrid",
    template: "%s · ESPACIO Q Madrid",
  },
  description:
    "Un espacio para cuidar de ti en Madrid. Salón de belleza contemporáneo con reserva online por servicio y profesional.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "ESPACIO Q",
    title: "ESPACIO Q · Salón de Belleza en Madrid",
    description:
      "Un espacio para cuidar de ti en Madrid. Estilismo, cuidado capilar y rituales de belleza personalizados.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        {children}
      </body>
    </html>
  );
}
